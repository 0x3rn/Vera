import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { checkIsPro } from "@/lib/subscription";

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.emailVerified) return NextResponse.json({ error: "Verify your email first." }, { status: 403 });
  if (checkIsPro(user.dbUser)) {
    return NextResponse.json({ error: "Cancel your subscription and wait for the paid period to end before deleting your account." }, { status: 409 });
  }

  try {
    await adminDb.recursiveDelete(adminDb.collection("users").doc(user.uid));
    await adminAuth.deleteUser(user.uid);
    (await cookies()).delete("session");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account deletion failed:", error);
    return NextResponse.json({ error: "Account deletion could not be completed. Please contact support." }, { status: 500 });
  }
}
