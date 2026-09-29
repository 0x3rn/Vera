import { applyActionCode, checkActionCode } from "firebase/auth";
import { auth, isFirebaseConfigured } from "./client";

export type EmailActionResult = { destination: string; message: string };

export async function completeEmailAction(mode: string, code: string): Promise<EmailActionResult> {
  const operation = mode === "verifyEmail" ? "VERIFY_EMAIL"
    : mode === "verifyAndChangeEmail" ? "VERIFY_AND_CHANGE_EMAIL" : null;
  if (!operation) throw new Error("This email action is not supported. Please request a new verification link.");
  if (!code) throw new Error("This verification link is incomplete. Please request a new link.");
  if (!isFirebaseConfigured) throw new Error("Email verification is temporarily unavailable. Please try again later.");

  const action = await checkActionCode(auth, code);
  if (action.operation !== operation) throw new Error("This verification link is invalid. Please request a new link.");
  await applyActionCode(auth, code);

  // Verification works in another browser too; signing in is a separate step.
  const fallback = {
    destination: "/login?clear_session=true",
    message: "Your email has been verified. Sign in to continue to your dashboard.",
  };
  try {
    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user) return fallback;
    await user.reload();
    if (!user.emailVerified || user.email !== action.data.email) return fallback;
    const idToken = await user.getIdToken(true);
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!response.ok) return fallback;
    return { destination: "/dashboard", message: "Your email has been verified. You can now access your dashboard." };
  } catch {
    // A session failure must not report an already-applied code as a failed verification.
    return fallback;
  }
}

export function emailActionError(error: unknown): string {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  if (code === "auth/expired-action-code" || code === "auth/invalid-action-code") {
    return "This verification link has expired or has already been used. Sign in to check your account or request a new link.";
  }
  if (code === "auth/network-request-failed") return "Unable to connect. Check your connection and reopen this link.";
  if (code) return "We could not verify your email. Please sign in and request a new link.";
  return error instanceof Error ? error.message : "We could not verify your email. Please request a new link.";
}
