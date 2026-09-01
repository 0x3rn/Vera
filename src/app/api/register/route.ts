import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { authRateLimit, getIp } from "@/lib/rate-limit";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { parseJsonRequest, registrationRequestSchema } from "@/lib/validation";
import { RequestValidationError } from "@/lib/http";

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com", "yopmail.com",
  "throwaway.email", "sharklasers.com", "temp-mail.org", "maildrop.cc", "trashmail.com",
  "dispostable.com", "getnada.com", "fakeinbox.com", "mohmal.com", "mintemail.com",
]);

export async function POST(request: NextRequest) {
  let createdUid: string | null = null;
  try {
    const ip = getIp(request);
    const { success } = await authRateLimit.limit(ip);
    if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const data = await parseJsonRequest(request, registrationRequestSchema);
    if (data.websiteUrl) return NextResponse.json({ success: true, uid: "accepted" });

    const domain = data.email.split("@")[1];
    if (domain && DISPOSABLE_DOMAINS.has(domain)) {
      return NextResponse.json({ error: "Disposable email addresses are not allowed." }, { status: 400 });
    }

    const recaptcha = await verifyRecaptcha(data.recaptchaToken, "register_form", ip);
    if (!recaptcha.ok) {
      const unavailable = recaptcha.reason === "missing-config" || recaptcha.reason === "unavailable";
      return NextResponse.json(
        { error: unavailable ? "Spam protection is temporarily unavailable." : "Spam verification failed." },
        { status: unavailable ? 503 : 403 },
      );
    }

    const userRecord = await adminAuth.createUser({
      email: data.email,
      password: data.password,
      displayName: `${data.firstName} ${data.lastName}`,
    });
    createdUid = userRecord.uid;
    await adminDb.collection("users").doc(userRecord.uid).create({
      first_name: data.firstName,
      last_name: data.lastName,
      email: userRecord.email,
      free_scans_used: 0,
      bonus_scans: 0,
      subscription_status: "inactive",
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, uid: userRecord.uid });
  } catch (error) {
    if (createdUid) {
      try { await adminAuth.deleteUser(createdUid); } catch (rollbackError) { console.error("Registration rollback failed:", rollbackError); }
    }
    if (error instanceof RequestValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code.includes("email-already-exists")) {
      return NextResponse.json({ error: "An account already exists for this email." }, { status: 409 });
    }
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration could not be completed." }, { status: 500 });
  }
}
