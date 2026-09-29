import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ generate: vi.fn(), sendMail: vi.fn(), close: vi.fn(), createTransport: vi.fn() }));
vi.mock("../firebase/admin", () => ({ adminAuth: { generateEmailVerificationLink: mocks.generate } }));
vi.mock("nodemailer", () => ({ default: { createTransport: mocks.createTransport } }));
import { sendVerificationEmail } from "./send-verification";
import { getSmtpConfig, createSmtpTransport } from "./smtp";

beforeEach(() => {
  vi.resetAllMocks();
  for (const [key, value] of Object.entries({ SMTP_HOST: "smtp.example.com", SMTP_PORT: "587", SMTP_USER: "user", SMTP_PASSWORD: "secret", SMTP_FROM_EMAIL: "noreply@verahq.xyz", SMTP_REPLY_TO: "support@verahq.xyz", APP_URL: "https://verahq.xyz" })) vi.stubEnv(key, value);
  mocks.createTransport.mockReturnValue({ sendMail: mocks.sendMail, close: mocks.close });
  mocks.generate.mockResolvedValue("https://firebase.example/__/auth/action?mode=verifyEmail&oobCode=code&apiKey=public-key");
  mocks.sendMail.mockResolvedValue({ accepted: ["user@example.com"], rejected: [] });
});
afterEach(() => vi.unstubAllEnvs());

describe("SMTP verification delivery", () => {
  it("generates a Firebase link and sends the branded email without exposing the API key", async () => {
    await sendVerificationEmail("user@example.com", "Kosi");
    expect(mocks.generate).toHaveBeenCalledWith("user@example.com", { url: "https://verahq.xyz/dashboard", handleCodeInApp: false });
    const mail = mocks.sendMail.mock.calls[0][0];
    expect(mail.to).toEqual({ address: "user@example.com", name: "Kosi" });
    expect(mail.from).toEqual({ name: "Vera", address: "noreply@verahq.xyz" });
    expect(mail.replyTo).toBe("support@verahq.xyz");
    expect(mail.html + mail.text).not.toContain("apiKey");
    expect(mail.html).toContain("Verify email");
    expect(mocks.close).toHaveBeenCalledOnce();
  });
  it("requires STARTTLS on port 587 and keeps certificate verification enabled", () => {
    createSmtpTransport();
    expect(mocks.createTransport).toHaveBeenCalledWith(expect.objectContaining({ secure: false, requireTLS: true }));
    expect(mocks.createTransport.mock.calls[0][0]).not.toHaveProperty("tls.rejectUnauthorized");
  });
  it("uses implicit TLS on port 465", () => {
    vi.stubEnv("SMTP_PORT", "465");
    createSmtpTransport();
    expect(mocks.createTransport).toHaveBeenCalledWith(expect.objectContaining({ secure: true, requireTLS: false }));
  });
  it.each(["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM_EMAIL"])("fails closed without %s", async key => {
    vi.stubEnv(key, "");
    await expect(sendVerificationEmail("user@example.com")).rejects.toThrow("configuration");
    expect(mocks.generate).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });
  it("rejects an invalid port or sender", () => {
    vi.stubEnv("SMTP_PORT", "bad-port");
    expect(getSmtpConfig).toThrow();
    vi.stubEnv("SMTP_PORT", "587");
    vi.stubEnv("SMTP_FROM_EMAIL", "Vera <noreply@verahq.xyz>");
    expect(getSmtpConfig).toThrow();
  });
  it("propagates delivery failures and closes the transport", async () => {
    mocks.sendMail.mockRejectedValue(new Error("SMTP unavailable"));
    await expect(sendVerificationEmail("user@example.com")).rejects.toThrow("SMTP unavailable");
    expect(mocks.close).toHaveBeenCalledOnce();
  });
  it("does not claim success when SMTP rejects the recipient", async () => {
    mocks.sendMail.mockResolvedValue({ accepted: [], rejected: ["user@example.com"] });
    await expect(sendVerificationEmail("user@example.com")).rejects.toThrow("accept");
  });
  it("does not send when Firebase link generation fails", async () => {
    mocks.generate.mockRejectedValue(new Error("Firebase unavailable"));
    await expect(sendVerificationEmail("user@example.com")).rejects.toThrow();
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });
});
