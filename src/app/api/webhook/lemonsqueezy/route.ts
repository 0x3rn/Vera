import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";

const eventSchema = z.object({
  meta: z.object({
    event_name: z.enum(["order_created", "order_refunded", "subscription_created", "subscription_updated", "subscription_cancelled", "subscription_expired", "subscription_paused", "subscription_resumed"]),
    test_mode: z.boolean().optional(),
    custom_data: z.object({ user_id: z.string().min(1).max(128), plan: z.enum(["onetime", "subscription"]) }),
  }),
  data: z.object({
    type: z.string().min(1),
    id: z.union([z.string(), z.number()]).transform(String),
    attributes: z.record(z.string(), z.unknown()),
  }),
});

function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest();
  const received = Buffer.from(signature, "hex");
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" || typeof value === "number" ? String(value) : null;
}

function dateValue(value: unknown): string | null {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  if (!verifySignature(body, request.headers.get("x-signature") || "")) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const parsed = eventSchema.safeParse(JSON.parse(body));
    if (!parsed.success) return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    const event = parsed.data;
    const { event_name: eventName, custom_data: customData } = event.meta;
    const attributes = event.data.attributes;

    const expectedStoreId = process.env.LEMONSQUEEZY_STORE_ID;
    const expectedOnetimeVariant = process.env.LEMONSQUEEZY_ONETIME_VARIANT_ID;
    const expectedSubscriptionVariant = process.env.LEMONSQUEEZY_SUBSCRIPTION_VARIANT_ID;
    if (!expectedStoreId || !expectedOnetimeVariant || !expectedSubscriptionVariant) {
      throw new Error("Lemon Squeezy webhook validation is not configured.");
    }
    const storeId = stringValue(attributes.store_id);
    if (storeId !== expectedStoreId) return NextResponse.json({ error: "Store mismatch" }, { status: 400 });
    const expectedTestMode = process.env.LEMONSQUEEZY_TEST_MODE === "true";
    if (event.meta.test_mode !== expectedTestMode) {
      return NextResponse.json({ error: "Environment mismatch" }, { status: 400 });
    }

    const expectedVariant = customData.plan === "onetime"
      ? expectedOnetimeVariant
      : expectedSubscriptionVariant;
    const firstOrderItem = typeof attributes.first_order_item === "object" && attributes.first_order_item
      ? attributes.first_order_item as Record<string, unknown>
      : null;
    const variantId = stringValue(attributes.variant_id) || stringValue(firstOrderItem?.variant_id);
    if (variantId !== expectedVariant) {
      return NextResponse.json({ error: "Variant mismatch" }, { status: 400 });
    }

    const userRef = adminDb.collection("users").doc(customData.user_id);
    const domainEventId = eventName === "order_created"
      ? `${eventName}:${event.data.id}`
      : eventName === "order_refunded"
        ? `${eventName}:${event.data.id}:${stringValue(attributes.refunded_amount) || "unknown"}`
        : `${eventName}:${event.data.id}:${stringValue(attributes.updated_at) || "unknown"}`;
    const eventKey = crypto.createHash("sha256").update(domainEventId).digest("hex");
    const receiptRef = adminDb.collection("billing_events").doc(eventKey);
    const orderKey = crypto.createHash("sha256").update(`${expectedStoreId}:${event.data.id}`).digest("hex");
    const orderRef = adminDb.collection("billing_orders").doc(orderKey);

    await adminDb.runTransaction(async (transaction) => {
      const [userSnapshot, receiptSnapshot, orderSnapshot] = await Promise.all([
        transaction.get(userRef),
        transaction.get(receiptRef),
        transaction.get(orderRef),
      ]);
      if (receiptSnapshot.exists) return;
      if (!userSnapshot.exists) throw new Error("Webhook user does not exist.");
      const userData = userSnapshot.data() || {};
      const orderData = orderSnapshot.data() || {};
      const update: Record<string, unknown> = {};
      if ((eventName === "order_created" || eventName === "order_refunded")
        && orderData.user_id
        && orderData.user_id !== customData.user_id) {
        throw new Error("Order ownership mismatch.");
      }

      if (eventName === "order_created") {
        if (customData.plan !== "onetime" || event.data.type !== "orders") throw new Error("Order metadata mismatch.");
        if (stringValue(attributes.status) !== "paid") throw new Error("Order is not paid.");
        if (!orderData.refund_status) {
          update.bonus_scans = Math.max(0, Number(userData.bonus_scans) || 0) + 5;
          transaction.set(orderRef, {
            user_id: customData.user_id,
            credited: true,
            created_event_received_at: new Date().toISOString(),
          }, { merge: true });
        }
      } else if (eventName === "order_refunded") {
        if (customData.plan !== "onetime" || event.data.type !== "orders") throw new Error("Refund metadata mismatch.");
        const total = Number(attributes.total);
        const refunded = Number(attributes.refunded_amount);
        if (Number.isFinite(total) && total > 0 && Number.isFinite(refunded) && refunded >= total) {
          if (orderData.credited === true) {
            update.bonus_scans = Math.max(0, (Number(userData.bonus_scans) || 0) - 5);
          }
          transaction.set(orderRef, {
            user_id: customData.user_id,
            credited: false,
            refund_status: "fully_refunded",
            refunded_amount: refunded,
            refund_event_received_at: new Date().toISOString(),
          }, { merge: true });
        } else {
          update.billing_review_required = true;
          update.billing_review_reason = "partial_refund";
          transaction.set(orderRef, {
            user_id: customData.user_id,
            refund_status: "partial_refund",
            refunded_amount: Number.isFinite(refunded) ? refunded : null,
            refund_event_received_at: new Date().toISOString(),
          }, { merge: true });
        }
      } else {
        if (customData.plan !== "subscription" || event.data.type !== "subscriptions") throw new Error("Subscription metadata mismatch.");
        const updatedAt = dateValue(attributes.updated_at);
        if (!updatedAt) throw new Error("Subscription update timestamp is missing.");
        const previousUpdatedAt = dateValue(userData.subscription_provider_updated_at);
        if (!previousUpdatedAt || Date.parse(updatedAt) >= Date.parse(previousUpdatedAt)) {
          const providerStatus = stringValue(attributes.status);
          const allowedStatuses = new Set(["on_trial", "active", "paused", "past_due", "unpaid", "cancelled", "expired"]);
          if (!providerStatus || !allowedStatuses.has(providerStatus)) throw new Error("Unknown subscription status.");
          update.subscription_status = providerStatus;
          update.subscription_id = event.data.id;
          update.customer_id = stringValue(attributes.customer_id);
          update.subscription_renews_at = dateValue(attributes.renews_at);
          update.subscription_ends_at = dateValue(attributes.ends_at);
          update.subscription_provider_updated_at = updatedAt;
        }
      }

      if (Object.keys(update).length > 0) transaction.update(userRef, update);
      transaction.create(receiptRef, {
        event_name: eventName,
        provider_resource_id: event.data.id,
        user_id: customData.user_id,
        processed_at: new Date().toISOString(),
      });
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Processing failed", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
