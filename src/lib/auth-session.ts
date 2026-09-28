export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

const INVALID_SESSION_ERROR_CODES = new Set([
  "auth/argument-error",
  "auth/id-token-expired",
  "auth/id-token-revoked",
  "auth/invalid-session-cookie",
  "auth/session-cookie-expired",
  "auth/session-cookie-revoked",
  "auth/user-disabled",
  "auth/user-not-found",
]);

export function isInvalidSessionError(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }

  return INVALID_SESSION_ERROR_CODES.has(String(error.code));
}
