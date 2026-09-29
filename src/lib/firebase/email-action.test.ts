import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkActionCode: vi.fn(), applyActionCode: vi.fn(),
  auth: { authStateReady: vi.fn(), currentUser: null as null | {
    email: string; emailVerified: boolean; reload: ReturnType<typeof vi.fn>; getIdToken: ReturnType<typeof vi.fn>;
  } },
  fetch: vi.fn(),
}));
vi.mock("firebase/auth", () => ({ checkActionCode: mocks.checkActionCode, applyActionCode: mocks.applyActionCode }));
vi.mock("./client", () => ({ auth: mocks.auth, isFirebaseConfigured: true }));
import { completeEmailAction, emailActionError } from "./email-action";

describe("email verification actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal("fetch", mocks.fetch);
    mocks.checkActionCode.mockResolvedValue({ operation: "VERIFY_EMAIL", data: { email: "user@example.com" } });
    mocks.applyActionCode.mockResolvedValue(undefined);
    mocks.auth.authStateReady.mockResolvedValue(undefined);
    mocks.auth.currentUser = {
      email: "user@example.com", emailVerified: true,
      reload: vi.fn().mockResolvedValue(undefined), getIdToken: vi.fn().mockResolvedValue("fresh-token"),
    };
    mocks.fetch.mockResolvedValue({ ok: true });
  });

  it("applies the code, refreshes claims, and creates a session before offering the dashboard", async () => {
    await expect(completeEmailAction("verifyEmail", "valid-code")).resolves.toMatchObject({ destination: "/dashboard" });
    expect(mocks.applyActionCode).toHaveBeenCalledWith(mocks.auth, "valid-code");
    expect(mocks.auth.currentUser?.getIdToken).toHaveBeenCalledWith(true);
    expect(mocks.fetch).toHaveBeenCalledWith("/api/auth/session", expect.objectContaining({ body: JSON.stringify({ idToken: "fresh-token" }) }));
    expect(mocks.checkActionCode.mock.invocationCallOrder[0]).toBeLessThan(mocks.applyActionCode.mock.invocationCallOrder[0]);
    expect(mocks.applyActionCode.mock.invocationCallOrder[0]).toBeLessThan(mocks.auth.authStateReady.mock.invocationCallOrder[0]);
  });

  it("verifies in another browser without requiring a signed-in user", async () => {
    mocks.auth.currentUser = null;
    await expect(completeEmailAction("verifyEmail", "code")).resolves.toMatchObject({ destination: "/login?clear_session=true" });
    expect(mocks.applyActionCode).toHaveBeenCalledOnce();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("does not create a session for a different account", async () => {
    mocks.auth.currentUser!.email = "other@example.com";
    await expect(completeEmailAction("verifyEmail", "code")).resolves.toMatchObject({ destination: "/login?clear_session=true" });
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it.each(["reload", "getIdToken"] as const)("preserves verification success when %s fails", async method => {
    mocks.auth.currentUser![method].mockRejectedValue(new Error("Session unavailable"));
    await expect(completeEmailAction("verifyEmail", "code")).resolves.toMatchObject({ destination: "/login?clear_session=true" });
  });

  it("offers sign-in if the session endpoint rejects the refreshed token", async () => {
    mocks.fetch.mockResolvedValue({ ok: false });
    await expect(completeEmailAction("verifyEmail", "code")).resolves.toMatchObject({ destination: "/login?clear_session=true" });
  });

  it("supports verification of a changed email address", async () => {
    mocks.checkActionCode.mockResolvedValue({ operation: "VERIFY_AND_CHANGE_EMAIL", data: { email: "user@example.com" } });
    await expect(completeEmailAction("verifyAndChangeEmail", "code")).resolves.toMatchObject({ destination: "/dashboard" });
  });

  it.each([["verifyEmail", ""], ["resetPassword", "code"], ["", "code"]])("rejects malformed or unsupported actions (%s)", async (mode, code) => {
    await expect(completeEmailAction(mode, code)).rejects.toThrow();
    expect(mocks.checkActionCode).not.toHaveBeenCalled();
    expect(mocks.applyActionCode).not.toHaveBeenCalled();
  });

  it("does not apply a code for a different action", async () => {
    mocks.checkActionCode.mockResolvedValue({ operation: "PASSWORD_RESET", data: {} });
    await expect(completeEmailAction("verifyEmail", "code")).rejects.toThrow("invalid");
    expect(mocks.applyActionCode).not.toHaveBeenCalled();
  });

  it("propagates a rejected verification and does not create a session", async () => {
    mocks.applyActionCode.mockRejectedValue({ code: "auth/expired-action-code" });
    await expect(completeEmailAction("verifyEmail", "code")).rejects.toMatchObject({ code: "auth/expired-action-code" });
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it.each(["auth/expired-action-code", "auth/invalid-action-code"])("explains %s without claiming success", code => {
    expect(emailActionError({ code })).toContain("expired or has already been used");
  });
});
