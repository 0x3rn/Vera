"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { AnalysisResult } from "@/lib/contract-analyzer";
import AnalysisReport, { CopyFullReportButton } from "@/components/AnalysisReport";
import ReportLoading from "@/components/ReportLoading";


interface ScanData {
  id: string;
  document_name: string;
  suggested_title?: string;
  ai_result: AnalysisResult | null;
  payment_status: "free" | "unpaid" | "paid";
  created_at: string;
}

export default function DashboardResultsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [scan, setScan] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchScan() {
      try {
        const res = await fetch(`/api/results/${id}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load scan");
        }
        const data = await res.json();
        setScan(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load results");
      } finally {
        setLoading(false);
      }
    }
    fetchScan();
  }, [id]);

  if (loading) {
    return <ReportLoading />;
  }

  if (error || !scan) {
    return (
      <div className="animate-in fade-in duration-500 text-center py-20">
        <p className="text-red-400 font-medium">{error || "Scan not found"}</p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block text-sm text-primary hover:text-indigo-300 underline underline-offset-4"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  const analysis = scan.ai_result;

  const deleteReport = async () => {
    if (!window.confirm("Delete this report permanently? This cannot be undone.")) return;
    setDeleting(true);
    const response = await fetch(`/api/results/${id}`, { method: "DELETE" });
    if (response.ok) router.replace("/dashboard/reports");
    else {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Could not delete this report.");
      setDeleting(false);
    }
  };

  if (!analysis || scan.payment_status === "unpaid") {
    return (
      <div className="animate-in fade-in duration-500 text-center py-20">
        <h2 className="text-2xl font-bold mb-3">Payment Required</h2>
        <p className="text-muted-foreground mb-6">
          This scan hasn't been paid for yet. Complete your payment to view results.
        </p>
        <Link
          href="/dashboard/billing"
          className="inline-block px-6 py-2.5 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover transition-colors"
        >
          View Plans
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-8 bg-transparent">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <Link
            href="/dashboard/reports"
            className="inline-flex items-center gap-2 text-sm text-foreground hover:text-muted-foreground transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Reports
          </Link>
          <div>
            <span className="inline-block px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-card text-muted-foreground border border-border mb-2">
              {analysis.contractType}
            </span>
          </div>
          <h2 className="text-3xl font-bold mt-2">Analysis Report</h2>
          <p className="text-sm text-muted-foreground mt-1 break-words line-clamp-2" title={scan.suggested_title !== "Unknown Document" ? scan.suggested_title : scan.document_name}>
            {scan.suggested_title && scan.suggested_title !== "Unknown Document" ? scan.suggested_title : scan.document_name}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <CopyFullReportButton analysis={analysis} />
          <button onClick={deleteReport} disabled={deleting} className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50">
            {deleting ? "Deleting…" : "Delete report"}
          </button>
        </div>
      </div>

      <AnalysisReport analysis={analysis} showCopyAction={false} />
    </div>
  );
}
