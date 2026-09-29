import nodemailer from "nodemailer";
import { z } from "zod";

export class EmailConfigurationError extends Error {}

export function getSmtpConfig() {
  const result = z.object({
    host: z.string().trim().min(1),
    port: z.coerce.number().int().min(1).max(65535),
    user: z.string().min(1),
    pass: z.string().min(1),
    from: z.email(),
    replyTo: z.email().optional(),
  }).safeParse({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || "587",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM_EMAIL,
    replyTo: process.env.SMTP_REPLY_TO || undefined,
  });
  if (!result.success) throw new EmailConfigurationError("SMTP configuration is missing or invalid.");
  return result.data;
}

export function createSmtpTransport(config = getSmtpConfig()) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    requireTLS: config.port !== 465,
    auth: { user: config.user, pass: config.pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
}
