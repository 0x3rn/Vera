import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

// Initialize Redis client using environment variables
// Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
const redis = Redis.fromEnv();

// Authentication limiter: 5 requests per 1 minute
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/auth",
});

// Scan limiter: 15 requests per 1 hour
export const scanRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(15, "1 h"),
  analytics: true,
  prefix: "@upstash/ratelimit/scan",
});

// Contact form limiter: 5 requests per 1 hour
export const contactRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  analytics: true,
  prefix: "@upstash/ratelimit/contact",
});

/**
 * Extracts the client IP address from a NextRequest object.
 * Safely handles comma-separated lists in the x-forwarded-for header.
 */
export function getIp(request: NextRequest): string {
  // In Next.js 15, request.ip was removed. 
  // We rely on x-forwarded-for which is securely overwritten by Vercel/proxies at the edge.

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list of IPs. The first one is the client.
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "127.0.0.1";
}