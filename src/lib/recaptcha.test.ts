import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyRecaptcha } from "./recaptcha";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("reCAPTCHA verification", () => {
  it("fails closed in production when configuration is absent", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "");
    expect(await verifyRecaptcha("dev-bypass", "contact_form")).toEqual({ ok: false, reason: "missing-config" });
  });

  it("allows the explicit bypass only in local development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "");
    expect(await verifyRecaptcha("dev-bypass", "contact_form")).toEqual({ ok: true, score: 1 });
  });

  it("rejects a token issued for the wrong action", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "secret");
    vi.stubEnv("APP_URL", "https://verahq.xyz");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, score: 0.9, action: "register_form", hostname: "verahq.xyz" }), { status: 200 })));
    expect(await verifyRecaptcha("real-token", "contact_form")).toEqual({ ok: false, reason: "invalid" });
  });
});
