import { NextRequest, NextResponse } from "next/server";
import { initLemonSqueezy, getStoreId, getVariantId } from "@/lib/lemonsqueezy";
import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";

export async function POST(request: NextRequest) {
  try {
    initLemonSqueezy();

    const { plan } = await request.json();
    const storeId = getStoreId();
    const variantId = getVariantId(plan === "subscription" ? "subscription" : "onetime");

    if (!storeId || !variantId) {
      return NextResponse.json(
        {
          error:
            "Payment not configured. Set LEMONSQUEEZY_STORE_ID and variant IDs in .env.",
        },
        { status: 500 }
      );
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";
    const userData = request.cookies.get("sb-access-token")?.value || "";

    const checkout = await createCheckout(storeId, variantId, {
      checkoutData: {
        custom: {
          user_id: userData, // will be replaced at scan time via scan metadata
        },
      },
      productOptions: {
        redirectUrl: `${origin}/?checkout=success`,
      },
    });

    // The createCheckout response has shape: { statusCode, data, error }
    const checkoutData = checkout as any;
    const url = checkoutData?.data?.data?.attributes?.url || null;

    if (!url) {
      return NextResponse.json(
        { error: "Failed to create checkout URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Checkout error:", error);
    const message =
      error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Checkout failed: ${message}` },
      { status: 500 }
    );
  }
}