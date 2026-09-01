import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase/admin";
import { parsePdfBuffer } from "@/lib/pdf-parser";
import { analyzeContract } from "@/lib/contract-analyzer";
import { scanRateLimit, getIp } from "@/lib/rate-limit";
import { getRemainingScans, releaseScan, reserveScan, ScanEntitlementError, settleScan } from "@/lib/scan-entitlements";
import { noStoreHeaders } from "@/lib/http";

export const maxDuration = 60;

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const MAX_TEXT_LENGTH = 100_000;
const MAX_PDF_PAGES = 30;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: noStoreHeaders() });
}

export async function POST(request: NextRequest) {
  let reservation: { uid: string; id: string } | null = null;

  try {
    const { success } = await scanRateLimit.limit(getIp(request));
    if (!success) return json({ error: "Too many requests" }, 429);

    const user = await getCurrentUser();
    if (!user) return json({ error: "Unauthorized" }, 401);
    if (!user.emailVerified) {
      return json({ error: "Verify your email before scanning.", code: "EMAIL_NOT_VERIFIED" }, 403);
    }

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_FILE_SIZE + 256 * 1024) return json({ error: "Upload must be 4MB or smaller." }, 413);

    const formData = await request.formData();
    const fileValue = formData.get("file");
    const textValue = formData.get("text");
    const file = fileValue instanceof File ? fileValue : null;
    const textInput = typeof textValue === "string" ? textValue : null;

    let contractText = "";
    let documentName = "Pasted text";

    if (file) {
      if (file.type !== "application/pdf") return json({ error: "Only PDF files are supported." }, 415);
      if (file.size > MAX_FILE_SIZE) return json({ error: "PDF must be 4MB or smaller." }, 413);
      const buffer = await file.arrayBuffer();
      const header = new Uint8Array(buffer, 0, 4);
      if (header.length < 4 || header[0] !== 0x25 || header[1] !== 0x50 || header[2] !== 0x44 || header[3] !== 0x46) {
        return json({ error: "The uploaded file is not a valid PDF." }, 415);
      }
      const parsed = await parsePdfBuffer(buffer);
      if (parsed.pages > MAX_PDF_PAGES) return json({ error: `PDF has ${parsed.pages} pages; the limit is ${MAX_PDF_PAGES}.` }, 413);
      contractText = parsed.text.trim();
      documentName = file.name.slice(0, 180) || "Contract.pdf";
    } else if (textInput !== null) {
      contractText = textInput.trim();
      const snippet = contractText.slice(0, 30).replace(/[\r\n]+/g, " ").replace(/[^\p{L}\p{N} ]/gu, "").trim();
      documentName = snippet ? `Text: ${snippet}…` : "Pasted text";
    } else {
      return json({ error: "Add a PDF or paste contract text." }, 400);
    }

    if (contractText.length < 100) return json({ error: "Contract text must be at least 100 characters." }, 422);
    if (contractText.length > MAX_TEXT_LENGTH) return json({ error: "Contract text exceeds the 100,000-character analysis limit." }, 413);

    const userRef = adminDb.collection("users").doc(user.uid);
    if (!user.dbUser) {
      await userRef.set({
        email: user.email || "",
        free_scans_used: 0,
        bonus_scans: 0,
        subscription_status: "inactive",
        created_at: new Date().toISOString(),
      }, { merge: true });
    }

    const suppliedKey = request.headers.get("x-idempotency-key");
    const requestId = suppliedKey && /^[A-Za-z0-9_-]{16,80}$/.test(suppliedKey)
      ? suppliedKey
      : userRef.collection("scans").doc().id;
    const existingScan = await userRef.collection("scans").doc(requestId).get();
    if (existingScan.exists) {
      const stored = existingScan.data() || {};
      const storedResult = stored.ai_result;
      if (!storedResult || typeof storedResult !== "object") throw new Error("Stored scan result is invalid.");
      const remaining = getRemainingScans(user.dbUser);
      return json({
        scan_id: requestId,
        ...storedResult as Record<string, unknown>,
        free_scans_remaining: remaining,
        max_free_scans: remaining === null ? null : 1 + Math.max(0, Number(user.dbUser?.bonus_scans) || 0),
      });
    }
    const scanReservation = await reserveScan(user.uid, requestId);
    if (scanReservation.alreadyInProgress) {
      return json({ error: "This scan request is already being processed. Please wait before retrying." }, 409);
    }
    reservation = { uid: user.uid, id: requestId };

    const aiResult = await analyzeContract(contractText);
    const finalDocumentName = aiResult.suggestedTitle && aiResult.suggestedTitle !== "Unknown Document"
      ? aiResult.suggestedTitle
      : documentName;
    await settleScan(user.uid, requestId, {
      document_name: finalDocumentName,
      original_file_name: documentName,
      suggested_title: aiResult.suggestedTitle,
      ai_result: aiResult,
      payment_status: scanReservation.isPro ? "subscription" : "credit",
      risk_score: aiResult.overallRiskScore,
      created_at: new Date().toISOString(),
    });
    reservation = null;

    return json({
      scan_id: requestId,
      ...aiResult,
      free_scans_remaining: scanReservation.remaining,
      max_free_scans: scanReservation.isPro ? null : 1 + Math.max(0, Number(user.dbUser?.bonus_scans) || 0),
    });
  } catch (error) {
    if (reservation) {
      try {
        await releaseScan(reservation.uid, reservation.id);
      } catch (releaseError) {
        console.error("[Scan] Failed to release reservation", { reservation, releaseError });
      }
    }
    if (error instanceof ScanEntitlementError) {
      return json({ error: error.message, requires_payment: true, free_scans_remaining: 0 }, 402);
    }
    console.error("[Scan] Request failed", error);
    return json({ error: "The contract could not be analyzed. Your scan was not charged; please try again." }, 502);
  }
}
