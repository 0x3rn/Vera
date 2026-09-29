import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

type Limiter = { limit(identifier: string): Promise<{ success: boolean }> };

function createLimiter(limit: number, window: `${number} ${"m" | "h"}`, prefix: string): Limiter {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    return new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(limit, window),
      analytics: true,
      prefix,
    });
  }

  if (process.env.NODE_ENV === "production") {
    return { limit: async () => ({ success: false }) };
  }

  const entries = new Map<string, { count: number; resetsAt: number }>();
  const duration = window.endsWith(" h") ? Number.parseInt(window) * 3_600_000 : Number.parseInt(window) * 60_000;
  return {
    async limit(identifier) {
      const now = Date.now();
      const current = entries.get(identifier);
      if (!current || current.resetsAt <= now) {
        entries.set(identifier, { count: 1, resetsAt: now + duration });
        return { success: true };
      }
      current.count += 1;
      if (entries.size > 5_000) {
        for (const [key, value] of entries) if (value.resetsAt <= now) entries.delete(key);
      }
      return { success: current.count <= limit };
    },
  };
}

export const authRateLimit = createLimiter(5, "1 m", "@upstash/ratelimit/auth");
export const verificationIpRateLimit = createLimiter(10, "1 m", "@upstash/ratelimit/verification-ip");
export const verificationUserRateLimit = createLimiter(1, "1 m", "@upstash/ratelimit/verification-user");
export const scanRateLimit = createLimiter(15, "1 h", "@upstash/ratelimit/scan");
export const contactRateLimit = createLimiter(5, "1 h", "@upstash/ratelimit/contact");
export const billingRateLimit = createLimiter(10, "10 m", "@upstash/ratelimit/billing");

export function getIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }
  return request.headers.get("x-real-ip") || "127.0.0.1";
}
