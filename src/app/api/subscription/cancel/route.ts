import { NextRequest, NextResponse } from "next/server";
import { cancelSubscription } from "@lemonsqueezy/lemonsqueezy.js";
import { getCurrentUser } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase/admin";
import { initLemonSqueezy } from "@/lib/lemonsqueezy";
import { billingRateLimit, getIp } from "@/lib/rate-limit";
import { withTimeout } from "@/lib/http";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!user.emailVerified) return NextResponse.json({ error: "Verify your email first.", code: "EMAIL_NOT_VERIFIED" }, { status: 403 });
    const { success } = await billingRateLimit.limit(`${getIp(request)}:${user.uid}:cancel`);
    if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const subscriptionId = user.dbUser?.subscription_id;
    if (!subscriptionId || !["active", "on_trial", "past_due", "paused"].includes(user.dbUser?.subscription_status || "")) {
      return NextResponse.json({ error: "No cancellable subscription was found." }, { status: 400 });
    }

    initLemonSqueezy();
    const result = await withTimeout(cancelSubscription(subscriptionId), 10_000, "Billing provider");
    if (result.error || !result.data) {
      console.error("[Cancel] Provider rejected cancellation", result.error);
      return NextResponse.json({ error: "The subscription could not be cancelled. No local changes were made." }, { status: 502 });
    }

    const attributes = result.data.data.attributes;
    if (attributes.status !== "cancelled" || !attributes.ends_at) {
      console.error("[Cancel] Provider response was incomplete", { status: attributes.status, endsAt: attributes.ends_at });
      return NextResponse.json({ error: "Cancellation was not confirmed by the billing provider." }, { status: 502 });
    }

    await adminDb.collection("users").doc(user.uid).update({
      subscription_status: attributes.status,
      subscription_ends_at: attributes.ends_at,
      subscription_renews_at: attributes.renews_at || null,
      subscription_provider_updated_at: attributes.updated_at || new Date().toISOString(),
    });
    return NextResponse.json({ success: true, endsAt: attributes.ends_at, message: "Subscription cancelled at the end of the current billing period." });
  } catch (error) {
    console.error("[Cancel] Failed", error);
    return NextResponse.json({ error: "Cancellation is temporarily unavailable. Your subscription remains unchanged." }, { status: 502 });
  }
}
