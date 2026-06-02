import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabase } from "@/lib/supabase-server";
import { initLemonSqueezy } from "@/lib/lemonsqueezy";
import { cancelSubscription } from "@lemonsqueezy/lemonsqueezy.js";

export async function POST(request: NextRequest) {
  try {
    initLemonSqueezy();

    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { subscription_id: true, subscription_status: true },
    });

    if (!dbUser?.subscription_id || dbUser.subscription_status !== "active") {
      return NextResponse.json(
        { error: "No active subscription found." },
        { status: 400 }
      );
    }

    // Cancel in Lemon Squeezy
    try {
      const result = await cancelSubscription(dbUser.subscription_id);
      console.log(`[Cancel] Subscription ${dbUser.subscription_id} cancelled — status:`, (result as any)?.statusCode);
    } catch (lsError: any) {
      console.error("[Cancel] Lemon Squeezy error:", lsError.message || lsError);
      // Continue anyway — webhook will handle the sync
    }

    // Update Prisma immediately
    await prisma.user.update({
      where: { email: user.email! },
      data: { subscription_status: "cancelled" },
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