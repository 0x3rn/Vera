import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    include: {
      scans: {
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          document_name: true,
          risk_score: true,
          payment_status: true,
          created_at: true,
          ai_result: true,
        },
      },
    },
  });

  if (!dbUser) {
    // User exists in Supabase but not yet in Prisma — create them
    const newUser = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email!,
        free_scans_used: 0,
      },
    });

    return NextResponse.json({ user: newUser, scans: [] });
  }

  return NextResponse.json({
    user: {
      id: dbUser.id,
      email: dbUser.email,
      free_scans_used: dbUser.free_scans_used,
      subscription_status: dbUser.subscription_status,
      subscription_id: dbUser.subscription_id,
      customer_id: dbUser.customer_id,
    },
    scans: dbUser.scans,
  });
}