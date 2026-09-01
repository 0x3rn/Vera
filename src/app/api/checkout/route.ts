import { NextRequest, NextResponse } from "next/server";
import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { getCurrentUser } from "@/lib/auth-server";
import { getStoreId, getVariantId, initLemonSqueezy } from "@/lib/lemonsqueezy";
import { checkoutRequestSchema, parseJsonRequest } from "@/lib/validation";
import { getCanonicalAppUrl, RequestValidationError, withTimeout } from "@/lib/http";
import { billingRateLimit, getIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const { success } = await billingRateLimit.limit(`${getIp(request)}:checkout`);
    if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!user.emailVerified) {
      return NextResponse.json({ error: "Verify your email first.", code: "EMAIL_NOT_VERIFIED" }, { status: 403 });
    }

    const { plan } = await parseJsonRequest(request, checkoutRequestSchema);
    initLemonSqueezy();
    const storeId = getStoreId();
    const variantId = getVariantId(plan);
    if (!storeId || !variantId) {
      console.error("[Checkout] Billing environment is incomplete", { plan, hasStoreId: Boolean(storeId), hasVariantId: Boolean(variantId) });
      return NextResponse.json({ error: "Billing is temporarily unavailable." }, { status: 503 });
    }

    const checkout = await withTimeout(createCheckout(storeId, variantId, {
      checkoutData: { custom: { user_id: user.uid, plan } },
      productOptions: { redirectUrl: `${getCanonicalAppUrl()}/dashboard?checkout=success` },
    }), 10_000, "Checkout provider");

    if (checkout.error || !checkout.data) {
      console.error("[Checkout] Provider rejected checkout", checkout.error);
      return NextResponse.json({ error: "Checkout could not be created." }, { status: 502 });
    }
    const url = checkout.data.data.attributes.url;
    if (!url || new URL(url).protocol !== "https:") {
      console.error("[Checkout] Provider returned an invalid URL");
      return NextResponse.json({ error: "Checkout could not be created." }, { status: 502 });
    }
    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[Checkout] Failed", error);
    return NextResponse.json({ error: "Checkout is temporarily unavailable." }, { status: 502 });
  }
}
