import { cookies } from "next/headers";
import { adminAuth, adminDb } from "./firebase/admin";

export type DbUser = {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  free_scans_used?: number;
  bonus_scans?: number;
  subscription_status?: string;
  subscription_id?: string | null;
  customer_id?: string | null;
  subscription_renews_at?: string | null;
  subscription_ends_at?: string | null;
  subscription_provider_updated_at?: string | null;
  created_at?: string;
};

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
    const dbUser: DbUser | null = userDoc.exists
      ? { id: userDoc.id, ...(userDoc.data() as Omit<DbUser, "id">) }
      : null;

    return {
      uid: decodedClaims.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      displayName: userRecord.displayName,
      dbUser,
      providerIds: userRecord.providerData.map((provider) => provider.providerId),
    };
  } catch (error) {
    console.error("auth-server error:", error);
    return null;
  }
}

export async function getCurrentVerifiedUser() {
  const user = await getCurrentUser();
  return user?.emailVerified ? user : null;
}
