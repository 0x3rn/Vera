import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { recaptchaToken } = await req.json();

    if (process.env.RECAPTCHA_SECRET_KEY && recaptchaToken) {
      const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`;
      const recaptchaRes = await fetch(verifyUrl, { method: "POST" });
      const recaptchaJson = await recaptchaRes.json();

      if (!recaptchaJson.success || recaptchaJson.score < 0.5) {
        return NextResponse.json(
          { error: "reCAPTCHA verification failed. Please try again." },
          { status: 400 }
        );
      }
    }

    // Since Firebase Client SDK handles the actual user creation now,
    // this endpoint only validates the recaptcha and returns success.
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Registration validation error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
