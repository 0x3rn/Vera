import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") || "";

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const scanId = session.metadata?.scanId;

    if (scanId) {
      await prisma.scan.update({
        where: { id: scanId },
        data: {
          payment_status: "paid",
          stripe_session_id: session.id,
        },
      });

      console.log(`[Webhook] Scan ${scanId} marked as paid`);
    }
  }

  return NextResponse.json({ received: true });
}