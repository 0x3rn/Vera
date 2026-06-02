import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

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
    const attributes = event?.data?.attributes || {};

    console.log(`[Webhook] Event: ${eventName}`, { userId, orderId: attributes?.order_id });

    // Handle single-scan payment
    if (eventName === "order_created") {
      const scanId = customData?.scan_id;

      if (scanId) {
        await prisma.scan.update({
          where: { id: scanId },
          data: {
            payment_status: "paid",
            checkout_session_id: `ls_${event?.data?.id || "unknown"}`,
          },
        });
        console.log(`[Webhook] Scan ${scanId} marked as paid`);
      }
    }

    // Handle subscription created
    if (eventName === "subscription_created") {
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscription_status: "active",
            subscription_id: attributes.first_subscription_item?.subscription_id
              ? String(attributes.first_subscription_item.subscription_id)
              : null,
            customer_id: attributes.customer_id ? String(attributes.customer_id) : null,
          },
        });
        console.log(`[Webhook] User ${userId} subscription activated`);
      }
    }

    // Handle subscription updated
    if (eventName === "subscription_updated") {
      if (userId) {
        const newStatus = attributes.status === "cancelled"
          ? "cancelled"
          : attributes.status === "paused"
            ? "paused"
            : attributes.status === "active"
              ? "active"
              : undefined;

        if (newStatus) {
          await prisma.user.update({
            where: { id: userId },
            data: { subscription_status: newStatus },
          });
          console.log(`[Webhook] User ${userId} subscription status → ${newStatus}`);
        }
      }
    }

    // Handle subscription cancelled
    if (eventName === "subscription_cancelled") {
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscription_status: "cancelled",
          },
        });
        console.log(`[Webhook] User ${userId} subscription cancelled`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}