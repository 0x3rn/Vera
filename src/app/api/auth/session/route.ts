import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { authRateLimit, getIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = getIp(request);
    const { success } = await authRateLimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing ID token" }, { status: 400 });
    }

    // Verify token to get user details
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    // Auto-create Firestore user document for Google Sign-Ins
    const userRef = adminDb.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      const nameParts = (decodedToken.name || "").split(" ");
      const firstName = nameParts[0] || "User";
      const lastName = nameParts.slice(1).join(" ") || "";

      await userRef.set({
        email: email || "",
        first_name: firstName,
        last_name: lastName,
        free_scans_used: 0,
        subscription_status: "inactive",
        created_at: new Date().toISOString(),
      });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const cookieStore = await cookies();
    cookieStore.set("session", sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Session creation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
