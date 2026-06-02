import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAdminSupabase, createServerSupabase } from "@/lib/supabase-server";

const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY || "";

async function verifyRecaptcha(
  token: string
): Promise<{ success: boolean; score: number }> {
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
  } catch {
    console.error("[Vera] reCAPTCHA verification error");
    return { success: false, score: 0 };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, recaptchaToken } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    // Verify reCAPTCHA
    if (!recaptchaToken) {
      return NextResponse.json(
        { error: "Missing reCAPTCHA token." },
        { status: 400 }
      );
    }

    const { success, score } = await verifyRecaptcha(recaptchaToken);

    if (!success || score < 0.5) {
      return NextResponse.json({ error: "Spam detected" }, { status: 403 });
    }

    // Register user with Supabase signUp (sends confirmation email)
    const supabase = await createServerSupabase();
    const origin = process.env.NEXT_PUBLIC_SITE_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        emailRedirectTo: `${origin}/api/auth/callback`,
      },
    });

    if (signUpError) {
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      );
    }

    if (data.user) {
      // Sync to Prisma
      try {
        await prisma.user.upsert({
          where: { email: data.user.email! },
          update: {},
          create: {
            id: data.user.id,
            email: data.user.email!,
            free_scans_used: 0,
          },
        });
      } catch {
        // Non-blocking
      }
    }

    return NextResponse.json({
      success: true,
      message: "Account created. Please check your email to verify.",
    });
  } catch (error) {
    console.error("Register error:", error);
    const message =
      error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Registration failed: ${message}` },
      { status: 500 }
    );
  }
}