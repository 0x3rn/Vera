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

  // Verify webhook signature
  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const event = JSON.parse(body);
    const eventName = event?.meta?.event_name;

    // Handle order_created (successful checkout)
    if (eventName === "order_created") {
      const customData = event?.meta?.custom_data;
      const scanId = customData?.scan_id;

      if (scanId) {
        // Mark scan as paid
        await prisma.scan.update({
          where: { id: scanId },
          data: {
            payment_status: "paid",
            checkout_session_id: `ls_${event?.data?.id || "unknown"}`,
          },
        });

        console.log(`[LemonSqueezy Webhook] Scan ${scanId} marked as paid`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Lemon Squeezy webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}