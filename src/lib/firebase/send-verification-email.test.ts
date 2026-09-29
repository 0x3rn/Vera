import { afterEach, describe, expect, it, vi } from "vitest";
import type { User } from "firebase/auth";
import { sendBrandedVerificationEmail } from "./send-verification-email";

afterEach(() => vi.unstubAllGlobals());
describe("client verification email request", () => {
  const user = { getIdToken: async () => "id-token" } as User;
  it("sends an ID token to the server without a client-selected recipient", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ success: true }));
    vi.stubGlobal("fetch", fetch);
    await sendBrandedVerificationEmail(user);
    expect(fetch).toHaveBeenCalledWith("/api/auth/verification-email", expect.objectContaining({ body: JSON.stringify({ idToken: "id-token" }) }));
  });
  it("shows the server's delivery error rather than claiming success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "Delivery unavailable" }, { status: 503 })));
    await expect(sendBrandedVerificationEmail(user)).rejects.toThrow("Delivery unavailable");
  });
  it("does not claim a new email was sent for an already verified account", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ success: true, alreadyVerified: true })));
    await expect(sendBrandedVerificationEmail(user)).rejects.toThrow("already verified");
  });
});
