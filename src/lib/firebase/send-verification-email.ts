import type { User } from "firebase/auth";

export async function sendBrandedVerificationEmail(user: User) {
  const idToken = await user.getIdToken();
  const response = await fetch("/api/auth/verification-email", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.error || "Failed to send verification email.");
  if (data.alreadyVerified) throw new Error("Your email is already verified. Click “I've verified my email” to continue, or sign in again.");
}
