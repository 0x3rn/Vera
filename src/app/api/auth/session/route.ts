import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { authRateLimit, getIp } from "@/lib/rate-limit";
import { parseJsonRequest, sessionRequestSchema } from "@/lib/validation";
import { RequestValidationError } from "@/lib/http";

export async function POST(request: NextRequest) {
  try {
    const ip = getIp(request);
    const { success } = await authRateLimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { idToken } = await parseJsonRequest(request, sessionRequestSchema);

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
        bonus_scans: 0,
        subscription_status: "inactive",
        created_at: new Date().toISOString(),
      });
    } else {
      // Sync email from auth to firestore if changed
      const dbEmail = userDoc.data()?.email;
      if (email && dbEmail !== email) {
        await userRef.update({ email });
      }
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const cookieStore = await cookies();
    cookieStore.set("session", sessionCookie, {
      expires: new Date(Date.now() + expiresIn),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Session creation error:", error);
    return NextResponse.json({ error: "Unable to create a session." }, { status: 401 });
  }
}
