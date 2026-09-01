import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { contactRateLimit, getIp } from "@/lib/rate-limit";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { contactRequestSchema, parseJsonRequest } from "@/lib/validation";
import { RequestValidationError } from "@/lib/http";

export async function POST(request: NextRequest) {
  try {
    const ip = getIp(request);
    const { success } = await contactRateLimit.limit(ip);
    if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const data = await parseJsonRequest(request, contactRequestSchema);
    if (data.websiteUrl) return NextResponse.json({ success: true });

    const recaptcha = await verifyRecaptcha(data.recaptchaToken, "contact_form", ip);
    if (!recaptcha.ok) {
      const unavailable = recaptcha.reason === "missing-config" || recaptcha.reason === "unavailable";
      return NextResponse.json(
        { error: unavailable ? "Spam protection is temporarily unavailable." : "Spam verification failed." },
        { status: unavailable ? 503 : 403 },
      );
    }

    await adminDb.collection("contact_messages").add({
      name: data.name,
      email: data.email,
      message: data.message,
      created_at: new Date().toISOString(),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Contact form error:", error);
    return NextResponse.json({ error: "Failed to save message. Please try again." }, { status: 500 });
  }
}
