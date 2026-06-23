import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase/admin";
import { parsePdfBuffer } from "@/lib/pdf-parser";
import { analyzeContract } from "@/lib/contract-analyzer";
import { initLemonSqueezy, getStoreId, getVariantId } from "@/lib/lemonsqueezy";
import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { FieldValue } from "firebase-admin/firestore";

const MAX_FREE_SCANS = 1;
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

function isGenericFilename(filename: string): boolean {
  if (filename.startsWith("Text: ")) return true;

  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  const lowerName = nameWithoutExt.toLowerCase().trim();
  
  const blacklist = [
    'contract', 'agreement', 'document', 'doc', 'scanned', 'scan', 
    'untitled', 'file', 'pasted_text', 'text_scan', 'draft'
  ];
  
  return blacklist.includes(lowerName);
}

export async function POST(request: NextRequest) {
  try {
    // Auth check using our new server helper
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { uid, email, dbUser } = user;

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
      const snippet = contractText.substring(0, 30).replace(/[\n\r]/g, " ").replace(/[^a-zA-Z0-9 ]/g, "").trim();
      documentName = snippet ? `Text: ${snippet}...` : "Pasted Text";
    } else {
      return NextResponse.json(
        { error: "No file or text provided" },
        { status: 400 }
      );
    }

    // Get or create DB user in Firestore
    const userRef = adminDb.collection("users").doc(uid);
    let userData = dbUser;

    if (!userData) {
      const newUserData = {
        email: email,
        free_scans_used: 0,
        subscription_status: "inactive",
        created_at: new Date().toISOString(),
      };
      await userRef.set(newUserData);
      userData = { id: uid, ...newUserData };
    }

    const canUseFree =
      userData.subscription_status === "active" ||
      (userData.free_scans_used || 0) < MAX_FREE_SCANS;

    const scansRef = userRef.collection("scans");

    // If free scans used up and no active subscription, generate Lemon Squeezy checkout
    if (!canUseFree) {
      const newScanRef = scansRef.doc();
      const scanData = {
        document_name: documentName,
        payment_status: "unpaid",
        risk_score: 0,
        created_at: new Date().toISOString(),
      };
      await newScanRef.set(scanData);

      try {
        initLemonSqueezy();
        const storeId = getStoreId();
        const variantId = getVariantId("onetime");
        const origin = request.headers.get("origin") || "http://localhost:3000";

        const checkout = await createCheckout(storeId, variantId, {
          checkoutData: {
            custom: {
              scan_id: newScanRef.id,
              user_id: uid, // Pass the Firebase UID to webhook
            },
          },
          productOptions: {
            redirectUrl: `${origin}/results/${newScanRef.id}?paid=true`,
          },
        });

        const checkoutData = checkout as any;
        const checkoutUrl = checkoutData?.data?.data?.attributes?.url || null;

        if (!checkoutUrl) {
          throw new Error("Failed to create checkout URL");
        }

        return NextResponse.json({
          error: "Free scans exhausted",
          requires_payment: true,
          checkout_url: checkoutUrl,
          scan_id: newScanRef.id,
          free_scans_remaining: 0,
        });
      } catch (checkoutError) {
        await newScanRef.delete();
        throw checkoutError;
      }
    }

    // Execute the AI analysis
    const truncatedText = contractText.slice(0, 25000);
    const aiResult = await analyzeContract(truncatedText);

    // Only increment free scans if not on active subscription
    if (userData.subscription_status !== "active") {
      await userRef.update({
        free_scans_used: FieldValue.increment(1),
      });
      userData.free_scans_used = (userData.free_scans_used || 0) + 1;
    }

    const riskScore = aiResult.overallRiskScore ?? 0;

    let finalDocumentName = documentName;
    const isGeneric = isGenericFilename(finalDocumentName);
      
    if (isGeneric && aiResult.suggestedTitle && aiResult.suggestedTitle !== "Unknown Document") {
      finalDocumentName = aiResult.suggestedTitle;
    }

    const newScanRef = scansRef.doc();
    await newScanRef.set({
      document_name: finalDocumentName,
      suggested_title: aiResult.suggestedTitle || "Unknown Document",
      ai_result: aiResult,
      payment_status: "free",
      risk_score: riskScore, // Assuming we want the raw 0-100 score now
      created_at: new Date().toISOString(),
    });

    const remaining = userData.subscription_status === "active"
      ? Infinity
      : MAX_FREE_SCANS - (userData.free_scans_used || 0);

    return NextResponse.json({
      scan_id: newScanRef.id,
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
