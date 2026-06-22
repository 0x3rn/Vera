import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function POST(req: Request) {
  try {
    const { email, password, firstName, lastName, recaptchaToken } = await req.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

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

    // 1. Create user in Firebase Auth via Admin SDK
    const displayName = `${firstName.trim()} ${lastName.trim()}`;
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    // 2. Initialize Firestore document
    await adminDb.collection("users").doc(userRecord.uid).set({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: userRecord.email,
      free_scans_used: 0,
      subscription_status: "inactive",
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, uid: userRecord.uid });
  } catch (error: any) {
    console.error("Registration error:", error);
    // Return Firebase error message if available, otherwise generic error
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during registration." },
      { status: 500 }
    );
  }
}
