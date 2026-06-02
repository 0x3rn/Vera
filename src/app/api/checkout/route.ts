import { NextRequest, NextResponse } from "next/server";
import { initLemonSqueezy, getStoreId, getVariantId } from "@/lib/lemonsqueezy";
import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    initLemonSqueezy();

    // Authenticate user
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await request.json();
    const storeId = getStoreId();
    const variantId = getVariantId(plan === "subscription" ? "subscription" : "onetime");

    if (!storeId) {
      console.error("[Checkout] Missing LEMONSQUEEZY_STORE_ID");
      return NextResponse.json(
        { error: "Store ID not configured. Set LEMONSQUEEZY_STORE_ID in .env." },
        { status: 500 }
      );
    }

    if (!variantId) {
      console.error("[Checkout] Missing variant ID for plan:", plan);
      return NextResponse.json(
        { error: `Variant ID not configured for plan: ${plan}. Set the correct env var.` },
        { status: 500 }
      );
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";

    console.log(`[Checkout] Creating checkout — store: ${storeId}, variant: ${variantId}, user: ${user.id}`);

    const checkout = await createCheckout(storeId, variantId, {
      checkoutData: {
        custom: {
          user_id: user.id,
          plan,
        },
      },
      productOptions: {
        redirectUrl: `${origin}/dashboard?checkout=success`,
      },
    });

    const checkoutData = checkout as any;

    // Debug: log the full response in development
    console.log("[Checkout] Response status:", checkoutData?.statusCode);
    if (checkoutData?.error) {
      console.error("[Checkout] Lemon Squeezy error:", JSON.stringify(checkoutData.error));
    }

    const url = checkoutData?.data?.data?.attributes?.url || null;

    if (!url) {
      console.error("[Checkout] No URL in response. Full response:", JSON.stringify(checkoutData, null, 2));
      const errDetail = checkoutData?.error?.detail || "Unknown";
      return NextResponse.json(
        { error: `Checkout failed: ${errDetail}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[Checkout] Exception:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Checkout failed: ${message}` },
      { status: 500 }
    );
  }
}