"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { AnalysisResult, RedFlag } from "@/lib/contract-analyzer";

const CATEGORY_LABELS: Record<RedFlag["category"], string> = {
  payment: "Payment Terms",
  "ip-rights": "IP Rights",
  exclusivity: "Exclusivity",
  termination: "Termination",
  liability: "Liability & Indemnity",
  "non-compete": "Non-Compete",
  "scope-creep": "Scope Creep",
  other: "Other Concern",
};

function RiskMeter({ score }: { score: number }) {
  const color =
    score <= 30 ? "bg-emerald-500" : score <= 60 ? "bg-amber-500" : "bg-red-500";
  const textColor =
    score <= 30
      ? "text-emerald-400"
      : score <= 60
        ? "text-amber-400"
        : "text-red-400";
  const label =
    score <= 30 ? "Low Risk" : score <= 60 ? "Moderate Risk" : "High Risk";

  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="flex justify-between items-baseline mb-2">
        <span className={`text-sm font-semibold ${textColor}`}>{label}</span>
        <span className="text-4xl font-bold">
          {score}
          <span className="text-lg font-normal text-muted-foreground">/100</span>
        </span>
      </div>
      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

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

          <div className="flex justify-center py-6">
            <RiskMeter score={analysis.overallRiskScore} />
          </div>

          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Summary</h3>
            <p className="text-muted-foreground leading-relaxed text-lg">{analysis.summary}</p>
          </div>

          {analysis.keyDates && analysis.keyDates.length > 0 && (
            <div className="p-6 rounded-xl bg-card border border-border">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Key Dates & Deadlines</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {analysis.keyDates.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted border border-border text-sm text-muted-foreground"
                  >
                    <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {d}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-baseline gap-3 mb-5">
              <h3 className="text-2xl font-bold">Red Flags</h3>
              <span className="px-3 py-0.5 rounded-full bg-red-500/10 text-red-400 text-sm font-bold border border-red-500/20">
                {analysis.redFlags.length}
              </span>
            </div>

            {analysis.redFlags.length === 0 ? (
              <div className="p-10 text-center rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                <p className="font-bold text-emerald-400 text-lg">No red flags found</p>
                <p className="text-emerald-500/70 text-sm mt-1">This contract appears clean.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analysis.redFlags.map((flag: RedFlag) => (
                  <div
                    key={flag.id}
                    className={`p-6 rounded-xl border bg-card ${
                      flag.severity === "high"
                        ? "border-red-500/50 bg-red-500/5"
                        : flag.severity === "medium"
                          ? "border-amber-500/50 bg-amber-500/5"
                          : "border-blue-500/50 bg-blue-500/5"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border mb-2">
                          {CATEGORY_LABELS[flag.category]}
                        </span>
                        <h4 className="font-bold text-lg">{flag.title}</h4>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border self-start ${
                          flag.severity === "high"
                            ? "bg-red-500/10 text-red-400 border-red-500/30"
                            : flag.severity === "medium"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            flag.severity === "high"
                              ? "bg-red-500"
                              : flag.severity === "medium"
                                ? "bg-amber-500"
                                : "bg-blue-500"
                          }`}
                        />
                        {flag.severity === "high" ? "High Risk" : flag.severity === "medium" ? "Medium Risk" : "Low Risk"}
                      </span>
                    </div>

                    {flag.clauseExcerpt && (
                      <div className="mb-4 p-4 rounded-lg bg-muted border border-border">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Original Language</p>
                        <p className="text-sm text-muted-foreground italic">&ldquo;{flag.clauseExcerpt}&rdquo;</p>
                      </div>
                    )}

                    <div className="mb-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">What This Means</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{flag.plainEnglishExplanation}</p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">How to Fix It</p>
                      <p className="text-sm text-emerald-300 bg-emerald-500/5 p-4 rounded-lg border border-emerald-500/20 leading-relaxed">
                        {flag.suggestedFix}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 rounded-lg bg-card border border-border">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-muted-foreground">Disclaimer:</strong> Vera is an AI analysis tool, not legal counsel. This report does not constitute legal advice. Consult a qualified attorney before signing any legally binding documents.
            </p>
          </div>
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