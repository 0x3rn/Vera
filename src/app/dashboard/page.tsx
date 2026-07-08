import { getCurrentUser } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase/admin";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { AnalysisResult } from "@/lib/contract-analyzer";
import ClientGreeting from "./ClientGreeting";
import { checkIsPro } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export default async function DashboardOverview() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { uid, email, dbUser } = user;

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

  const isPro = checkIsPro(dbUser);
  const hasPurchased = (dbUser.bonus_scans || 0) > 0;
  const packSize = hasPurchased ? 5 : 1;
  const scansAllowed = 1 + (dbUser.bonus_scans || 0);
  const scansRemainingNumber = Math.max(0, scansAllowed - (dbUser.free_scans_used || 0));
  const freeScansLeft = isPro 
    ? "Unlimited" 
    : `${scansRemainingNumber} of ${packSize} scan${packSize !== 1 ? "s" : ""} left`;

  // Compute metrics
  const totalScans = scans.length;
  let totalRisks = 0;
  let totalHighRisks = 0;
  const recentFindings: Array<{
    scanId: string;
    documentName: string;
    title: string;
    severity: string;
  }> = [];

  scans.forEach((scan: any) => {
    if (scan.ai_result) {
      const aiResult = scan.ai_result as unknown as AnalysisResult;
      const flags = aiResult.redFlags || [];
      totalRisks += flags.length;

      const highRiskFlags = flags.filter((f) => f.severity === "high" || f.severity === "critical");
      totalHighRisks += highRiskFlags.length;

      // Extract a few recent findings
      flags.slice(0, 2).forEach((flag) => {
        if (recentFindings.length < 5) {
          recentFindings.push({
            scanId: scan.id,
            documentName: scan.document_name,
            title: flag.title,
            severity: flag.severity,
          });
        }
      });
    }
  });

  const lastScan = scans.length > 0 ? scans[0] : null;
  const lastScanAiResult = lastScan?.ai_result
    ? (lastScan.ai_result as unknown as AnalysisResult)
    : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <ClientGreeting firstName={dbUser.first_name || "User"} />
        <p className="text-muted-foreground text-sm mt-1">
          Don't sign your next contract blindly. Upload a PDF and get a plain-English risk report in seconds.
        </p>
      </div>

      <div className="mb-8">
        <Link href="/dashboard/scan" className="inline-block px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors">
          New Scan
        </Link>
      </div>

      {totalScans === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center max-w-3xl mx-auto mt-12">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">Welcome to Vera.</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Upload your first contract and we'll scan it for:
            <span className="block mt-4 text-emerald-400 text-sm">
              ✓ Hidden fees &nbsp; ✓ Landlord advantages &nbsp; ✓ Uncapped liability &nbsp; ✓ Cancellation traps
            </span>
          </p>
          <Link href="/dashboard/scan" className="inline-block px-8 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover transition-colors shadow-lg shadow-indigo-500/25">
            Upload Contract
          </Link>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-2xl p-4 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Reviewed</p>
              <p className="text-3xl font-bold">{totalScans}</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Risks Found</p>
              <p className="text-3xl font-bold">{totalRisks}</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">High Risk</p>
              <p className="text-3xl font-bold text-red-400">{totalHighRisks}</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Plan</p>
              <p className="text-xl sm:text-2xl font-bold">{isPro ? "Pro" : "Free"}</p>
              <p className="text-muted-foreground text-xs mt-1">
                {freeScansLeft}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-w-0">
            {/* Last Scan Preview */}
            {lastScan && (
              <div className="bg-card border border-border rounded-2xl p-6 min-w-0 overflow-hidden">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  Last Scan Preview
                </h3>
                <div className="bg-muted border border-border rounded-xl p-5 mb-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground break-words" style={{ wordBreak: 'break-word', hyphens: 'auto' }}>
                        {lastScan.document_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(lastScan.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {lastScanAiResult && (
                      <div className={`inline-flex shrink-0 self-start px-2.5 py-1 rounded text-xs font-bold ${
                        lastScan.risk_score >= 70 ? 'bg-red-500/10 text-red-400' :
                        lastScan.risk_score >= 40 ? 'bg-amber-500/10 text-amber-400' :
                        'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        Score: {lastScan.risk_score}/100
                      </div>
                    )}
                  </div>

                  {lastScanAiResult ? (
                    <div className="space-y-3">
                      {lastScanAiResult.redFlags.slice(0, 3).map((flag, idx) => (
                        <div key={idx} className="flex gap-3 items-start">
                          <span className="text-red-400 shrink-0">⚠</span>
                          <span className="text-sm text-muted-foreground">{flag.title}</span>
                        </div>
                      ))}
                      {lastScanAiResult.redFlags.length === 0 && (
                        <p className="text-sm text-emerald-400">No major risks detected.</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Scan pending or failed.</p>
                  )}
                </div>
                <Link href="/dashboard/reports" className="block w-full py-3 text-center rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary-hover/20 transition-colors">
                  View Full Report
                </Link>
              </div>
            )}

            {/* Recent Findings */}
            <div className="bg-card border border-border rounded-2xl p-6 min-w-0 overflow-hidden">
              <h3 className="text-lg font-bold mb-6">Recent Findings</h3>
              {recentFindings.length > 0 ? (
                <div className="space-y-4">
                  {recentFindings.map((finding, idx) => (
                    <Link key={idx} href={`/dashboard/results/${finding.scanId}`} className="block group">
                      <div className="bg-muted border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`w-2 h-2 rounded-full ${
                            finding.severity === "high" ? "bg-red-500" :
                            finding.severity === "medium" ? "bg-amber-500" :
                            "bg-blue-500"
                          }`} />
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{finding.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground pl-4 truncate">— Found in {finding.documentName}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No risks detected yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}