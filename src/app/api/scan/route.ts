import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase/admin";
import { parsePdfBuffer } from "@/lib/pdf-parser";
import { analyzeContract } from "@/lib/contract-analyzer";
import { FieldValue } from "firebase-admin/firestore";
import { scanRateLimit, getIp } from "@/lib/rate-limit";
import { formatErrorMessage } from "@/lib/error-handler";

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
    const ip = getIp(request);
    const { success } = await scanRateLimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

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
          { status: 413 }
        );
      }
      documentName = file.name;
      const buffer = await file.arrayBuffer();

      // Magic Number Validation for %PDF (0x25 0x50 0x44 0x46)
      const header = new Uint8Array(buffer, 0, 4);
      if (header.length < 4 || header[0] !== 0x25 || header[1] !== 0x50 || header[2] !== 0x44 || header[3] !== 0x46) {
        return NextResponse.json(
          { error: "Invalid file format. Only true PDF files are allowed." },
          { status: 415 }
        );
      }

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
      if (textInput.length > 100000) {
        return NextResponse.json(
          { error: "Pasted text is too long (limit: 100,000 characters)" },
          { status: 413 }
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
        bonus_scans: 0,
        subscription_status: "inactive",
        created_at: new Date().toISOString(),
      };
      await userRef.set(newUserData);
      userData = { id: uid, ...newUserData };
    }

    // Calculate total allowed scans: base free scans + any purchased bonus scans
    const totalAllowedScans = MAX_FREE_SCANS + (userData.bonus_scans || 0);
    const canUseFree =
      userData.subscription_status === "active" ||
      (userData.free_scans_used || 0) < totalAllowedScans;

    const scansRef = userRef.collection("scans");

    // If free scans used up and no active subscription, return payment required
    if (!canUseFree) {
      return NextResponse.json({
        error: "Free scans exhausted",
        requires_payment: true,
        free_scans_remaining: 0,
      }, { status: 402 });
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
      
    if (aiResult.suggestedTitle && aiResult.suggestedTitle !== "Unknown Document") {
      finalDocumentName = aiResult.suggestedTitle;
    }

    const newScanRef = scansRef.doc();
    await newScanRef.set({
      document_name: finalDocumentName,
      original_file_name: documentName,
      suggested_title: aiResult.suggestedTitle || "Unknown Document",
      ai_result: aiResult,
      payment_status: userData.subscription_status === "active" ? "subscription" : "free",
      risk_score: riskScore,
      created_at: new Date().toISOString(),
    });

    const remaining = userData.subscription_status === "active"
      ? Infinity
      : totalAllowedScans - (userData.free_scans_used || 0);

    const hasPurchased = (userData.bonus_scans || 0) > 0;
    const packSize = hasPurchased ? 5 : 1;

    return NextResponse.json({
      scan_id: newScanRef.id,
      ...aiResult,
      free_scans_remaining: Math.max(0, remaining),
      max_free_scans: packSize,
    });
  } catch (error) {
    console.error("Scan error:", error);
    const message = formatErrorMessage(error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
