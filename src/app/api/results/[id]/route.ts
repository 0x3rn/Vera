import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase/admin";
import { noStoreHeaders } from "@/lib/http";

async function authorize(id: string) {
  const user = await getCurrentUser();
  if (!user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStoreHeaders() }) };
  if (!user.emailVerified) {
    return { response: NextResponse.json({ error: "Verify your email first.", code: "EMAIL_NOT_VERIFIED" }, { status: 403, headers: noStoreHeaders() }) };
  }
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
    return { response: NextResponse.json({ error: "Invalid result ID." }, { status: 400, headers: noStoreHeaders() }) };
  }
  return { user, scanRef: adminDb.collection("users").doc(user.uid).collection("scans").doc(id) };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorize(id);
  if ("response" in auth) return auth.response;
  const scanDoc = await auth.scanRef.get();
  if (!scanDoc.exists) return NextResponse.json({ error: "Scan not found." }, { status: 404, headers: noStoreHeaders() });
  return NextResponse.json({ id: scanDoc.id, ...scanDoc.data() }, { headers: noStoreHeaders() });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorize(id);
  if ("response" in auth) return auth.response;
  const scanDoc = await auth.scanRef.get();
  if (!scanDoc.exists) return NextResponse.json({ error: "Scan not found." }, { status: 404, headers: noStoreHeaders() });
  await auth.scanRef.delete();
  return NextResponse.json({ success: true }, { headers: noStoreHeaders() });
}
