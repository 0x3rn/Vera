import { describe, expect, it } from "vitest";
import { isInvalidSessionError, SESSION_DURATION_MS } from "./auth-session";

describe("auth session policy", () => {
  it("uses a fixed seven-day session", () => {
    expect(SESSION_DURATION_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it.each([
    "auth/argument-error",
    "auth/session-cookie-expired",
    "auth/session-cookie-revoked",
    "auth/user-disabled",
    "auth/user-not-found",
  ])("recognizes %s as an invalid session", (code) => {
    expect(isInvalidSessionError({ code })).toBe(true);
  });

  it("does not classify temporary service failures as invalid sessions", () => {
    expect(isInvalidSessionError({ code: "auth/internal-error" })).toBe(false);
    expect(isInvalidSessionError(new Error("network unavailable"))).toBe(false);
  });
});
