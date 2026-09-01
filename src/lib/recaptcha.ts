import { getCanonicalAppUrl } from "./http";

type RecaptchaResult =
  | { ok: true; score: number }
  | { ok: false; reason: "missing-config" | "invalid" | "unavailable" };

type RecaptchaResponse = {
  success?: boolean;
  score?: number;
  action?: string;
  hostname?: string;
};

export async function verifyRecaptcha(
  token: string,
  expectedAction: string,
  remoteIp?: string,
): Promise<RecaptchaResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV !== "production" && token === "dev-bypass") {
      return { ok: true, score: 1 };
    }
    return { ok: false, reason: "missing-config" };
  }

  if (!token || token === "dev-bypass") {
    return { ok: false, reason: "invalid" };
  }

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(5_000),
      cache: "no-store",
    });

    if (!response.ok) return { ok: false, reason: "unavailable" };

    const data = (await response.json()) as RecaptchaResponse;
    const allowedHostnames = new Set([
      new URL(getCanonicalAppUrl()).hostname,
      ...(process.env.RECAPTCHA_ALLOWED_HOSTNAMES || "")
        .split(",")
        .map((hostname) => hostname.trim())
        .filter(Boolean),
    ]);

    const valid =
      data.success === true &&
      typeof data.score === "number" &&
      data.score >= 0.5 &&
      data.action === expectedAction &&
      typeof data.hostname === "string" &&
      allowedHostnames.has(data.hostname);

    return valid
      ? { ok: true, score: data.score as number }
      : { ok: false, reason: "invalid" };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
