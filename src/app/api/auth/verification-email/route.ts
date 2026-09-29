import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { verificationIpRateLimit, verificationUserRateLimit, getIp } from "@/lib/rate-limit";
import { parseJsonRequest, sessionRequestSchema } from "@/lib/validation";
import { RequestValidationError } from "@/lib/http";
import { sendVerificationEmail } from "@/lib/email/send-verification";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const ipLimit = await verificationIpRateLimit.limit(getIp(request));
    if (!ipLimit.success) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    const { idToken } = await parseJsonRequest(request, sessionRequestSchema);
    let uid: string;
    try {
      uid = (await adminAuth.verifyIdToken(idToken, true)).uid;
    } catch {
      return NextResponse.json({ error: "Please sign in again before requesting a verification email." }, { status: 401 });
    }
    const user = await adminAuth.getUser(uid);
    if (user.disabled || !user.email) return NextResponse.json({ error: "This account cannot receive a verification email." }, { status: 403 });
    if (user.emailVerified) return NextResponse.json({ success: true, alreadyVerified: true });
    const userLimit = await verificationUserRateLimit.limit(uid);
    if (!userLimit.success) return NextResponse.json({ error: "Please wait 60 seconds before requesting another verification email." }, { status: 429 });
    // The recipient and name come from Firebase, never from client-supplied fields.
    await sendVerificationEmail(user.email, user.displayName);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof RequestValidationError) return NextResponse.json({ error: error.message }, { status: error.status });
    // Do not log tokens, action links, SMTP credentials, or provider responses.
    console.error("Verification email delivery failed.");
    return NextResponse.json({ error: "We couldn't send the verification email. Please try again later or contact support." }, { status: 503 });
  }
}
