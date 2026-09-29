export function getEmailAppOrigin(): string {
  const url = new URL(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://verahq.xyz");
  const local = process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(url.hostname);
  if (url.username || url.password || (url.protocol !== "https:" && !(local && url.protocol === "http:"))) {
    throw new Error("Invalid application URL for verification emails.");
  }
  return url.origin;
}

export function createVerificationUrl(generatedLink: string, origin: string): string {
  const generated = new URL(generatedLink);
  const code = generated.searchParams.get("oobCode");
  if (generated.searchParams.get("mode") !== "verifyEmail" || !code) {
    throw new Error("Firebase returned an invalid verification link.");
  }
  // This handler uses Vera's Firebase config. Only the action and code are needed.
  const clean = new URL("/__/auth/action", origin);
  clean.searchParams.set("mode", "verifyEmail");
  clean.searchParams.set("oobCode", code);
  return clean.toString();
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

export function verificationEmail(displayName: string | undefined, verificationUrl: string) {
  const name = displayName?.trim() || "there";
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(verificationUrl);
  return {
    subject: "Verify your email address for Vera",
    text: `Hello ${name},\n\nPlease verify your email address to complete your Vera registration.\n\n${verificationUrl}\n\nIf you have trouble clicking the button, copy and paste the link above into your browser.\n\nIf you didn't request this, you can ignore this email.\n\nThanks,\nThe Vera team`,
    html: `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:24px 12px;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;"><tr><td style="padding:32px;">
<p style="margin:0 0 28px;font-size:26px;font-weight:bold;">Vera<span style="color:#6366f1;">.</span></p>
<h1 style="font-size:24px;margin:0 0 24px;">Verify your email address</h1>
<p style="line-height:1.6;">Hello ${safeName},</p>
<p style="line-height:1.6;">Please verify your email address to complete your Vera registration.</p>
<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0;"><tr><td bgcolor="#6366f1" style="background-color:#6366f1;border-radius:8px;text-align:center;">
<a href="${safeUrl}" style="display:inline-block;padding:14px 28px;border:1px solid #6366f1;border-radius:8px;background-color:#6366f1;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;">Verify email</a>
</td></tr></table>
<p style="font-size:13px;line-height:1.6;color:#52525b;">If you have trouble clicking the button, copy and paste this link into your browser:</p>
<p style="font-size:13px;line-height:1.6;word-break:break-all;overflow-wrap:anywhere;"><a href="${safeUrl}" style="color:#4f46e5;">${safeUrl}</a></p>
<p style="font-size:13px;line-height:1.6;color:#52525b;">If you didn't request this, you can ignore this email.</p>
<p style="line-height:1.6;">Thanks,<br>The Vera team</p>
</td></tr></table></td></tr></table></body></html>`,
  };
}
