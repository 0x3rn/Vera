import { afterEach, describe, expect, it, vi } from "vitest";
import nodemailer from "nodemailer";
import { createVerificationUrl, getEmailAppOrigin, verificationEmail } from "./verification-template";

afterEach(() => vi.unstubAllEnvs());
const generated = "https://project.firebaseapp.com/__/auth/action?apiKey=public-key&mode=verifyEmail&oobCode=one-time%2Bcode&continueUrl=https%3A%2F%2Fverahq.xyz%2Fdashboard";

describe("branded verification email", () => {
  it("keeps only the actual code and mode on Vera's domain", () => {
    const url = new URL(createVerificationUrl(generated, "https://verahq.xyz"));
    expect(url.origin + url.pathname).toBe("https://verahq.xyz/__/auth/action");
    expect([...url.searchParams.keys()]).toEqual(["mode", "oobCode"]);
    expect(url.searchParams.get("oobCode")).toBe("one-time+code");
  });
  it.each(["https://example.com/?mode=resetPassword&oobCode=abc", "https://example.com/?mode=verifyEmail"])("rejects unusable Firebase links", link => {
    expect(() => createVerificationUrl(link, "https://verahq.xyz")).toThrow();
  });
  it("uses a purple button with white text and the same URL in the copyable fallback", () => {
    const url = createVerificationUrl(generated, "https://verahq.xyz");
    const email = verificationEmail("Kosi", url);
    expect(email.html).toContain("background-color:#6366f1;color:#ffffff");
    expect(email.html).toContain(">Verify email</a>");
    expect(email.html.match(/href=/g)).toHaveLength(2);
    expect(email.html).toContain(url.replaceAll("&", "&amp;"));
    expect(email.text).toContain(url);
    expect(email.html + email.text).not.toContain("apiKey");
    expect(email.html + email.text).not.toContain("public-key");
  });
  it("escapes display names and link attributes", () => {
    const email = verificationEmail('<img src=x onerror="alert(1)">', 'https://verahq.xyz/?code="&');
    expect(email.html).not.toContain("<img");
    expect(email.html).toContain("&lt;img");
    expect(email.html).toContain("?code=&quot;&amp;");
  });
  it("provides a greeting when Firebase has no display name", () => {
    expect(verificationEmail(undefined, "https://verahq.xyz").text).toContain("Hello there,");
  });
  it("creates a real multipart email with Nodemailer", async () => {
    const transport = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: "unix" });
    const result = await transport.sendMail({ from: "noreply@verahq.xyz", to: "test@example.com", ...verificationEmail("Kosi", createVerificationUrl(generated, "https://verahq.xyz")) });
    const mime = result.message.toString();
    expect(mime).toContain("multipart/alternative");
    expect(mime).toContain("text/plain");
    expect(mime).toContain("text/html");
    expect(mime).not.toContain("public-key");
  });
  it("does not accept insecure production origins", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", "http://verahq.xyz");
    expect(getEmailAppOrigin).toThrow();
  });
  it("uses the server configured domain, strips paths, and permits localhost in development", () => {
    vi.stubEnv("APP_URL", "https://verahq.xyz/unrelated");
    expect(getEmailAppOrigin()).toBe("https://verahq.xyz");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("APP_URL", "http://localhost:3000");
    expect(getEmailAppOrigin()).toBe("http://localhost:3000");
  });
});
