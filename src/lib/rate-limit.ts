"use server";

import { cookies } from "next/headers";

const MAX_FREE_SCANS = 2;

// In-memory store (resets on server restart — good enough for demo)
// Keyed by IP or fingerprint hash
const scanCounts = new Map<string, number>();

function hashKey(key: string): string {
  // Simple hash to normalize keys
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "scan_" + Math.abs(hash).toString(36);
}

export async function getRemainingScans(ip: string, fingerprint?: string): Promise<number> {
  // Check cookie first for paid session
  const cookieStore = await cookies();
  const paidSession = cookieStore.get("vera_paid_session")?.value;
  if (paidSession) {
    return Infinity; // Paid users get unlimited
  }

  // Use IP as primary key, fingerprint as fallback
  const primaryKey = ip && ip !== "127.0.0.1" && ip !== "::1" ? ip : fingerprint || "unknown";
  const key = hashKey(primaryKey);
  const count = scanCounts.get(key) || 0;
  return Math.max(0, MAX_FREE_SCANS - count);
}

export async function recordScan(ip: string, fingerprint?: string): Promise<number> {
  const primaryKey = ip && ip !== "127.0.0.1" && ip !== "::1" ? ip : fingerprint || "unknown";
  const key = hashKey(primaryKey);
  const current = scanCounts.get(key) || 0;
  const next = current + 1;
  scanCounts.set(key, next);
  return Math.max(0, MAX_FREE_SCANS - next);
}

export async function getMaxFreeScans(): Promise<number> {
  const cookieStore = await cookies();
  const paidSession = cookieStore.get("vera_paid_session")?.value;
  if (paidSession) return Infinity;
  return MAX_FREE_SCANS;
}