import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { parseJsonRequest, profileRequestSchema } from "@/lib/validation";
import { RequestValidationError } from "@/lib/http";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.emailVerified) {
      return NextResponse.json({ error: "Verify your email first.", code: "EMAIL_NOT_VERIFIED" }, { status: 403 });
    }

    const { firstName, lastName } = await parseJsonRequest(req, profileRequestSchema);

    // 1. Update Firebase Auth Profile
    await adminAuth.updateUser(user.uid, {
      displayName: `${firstName} ${lastName}`,
    });

    // 2. Update Firestore Document
    await adminDb.collection("users").doc(user.uid).update({
      first_name: firstName,
      last_name: lastName,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
