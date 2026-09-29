import { existsSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const { createSmtpTransport, EmailConfigurationError } = await import(new URL("../src/lib/email/smtp.ts", import.meta.url).href);
let transport;
try {
  transport = createSmtpTransport();
  await transport.verify();
  console.log("SMTP connection, TLS, and authentication passed. No email was sent.");
  console.log("Next, test registration and resend with your own unverified account to check inbox delivery.");
} catch (error) {
  console.error(error instanceof EmailConfigurationError
    ? "SMTP configuration is missing or invalid. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM_EMAIL."
    : "SMTP verification failed. Check the server-only SMTP settings, credentials, and network access.");
  process.exitCode = 1;
} finally {
  transport?.close();
}
