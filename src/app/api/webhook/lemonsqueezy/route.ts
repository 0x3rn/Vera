import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import crypto from "crypto";
import { FieldValue } from "firebase-admin/firestore";

function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "";
  if (!secret) return false;
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-signature") || "";

  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const event = JSON.parse(body);
    const eventName = event?.meta?.event_name;
    const customData = event?.meta?.custom_data || {};
    const userId = customData.user_id;
    const plan = customData.plan;
    const attributes = event?.data?.attributes || {};

    console.log(`[Webhook] Event: ${eventName}`, { userId, plan, orderId: attributes?.order_id });

    if (!userId) {
      console.warn("[Webhook] No user_id in custom_data, skipping.");
      return NextResponse.json({ received: true });
    }

    // Handle one-time scan pack purchase (5 extra scans for $5)
    if (eventName === "order_created" && plan === "onetime") {
      await adminDb.collection("users").doc(userId).set({
        bonus_scans: FieldValue.increment(5),
      }, { merge: true });
      console.log(`[Webhook] User ${userId}: added 5 bonus scans (one-time purchase)`);
    }

    // Handle subscription created
    if (eventName === "subscription_created") {
      await adminDb.collection("users").doc(userId).set({
        subscription_status: "active",
        subscription_id: attributes.first_subscription_item?.subscription_id
          ? String(attributes.first_subscription_item.subscription_id)
          : null,
        customer_id: attributes.customer_id ? String(attributes.customer_id) : null,
      }, { merge: true });
      console.log(`[Webhook] User ${userId} subscription activated`);
    }

    // Handle subscription updated
    if (eventName === "subscription_updated") {
      const newStatus = attributes.status === "cancelled"
        ? "cancelled"
        : attributes.status === "paused"
          ? "paused"
          : attributes.status === "active"
            ? "active"
            : undefined;

      if (newStatus) {
        await adminDb.collection("users").doc(userId).set({
          subscription_status: newStatus,
        }, { merge: true });
        console.log(`[Webhook] User ${userId} subscription status → ${newStatus}`);
      }
    }

    // Handle subscription cancelled
    if (eventName === "subscription_cancelled") {
      await adminDb.collection("users").doc(userId).set({
        subscription_status: "cancelled",
      }, { merge: true });
      console.log(`[Webhook] User ${userId} subscription cancelled`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}