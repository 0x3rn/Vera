import { cookies } from "next/headers";
import { adminAuth, adminDb } from "./firebase/admin";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userRecord = await adminAuth.getUser(decodedClaims.uid);
    
    // Fetch db user record
    const userDoc = await adminDb.collection("users").doc(decodedClaims.uid).get();
    const dbUser: any = userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null;

    return {
      uid: decodedClaims.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      dbUser
    };
  } catch (error) {
    return null;
  }
}
