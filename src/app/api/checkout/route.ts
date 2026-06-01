import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const { plan } = await request.json();

    let priceId: string;

    if (plan === "subscription") {
      // $20/month subscription for agencies
      priceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID || "";
    } else {
      // $10 one-time pay-per-scan
      priceId = process.env.STRIPE_ONETIME_PRICE_ID || "";
    }

    if (!priceId) {
      return NextResponse.json(
        { error: "Price not configured. Set STRIPE_ONETIME_PRICE_ID or STRIPE_SUBSCRIPTION_PRICE_ID in environment variables." },
        { status: 500 }
      );
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: plan === "subscription" ? "subscription" : "payment",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/?paid=true&session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${origin}/?cancelled=true`,
      metadata: {
        plan,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}