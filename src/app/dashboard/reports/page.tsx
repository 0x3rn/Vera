import { getCurrentUser } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase/admin";
import { redirect } from "next/navigation";
import ReportsClient from "./ReportsClient";
import type { AnalysisResult } from "@/lib/contract-analyzer";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { uid, dbUser } = user;

  if (!dbUser) {
    redirect("/login");
  }

  const scansSnapshot = await adminDb
    .collection("users")
    .doc(uid)
    .collection("scans")
    .orderBy("created_at", "desc")
    .get();

  const scans = scansSnapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...(doc.data() as any),
  }));

  const formattedScans = scans.map((scan: any) => {
    let risksFound = 0;
    if (scan.ai_result) {
      const aiResult = scan.ai_result as unknown as AnalysisResult;
      risksFound = aiResult.redFlags?.length || 0;
    }
    
    return {
      id: scan.id,
      document_name: scan.document_name,
      risk_score: scan.risk_score,
      payment_status: scan.payment_status,
      created_at: new Date(scan.created_at),
      has_result: !!scan.ai_result,
      risks_found: risksFound,
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Reports</h1>
        <p className="text-zinc-400 text-sm mt-1">
          View your past contract scans and risk analyses.
        </p>
      </div>

      <ReportsClient initialScans={formattedScans} />
    </div>
  );
}
