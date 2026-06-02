import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY || "";

// Warn in development if secret is missing
if (process.env.NODE_ENV === "development" && !RECAPTCHA_SECRET) {
  console.warn(
    "[Vera] RECAPTCHA_SECRET_KEY is not set. reCAPTCHA verification will be skipped in development."
  );
}

async function verifyRecaptcha(token: string): Promise<{ success: boolean; score: number }> {
  // Allow bypass in development if no key configured
  if (!RECAPTCHA_SECRET) {
    console.warn("[Vera] Skipping reCAPTCHA — no secret key configured.");
    return { success: true, score: 1.0 };
  }

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${encodeURIComponent(RECAPTCHA_SECRET)}&response=${encodeURIComponent(token)}`,
    });

    const data = await res.json();
    return {
      success: data.success === true,
      score: typeof data.score === "number" ? data.score : 0,
    };
  } catch (error) {
    console.error("[Vera] reCAPTCHA verification error:", error);
    // Fail open or closed? Closed — if verification fails, reject.
    return { success: false, score: 0 };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, message, recaptchaToken } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    // Verify reCAPTCHA token
    if (!recaptchaToken) {
      return NextResponse.json(
        { error: "Missing reCAPTCHA token." },
        { status: 400 }
      );
    }

    const { success, score } = await verifyRecaptcha(recaptchaToken);

    if (!success || score < 0.5) {
      return NextResponse.json(
        { error: "Spam detected" },
        { status: 403 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: "Message is too long. Maximum 5,000 characters." },
        { status: 400 }
      );
    }

    await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        message: message.trim(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to save message. Please try again." },
      { status: 500 }
    );
  }
}