import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ verifyIdToken: vi.fn(), getUser: vi.fn(), ipLimit: vi.fn(), userLimit: vi.fn(), send: vi.fn() }));
vi.mock("@/lib/firebase/admin", () => ({ adminAuth: { verifyIdToken: mocks.verifyIdToken, getUser: mocks.getUser } }));
vi.mock("@/lib/rate-limit", () => ({ verificationIpRateLimit: { limit: mocks.ipLimit }, verificationUserRateLimit: { limit: mocks.userLimit }, getIp: () => "test-ip" }));
vi.mock("@/lib/email/send-verification", () => ({ sendVerificationEmail: mocks.send }));
vi.mock("@/lib/validation", async () => await import("../../../../lib/validation"));
vi.mock("@/lib/http", async () => await import("../../../../lib/http"));
import { POST } from "./route";

const token = "test-firebase-id-token-12345";
const request = (body: unknown = { idToken: token }) => new NextRequest("https://verahq.xyz/api/auth/verification-email", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.ipLimit.mockResolvedValue({ success: true });
  mocks.userLimit.mockResolvedValue({ success: true });
  mocks.verifyIdToken.mockResolvedValue({ uid: "user-1" });
  mocks.getUser.mockResolvedValue({ email: "user@example.com", displayName: "Kosi", emailVerified: false, disabled: false });
  mocks.send.mockResolvedValue(undefined);
});

describe("verification email endpoint", () => {
  it("authenticates and sends only to the Firebase account even if a different email is supplied", async () => {
    const response = await POST(request({ idToken: token, email: "attacker@example.com", displayName: "Spoof" }));
    expect(response.status).toBe(200);
    expect(mocks.verifyIdToken).toHaveBeenCalledWith(token, true);
    expect(mocks.getUser).toHaveBeenCalledWith("user-1");
    expect(mocks.userLimit).toHaveBeenCalledWith("user-1");
    expect(mocks.send).toHaveBeenCalledWith("user@example.com", "Kosi");
  });
  it("rejects missing authentication", async () => {
    expect((await POST(request({}))).status).toBe(400);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("rejects expired or revoked tokens", async () => {
    mocks.verifyIdToken.mockRejectedValue(new Error("revoked"));
    expect((await POST(request())).status).toBe(401);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("does not send to already verified accounts", async () => {
    mocks.getUser.mockResolvedValue({ email: "user@example.com", emailVerified: true });
    const response = await POST(request());
    expect(await response.json()).toEqual({ success: true, alreadyVerified: true });
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it.each([{ disabled: true, email: "user@example.com" }, { disabled: false }])("rejects disabled or email-less accounts", async user => {
    mocks.getUser.mockResolvedValue(user);
    expect((await POST(request())).status).toBe(403);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it.each(["ipLimit", "userLimit"] as const)("enforces %s", async key => {
    mocks[key].mockResolvedValue({ success: false });
    expect((await POST(request())).status).toBe(429);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("reports delivery failure without exposing credentials or links", async () => {
    mocks.send.mockRejectedValue(new Error("smtp password secret and oobCode=private-code"));
    const response = await POST(request());
    expect(response.status).toBe(503);
    const body = await response.text();
    expect(body).not.toContain("secret");
    expect(body).not.toContain("private-code");
  });
});
