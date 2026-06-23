"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { AnalysisResult } from "@/lib/contract-analyzer";
import AnalysisReport from "@/components/AnalysisReport";

interface ScanData {
  id: string;
  document_name: string;
  ai_result: AnalysisResult | null;
  payment_status: "free" | "unpaid" | "paid";
  created_at: string;
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [scan, setScan] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      } catch (err: any) {
        setError(err.message || "Failed to load results");
      } finally {
        setLoading(false);
      }
    }
    fetchScan();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="max-w-6xl mx-auto px-8 h-[70px] flex items-center">
            <Link href="/" className="text-2xl font-bold tracking-tight">
              Vera<span className="text-primary">.</span>
            </Link>
          </div>
        </nav>
        <section className="pt-[180px] pb-[80px] text-center">
          <div className="w-16 h-16 mx-auto mb-8 rounded-full border-4 border-zinc-800 border-t-primary animate-spin" />
          <h2 className="text-2xl font-bold">Loading results...</h2>
        </section>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="flex flex-col min-h-full">
        <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="max-w-6xl mx-auto px-8 h-[70px] flex items-center">
            <Link href="/" className="text-2xl font-bold tracking-tight">
              Vera<span className="text-primary">.</span>
            </Link>
          </div>
        </nav>
        <section className="pt-[180px] pb-[80px] text-center">
          <p className="text-red-400 font-medium">{error || "Scan not found"}</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-primary hover:text-indigo-300 underline underline-offset-4"
          >
            Back to scanner
          </Link>
        </section>
      </div>
    );
  }

  const analysis = scan.ai_result;

  if (!analysis || scan.payment_status === "unpaid") {
    return (
      <div className="flex flex-col min-h-full">
        <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="max-w-6xl mx-auto px-8 h-[70px] flex items-center">
            <Link href="/" className="text-2xl font-bold tracking-tight">
              Vera<span className="text-primary">.</span>
            </Link>
          </div>
        </nav>
        <section className="pt-[180px] pb-[80px] text-center">
          <h2 className="text-2xl font-bold mb-3">Payment Required</h2>
          <p className="text-muted-foreground mb-6">
            This scan hasn't been paid for yet. Complete your payment to view results.
          </p>
          <Link
            href="/pricing"
            className="inline-block px-6 py-2.5 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover transition-colors"
          >
            View Pricing
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-8 h-[70px] flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Vera<span className="text-primary">.</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">{scan.document_name}</span>
          </div>
        </div>
      </nav>

      <section className="pt-[120px] pb-[80px]">
        <div className="max-w-3xl mx-auto px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="inline-block px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-card text-muted-foreground border border-border mb-2">
                {analysis.contractType}
              </span>
              <h2 className="text-3xl font-bold">Analysis Report</h2>
              <p className="text-sm text-muted-foreground mt-1">{scan.document_name}</p>
            </div>
            <Link
              href="/"
              className="text-sm text-primary hover:text-indigo-300 underline underline-offset-4 self-start"
            >
              Scan another
            </Link>
          </div>

          <AnalysisReport analysis={analysis} />
        </div>
      </section>

      <footer className="border-t border-border py-12 mt-auto">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Vera AI Contract Scanner. Not legal advice.
          </p>
        </div>
      </footer>
    </div>
  );
}