import { adminAuth } from "../firebase/admin";
import { createSmtpTransport, getSmtpConfig } from "./smtp";
import { createVerificationUrl, getEmailAppOrigin, verificationEmail } from "./verification-template";

export async function sendVerificationEmail(email: string, displayName?: string) {
  const config = getSmtpConfig();
  const origin = getEmailAppOrigin();
  const generated = await adminAuth.generateEmailVerificationLink(email, {
    url: `${origin}/dashboard`, handleCodeInApp: false,
  });
  const url = createVerificationUrl(generated, origin);
  const transport = createSmtpTransport(config);
  try {
    const result = await transport.sendMail({
      from: { name: "Vera", address: config.from },
      to: { address: email, name: displayName || "" },
      replyTo: config.replyTo,
      ...verificationEmail(displayName, url),
    });
    if (!result.accepted.length || result.rejected.length) throw new Error("SMTP did not accept the recipient.");
  } finally {
    transport.close();
  }
}
