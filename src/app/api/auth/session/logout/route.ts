import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";

export async function POST() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  // Revoke the session server-side so stolen cookies are immediately invalidated
  if (sessionCookie) {
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
      await adminAuth.revokeRefreshTokens(decodedClaims.uid);
    } catch {
      // Session was already invalid/expired — proceed with cookie deletion
    }
  }

  cookieStore.delete("session");
  return NextResponse.json({ success: true });
}
