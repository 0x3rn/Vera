import { NextRequest, NextResponse } from "next/server";
import { parsePdfBuffer } from "@/lib/pdf-parser";
import { analyzeContract } from "@/lib/contract-analyzer";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export async function POST(request: NextRequest) {
  try {
    // Check for paid session cookie (Stripe paywall)
    const paidSessionId = request.cookies.get("vera_paid_session")?.value;
    if (!paidSessionId) {
      return NextResponse.json(
        { error: "Payment required", requiresPayment: true },
        { status: 402 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const textInput = formData.get("text") as string | null;

    let contractText: string;

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

      const buffer = await file.arrayBuffer();
      const text = await parsePdfBuffer(buffer);

      if (!text || text.trim().length < 100) {
        return NextResponse.json(
          {
            error: "Could not extract text from this PDF",
            details:
              "The PDF may be image-based (scanned). Please upload a text-based PDF.",
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

    // Limit text length to avoid excessive token usage
    const truncatedText = contractText.slice(0, 25000);

    const analysis = await analyzeContract(truncatedText);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json(
      { error: "Failed to scan the contract. Please try again." },
      { status: 500 }
    );
  }
}