"use client";

import { useState } from "react";
import Link from "next/link";
import { getRiskBand, getRiskLabel } from "@/lib/risk";

type ScanSummary = {
  id: string;
  document_name: string;
  risk_score: number;
  payment_status: string;
  created_at: Date;
  has_result: boolean;
  risks_found: number;
};

function riskBadge(score: number) {
  const band = getRiskBand(score);
  if (band === "critical") return "bg-red-500/10 text-red-400 border-red-500/30";
  if (band === "high") return "bg-orange-500/10 text-orange-400 border-orange-500/30";
  if (band === "moderate") return "bg-amber-500/10 text-amber-400 border-amber-500/30";
  return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
}

export default function ReportsClient({ initialScans }: { initialScans: ScanSummary[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredScans = initialScans.filter((scan) =>
    scan.document_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6 relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search by document name..."
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-foreground placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {initialScans.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-muted-foreground mb-4">No scans yet.</p>
          <Link href="/dashboard/scan" className="inline-block px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors">
            Scan a contract
          </Link>
        </div>
      ) : filteredScans.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
          No reports found matching "{searchQuery}".
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="hidden sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(12rem,1.1fr)_minmax(5.5rem,0.55fr)_minmax(7rem,0.75fr)] gap-4 px-6 py-4 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted">
            <span>Document</span>
            <span>Risk Score</span>
            <span className="text-center">Risks Found</span>
            <span className="text-right">Date</span>
          </div>
          {filteredScans.map((scan) => (
            <Link key={scan.id} href={`/dashboard/results/${scan.id}`} className="block group">
              <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(12rem,1.1fr)_minmax(5.5rem,0.55fr)_minmax(7rem,0.75fr)] gap-1.5 sm:gap-4 px-4 sm:px-6 py-4 border-b border-border last:border-0 items-start sm:items-center hover:bg-muted transition-colors cursor-pointer">
                <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">{scan.document_name}</span>
                <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-bold uppercase px-2.5 py-1 rounded-full border w-fit ${riskBadge(scan.risk_score)}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${getRiskBand(scan.risk_score) === "critical" ? "bg-red-600" : getRiskBand(scan.risk_score) === "high" ? "bg-orange-500" : getRiskBand(scan.risk_score) === "moderate" ? "bg-amber-500" : "bg-emerald-500"}`} />
                  {getRiskLabel(scan.risk_score)} ({scan.risk_score})
                </span>
                <span className="text-sm text-muted-foreground sm:text-center">{scan.risks_found}</span>
                <span className="text-xs text-muted-foreground sm:text-right">
                  {new Date(scan.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
