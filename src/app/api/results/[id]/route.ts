import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const scanRef = adminDb.collection("users").doc(user.uid).collection("scans").doc(id);
  const scanDoc = await scanRef.get();

  if (!scanDoc.exists) {
    return NextResponse.json({ error: "Scan not found or unauthorized" }, { status: 404 });
  }

  return NextResponse.json({ id: scanDoc.id, ...scanDoc.data() });
}