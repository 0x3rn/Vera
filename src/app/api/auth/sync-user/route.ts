import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: "userId and email are required" },
        { status: 400 }
      );
    }

    await prisma.user.upsert({
      where: { email: email.toLowerCase().trim() },
      update: {},
      create: {
        id: userId,
        email: email.toLowerCase().trim(),
        free_scans_used: 0,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sync user error:", error);
    return NextResponse.json(
      { error: "Failed to sync user" },
      { status: 500 }
    );
  }
}