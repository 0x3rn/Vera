import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { firstName, lastName } = await req.json();

    if (!firstName || !lastName) {
      return NextResponse.json({ error: "First and last name are required." }, { status: 400 });
    }

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    // 1. Update Firebase Auth Profile
    await adminAuth.updateUser(user.uid, {
      displayName: `${trimmedFirst} ${trimmedLast}`,
    });

    // 2. Update Firestore Document
    await adminDb.collection("users").doc(user.uid).update({
      first_name: trimmedFirst,
      last_name: trimmedLast,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile." },
      { status: 500 }
    );
  }
}
