"use client";

import { useState } from "react";
import Link from "next/link";

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
  if (score >= 70) return "bg-red-500/10 text-red-400 border-red-500/30";
  if (score >= 40) return "bg-amber-500/10 text-amber-400 border-amber-500/30";
  return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
}

function riskLabel(score: number) {
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
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
          <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search by document name..."
          className="w-full pl-10 pr-4 py-2.5 bg-[#121216] border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {initialScans.length === 0 ? (
        <div className="bg-[#121216] border border-[#22222a] rounded-2xl p-8 sm:p-12 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-zinc-400 mb-4">No scans yet.</p>
          <Link href="/dashboard/scan" className="inline-block px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
            Scan a contract
          </Link>
        </div>
      ) : filteredScans.length === 0 ? (
        <div className="bg-[#121216] border border-[#22222a] rounded-2xl p-8 text-center text-zinc-400">
          No reports found matching "{searchQuery}".
        </div>
      ) : (
        <div className="bg-[#121216] border border-[#22222a] rounded-2xl overflow-hidden shadow-sm">
          <div className="hidden sm:grid grid-cols-5 gap-4 px-6 py-4 border-b border-[#22222a] text-xs font-semibold uppercase tracking-wider text-zinc-500 bg-[#0a0a0e]">
            <span className="col-span-2">Document</span>
            <span>Risk Score</span>
            <span>Risks Found</span>
            <span className="text-right">Date</span>
          </div>
          {filteredScans.map((scan) => (
            <Link key={scan.id} href={`/dashboard/results/${scan.id}`} className="block group">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5 sm:gap-4 px-4 sm:px-6 py-4 border-b border-[#22222a] last:border-0 items-start sm:items-center hover:bg-white/[0.02] transition-colors cursor-pointer">
                <span className="text-sm font-medium truncate col-span-2 group-hover:text-indigo-400 transition-colors">{scan.document_name}</span>
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase px-2.5 py-1 rounded-full border w-fit ${riskBadge(scan.risk_score)}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${scan.risk_score >= 70 ? "bg-red-500" : scan.risk_score >= 40 ? "bg-amber-500" : "bg-emerald-500"}`} />
                  {riskLabel(scan.risk_score)} ({scan.risk_score})
                </span>
                <span className="text-sm text-zinc-400">{scan.risks_found}</span>
                <span className="text-xs text-zinc-500 sm:text-right">
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
