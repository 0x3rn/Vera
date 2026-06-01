import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabase } from "@/lib/supabase-server";
import { parsePdfBuffer } from "@/lib/pdf-parser";
import { analyzeContract } from "@/lib/contract-analyzer";
import { getStripe } from "@/lib/stripe";

const MAX_FREE_SCANS = 2;
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const SCAN_PRICE_ID = process.env.STRIPE_ONETIME_PRICE_ID || "";

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const textInput = formData.get("text") as string | null;

    let contractText: string;
    let documentName = "contract.txt";

    if (file) {
      if (file.type !== "application/pdf") {
        return NextResponse.json(
          { error: "Only PDF files are supported" },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "File size must be under 15MB" },
          { status: 400 }
        );
      }
      documentName = file.name;
      const buffer = await file.arrayBuffer();
      const text = await parsePdfBuffer(buffer);

      if (!text || text.trim().length < 100) {
        return NextResponse.json(
          {
            error:
              "Could not extract text from this PDF. The PDF may be image-based.",
          },
          { status: 422 }
        );
      }
      contractText = text;
    } else if (textInput) {
      if (textInput.trim().length < 100) {
        return NextResponse.json(
          { error: "Text input must be at least 100 characters" },
          { status: 400 }
        );
      }
      contractText = textInput.trim();
    } else {
      return NextResponse.json(
        { error: "No file or text provided" },
        { status: 400 }
      );
    }

    // Get or create DB user
    const dbUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        id: user.id,
        email: user.email,
        free_scans_used: 0,
      },
    });

    const canUseFree = dbUser.free_scans_used < MAX_FREE_SCANS;

    // If free scans used up, generate Stripe checkout
    if (!canUseFree) {
      const scan = await prisma.scan.create({
        data: {
          user_id: user.id,
          document_name: documentName,
          payment_status: "unpaid",
        },
      });

      try {
        const stripe = getStripe();
        const origin = request.headers.get("origin") || "http://localhost:3000";
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          line_items: [
            {
              price: SCAN_PRICE_ID,
              quantity: 1,
            },
          ],
          metadata: {
            scanId: scan.id,
            userId: user.id,
          },
          success_url: `${origin}/results/${scan.id}?paid=true`,
          cancel_url: `${origin}/pricing`,
        });

        await prisma.scan.update({
          where: { id: scan.id },
          data: { stripe_session_id: session.id },
        });

        return NextResponse.json({
          error: "Free scans exhausted",
          requires_payment: true,
          stripe_url: session.url,
          scan_id: scan.id,
          free_scans_remaining: 0,
        });
      } catch (stripeError) {
        await prisma.scan.delete({ where: { id: scan.id } });
        throw stripeError;
      }
    }

    // Execute the AI analysis
    const truncatedText = contractText.slice(0, 25000);
    const aiResult = await analyzeContract(truncatedText);

    // Increment free scans and save
    await prisma.user.update({
      where: { id: user.id },
      data: { free_scans_used: { increment: 1 } },
    });

    const scan = await prisma.scan.create({
      data: {
        user_id: user.id,
        document_name: documentName,
        ai_result: aiResult as any,
        payment_status: "free",
      },
    });

    const remaining = MAX_FREE_SCANS - (dbUser.free_scans_used + 1);

    return NextResponse.json({
      scan_id: scan.id,
      ...aiResult,
      free_scans_remaining: Math.max(0, remaining),
      max_free_scans: MAX_FREE_SCANS,
    });
  } catch (error) {
    console.error("Scan error:", error);
    const message =
      error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Scan failed: ${message}` },
      { status: 500 }
    );
  }
}