import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

let initialized = false;

export function initLemonSqueezy() {
  if (initialized) return;
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey || apiKey === "your-key-here") {
    throw new Error(
      "Missing LEMONSQUEEZY_API_KEY. Add it to your .env file from https://app.lemonsqueezy.com/settings/api"
    );
  }
  lemonSqueezySetup({ apiKey });
  initialized = true;
}

export function getStoreId(): string {
  return process.env.LEMONSQUEEZY_STORE_ID || "";
}

export function getVariantId(plan: "onetime" | "subscription"): string {
  if (plan === "subscription") {
    return process.env.LEMONSQUEEZY_SUBSCRIPTION_VARIANT_ID || "";
  }
  return process.env.LEMONSQUEEZY_ONETIME_VARIANT_ID || "";
}