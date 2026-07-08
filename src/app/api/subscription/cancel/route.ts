import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase/admin";
import { initLemonSqueezy } from "@/lib/lemonsqueezy";
import { cancelSubscription } from "@lemonsqueezy/lemonsqueezy.js";

export async function POST(request: NextRequest) {
  try {
    initLemonSqueezy();

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { uid, dbUser } = user;

    if (!dbUser?.subscription_id || dbUser.subscription_status !== "active") {
      return NextResponse.json(
        { error: "No active subscription found." },
        { status: 400 }
      );
    }

    let endsAt: string | null = null;
    // Cancel in Lemon Squeezy
    try {
      const result = await cancelSubscription(dbUser.subscription_id);
      console.log(`[Cancel] Subscription ${dbUser.subscription_id} cancelled — status:`, (result as any)?.statusCode);
      endsAt = (result as any)?.data?.data?.attributes?.ends_at || null;
    } catch (lsError: any) {
      console.error("[Cancel] Lemon Squeezy error:", lsError.message || lsError);
      // Continue anyway — webhook will handle the sync
    }

    // Update Firestore immediately
    await adminDb.collection("users").doc(uid).update({
      subscription_status: "cancelled",
      ...(endsAt && { subscription_ends_at: endsAt }),
    });

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled. You will receive a confirmation email.",
    });
  } catch (error) {
    console.error("[Cancel] Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Cancellation failed: ${message}` },
      { status: 500 }
    );
  }
}