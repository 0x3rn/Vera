export class RequestValidationError extends Error {
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = "RequestValidationError";
  }
}

export class UpstreamServiceError extends Error {
  readonly status = 502;

  constructor(message: string) {
    super(message);
    this.name = "UpstreamServiceError";
  }
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new UpstreamServiceError(`${label} timed out.`)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function getCanonicalAppUrl(): string {
  const configured =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined) ||
    (process.env.NODE_ENV === "production"
      ? "https://verahq.xyz"
      : "http://localhost:3000");

  const url = new URL(configured);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error("APP_URL must use http or https.");
  }

  return url.origin;
}

export function noStoreHeaders(): HeadersInit {
  return {
    "Cache-Control": "private, no-store, max-age=0",
    Pragma: "no-cache",
  };
}
