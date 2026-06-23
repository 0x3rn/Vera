"use client";

import { useState } from "react";
import type { AnalysisResult, RedFlag } from "@/lib/contract-analyzer";
import RiskMeter from "./RiskMeter";

export const CATEGORY_LABELS: Record<RedFlag["category"], string> = {
  payment: "Payment Terms",
  "hidden-fees": "Hidden Fees",
  "landlord-advantages": "Landlord Advantages",
  "cancellation-traps": "Cancellation Traps",
  "legal-risks": "Legal Risks",
  "ip-rights": "IP Rights",
  exclusivity: "Exclusivity",
  termination: "Termination",
  liability: "Liability & Indemnity",
  "non-compete": "Non-Compete",
  arbitration: "Arbitration & Disputes",
  "data-privacy": "Data & Privacy",
  other: "Other Concern",
};

interface AnalysisReportProps {
  analysis: AnalysisResult;
}

function ExpandableDrawer({ 
  title, 
  icon, 
  isOpen, 
  onToggle, 
  children 
}: { 
  title: string; 
  icon: React.ReactNode; 
  isOpen: boolean; 
  onToggle: () => void; 
  children: React.ReactNode 
}) {
  return (
    <div className={`border rounded-xl bg-white text-zinc-900 dark:bg-[#121216] dark:text-white overflow-hidden transition-all duration-300 ${isOpen ? 'border-primary/50 ring-1 ring-primary/20 shadow-lg' : 'border-zinc-200 dark:border-white/10'}`}>
      <button 
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between bg-white text-zinc-900 dark:bg-[#121216] dark:text-white hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-zinc-100 dark:bg-[#070709] rounded-lg text-primary">
            {icon}
          </div>
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white text-left">{title}</h3>
        </div>
        <svg 
          className={`w-5 h-5 text-zinc-600 dark:text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div 
        className="grid transition-all duration-500 ease-in-out"
        style={{ 
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          opacity: isOpen ? 1 : 0 
        }}
      >
        <div className="overflow-hidden">
          <div className="px-6 pb-6 pt-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnalysisReport({ analysis }: AnalysisReportProps) {
  const [copied, setCopied] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);

  const toggleDrawer = (id: string) => setActiveDrawer(a => a === id ? null : id);

  // Sort flags: critical > high > medium > low
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedFlags = [...analysis.redFlags].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  const copyChecklist = () => {
    if (!analysis.negotiationChecklist) return;
    navigator.clipboard.writeText(analysis.negotiationChecklist.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const score = analysis.overallRiskScore;
  let verdictClass = "";
  let verdictText = "";
  if (score >= 80) {
    verdictClass = "bg-red-600 border-red-700 text-white dark:bg-red-900/80 dark:border-red-900/50 dark:text-white";
    verdictText = "CRITICAL WARNING: DO NOT SIGN";
  } else if (score >= 45) {
    verdictClass = "bg-amber-600 border-amber-700 text-white dark:bg-amber-900/80 dark:border-amber-900/50 dark:text-white";
    verdictText = "WARNING: PROCEED WITH EXTREME CAUTION";
  } else {
    verdictClass = "bg-emerald-600 border-emerald-700 text-white dark:bg-emerald-900/80 dark:border-emerald-900/50 dark:text-white";
    verdictText = "PASSED: SAFE TO SIGN";
  }

  const enforceabilityFlags = sortedFlags.filter(f => f.enforcementLikelihood || f.industryStandard || f.enforceabilityInsight);

  return (
    <div className="w-full space-y-10 animate-in fade-in zoom-in duration-500">
      
      {/* 1. EXECUTIVE SUMMARY SECTION */}
      
      <div className="flex flex-col items-center justify-center py-6 gap-6">
        <RiskMeter score={analysis.overallRiskScore} />
        <div className={`px-6 py-3 rounded-full border shadow-sm font-black tracking-widest uppercase text-sm ${verdictClass}`}>
          {verdictText}
        </div>
      </div>

      <div className="p-8 rounded-2xl border bg-white text-zinc-900 border-zinc-200 dark:bg-[#121216] dark:text-white dark:border-white/10">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 mb-4">Executive Summary</h3>
        <p className="text-zinc-900 dark:text-white leading-relaxed text-lg font-medium">{analysis.summary}</p>
      </div>


      {/* Key Dates & Deadlines */}
      {analysis.keyDates && analysis.keyDates.length > 0 && (
        <div className="p-8 rounded-2xl border bg-white text-zinc-900 border-zinc-200 dark:bg-[#121216] dark:text-white dark:border-white/10">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-zinc-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Key Dates & Deadlines
          </h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {analysis.keyDates.map((d: { label: string; date: string }, i: number) => (
              <div key={i} className="flex flex-col p-4 rounded-xl bg-zinc-50 dark:bg-[#070709] border border-zinc-200 dark:border-white/10">
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest mb-1">{d.label}</span>
                <span className="font-semibold text-zinc-900 dark:text-white">{d.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deal Breakers */}
      {analysis.dealBreakers && analysis.dealBreakers.length > 0 && (
        <div className="p-8 rounded-2xl border bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-400 border-red-200 dark:border-red-900/50">
          <h3 className="text-sm font-bold uppercase tracking-widest text-red-800 dark:text-red-400 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Deal Breakers
          </h3>
          <ul className="space-y-3">
            {analysis.dealBreakers.map((breaker, i) => (
              <li key={i} className="flex items-start gap-3 text-red-800 dark:text-red-400 font-medium">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-base font-medium leading-relaxed">{breaker}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Financial Exposure Widget */}
        {analysis.financialExposure && (
          <div className="p-8 rounded-2xl border bg-white text-zinc-900 border-zinc-200 dark:bg-[#121216] dark:text-white dark:border-white/10 flex flex-col">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Financial Exposure
            </h3>
            <div className="space-y-4 flex-grow">
              <div className="p-4 bg-zinc-50 dark:bg-[#070709] rounded-xl border border-zinc-200 dark:border-white/10">
                <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest mb-1">Explicit Liability Cap</p>
                <p className="text-base font-semibold text-zinc-900 dark:text-white">{analysis.financialExposure.explicitLiabilityCap}</p>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-[#070709] rounded-xl border border-zinc-200 dark:border-white/10">
                <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest mb-1">Liquidated Damages</p>
                <p className="text-base font-semibold text-zinc-900 dark:text-white">{analysis.financialExposure.liquidatedDamages}</p>
              </div>
            </div>
            <div className="mt-4 p-5 rounded-xl border bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-400 border-red-200 dark:border-red-900/50">
              <p className="text-xs font-bold text-red-800 dark:text-red-400 uppercase tracking-widest mb-1">Total Estimated Exposure</p>
              <p className="text-lg font-bold text-red-800 dark:text-red-400">{analysis.financialExposure.totalEstimatedExposure}</p>
            </div>
          </div>
        )}

        {/* Worst-Case Scenario */}
        {analysis.worstCaseScenario && (
          <div className="p-8 rounded-2xl border bg-white text-zinc-900 border-zinc-200 dark:bg-[#121216] dark:text-white dark:border-white/10 flex flex-col">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Worst-Case Scenario
            </h3>
            <div className="flex-grow flex items-center">
              <p className="font-medium leading-relaxed text-sm italic border-l-2 border-red-500/50 pl-4 py-2 rounded-r-xl bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-400">
                {analysis.worstCaseScenario}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Top 5 Negotiation Points */}
      {analysis.negotiationChecklist && analysis.negotiationChecklist.length > 0 && (
        <div className="p-8 rounded-2xl bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-800 dark:text-cyan-400 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Top Negotiation Points
            </h3>
            <button 
              onClick={copyChecklist}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-500/20 dark:hover:bg-cyan-500/30 text-cyan-800 dark:text-cyan-400 rounded-lg border border-cyan-200 dark:border-cyan-900/50 transition-colors flex items-center gap-2"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
          <div className="space-y-3 p-5 rounded-xl border shadow-sm bg-white text-zinc-900 border-zinc-200 dark:bg-[#121216] dark:text-white dark:border-white/10">
            {analysis.negotiationChecklist.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 text-cyan-500 dark:text-cyan-400 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-zinc-900 dark:text-white text-sm md:text-base font-semibold">{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Positive Findings */}
      {analysis.positiveFindings && analysis.positiveFindings.length > 0 && (
        <div className="p-8 rounded-2xl border bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50">
          <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-400 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Positive Findings
          </h3>
          <ul className="space-y-3">
            {analysis.positiveFindings.map((finding, i) => {
              const cleanText = finding.replace(/^✓\s*/, '');
              return (
                <li key={i} className="flex items-start gap-3 text-emerald-800 dark:text-emerald-400 font-medium">
                  <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-base font-medium leading-relaxed">{cleanText}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}



      <div className="pt-8 pb-4">
        <h2 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">Advanced Analysis</h2>
        <p className="text-zinc-600 dark:text-zinc-400">Expand sections below for a comprehensive legal breakdown.</p>
      </div>

      {/* 2. ADVANCED EXPANDERS */}
      <div className="space-y-4">
        
        {/* Drawer 1: All Findings */}
        <ExpandableDrawer 
          title={`View All Findings (${sortedFlags.length})`}
          isOpen={activeDrawer === 'findings'}
          onToggle={() => toggleDrawer('findings')}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        >
          <div className="space-y-6 mt-4">
            {sortedFlags.length === 0 ? (
              <p className="text-zinc-600 dark:text-zinc-400 text-center py-8">No issues found.</p>
            ) : (
              sortedFlags.map((flag: any, idx: number) => {
                const isCritical = flag.severity === "critical";
                const isHigh = flag.severity === "high";
                const isMedium = flag.severity === "medium";
                
                const borderClass = isCritical ? "border-red-200 dark:border-red-900/50" : isHigh ? "border-red-200 dark:border-red-900/50" : isMedium ? "border-amber-200 dark:border-amber-900/50" : "border-cyan-200 dark:border-cyan-900/50";
                const bgClass = isCritical || isHigh ? "bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-400" : isMedium ? "bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400" : "bg-cyan-50 dark:bg-cyan-950/20 text-cyan-800 dark:text-cyan-400";

                return (
                  <div key={idx} className={`p-6 md:p-8 rounded-2xl border ${borderClass} ${bgClass} shadow-sm`}>
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                      <div>
                        <span className="inline-block px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 mb-3 border border-zinc-200 dark:border-white/10">
                          {CATEGORY_LABELS[flag.category as RedFlag["category"]] || flag.category}
                        </span>
                        <h4 className={`text-xl font-bold ${isCritical || isHigh ? 'text-red-800 dark:text-red-400' : isMedium ? 'text-amber-800 dark:text-amber-400' : 'text-cyan-800 dark:text-cyan-400'}`}>{flag.title}</h4>
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                            isCritical || isHigh ? "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-900/50" : isMedium ? "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/50" : "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/50"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isCritical ? "bg-red-600 animate-pulse" : isHigh ? "bg-red-500" : isMedium ? "bg-amber-500" : "bg-cyan-500"}`} />
                          {flag.severity} Risk
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400">
                          Confidence: {flag.confidenceScore}%
                        </span>
                        {flag.enforcementLikelihood && (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                            flag.enforcementLikelihood === 'High' ? "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-900/50" : 
                            flag.enforcementLikelihood === 'Medium' ? "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/50" : 
                            "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
                          }`}>
                            Enforceability: {flag.enforcementLikelihood}
                          </span>
                        )}
                      </div>
                    </div>

                    {flag.industryStandard && flag.deviation && (
                      <div className="mb-6 rounded-xl bg-zinc-50 dark:bg-[#070709] border border-zinc-200 dark:border-white/10 overflow-hidden">
                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                          <p className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest">Industry Benchmark Comparison</p>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-600 dark:text-zinc-400">Industry Standard:</span>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-300 text-right">{flag.industryStandard}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm border-t border-zinc-200 dark:border-zinc-800 pt-3">
                            <span className="text-zinc-600 dark:text-zinc-400">This Contract:</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400 text-right">{flag.deviation}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-zinc-900 dark:text-white mb-6 leading-relaxed text-base font-medium">{flag.plainEnglishExplanation}</p>
                    
                    <div className="border border-emerald-200 dark:border-emerald-900/50 p-5 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400">
                      <p className="text-sm font-medium">
                        <span className="font-bold block mb-1">Recommendation:</span> {flag.suggestedFix}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ExpandableDrawer>

        {/* Drawer 2: Clause Conflicts & Risk Chains */}
        <ExpandableDrawer 
          title="View Clause Conflicts & Risk Chains"
          isOpen={activeDrawer === 'conflicts'}
          onToggle={() => toggleDrawer('conflicts')}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          }
        >
          <div className="space-y-8 mt-4">
            <div>
              <h4 className="font-bold uppercase tracking-widest text-amber-500 text-sm mb-4">Critical Conflicts</h4>
              {(!analysis.clauseConflicts || analysis.clauseConflicts.length === 0) ? (
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">No conflicts detected.</p>
              ) : (
                <div className="space-y-4">
                  {analysis.clauseConflicts.map((conflict, i) => {
                    const parts = conflict.conflict.split(/vs/i);
                    return (
                      <div key={i} className="p-5 rounded-xl border bg-white text-zinc-900 border-zinc-200 dark:bg-[#121216] dark:text-white dark:border-white/10">
                        <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
                          <div className="w-full sm:flex-1 p-3 bg-zinc-50 dark:bg-[#070709] rounded-lg text-sm font-medium border border-zinc-200 dark:border-white/10 text-center text-zinc-900 dark:text-white">{parts[0]?.trim()}</div>
                          <span className="text-amber-500 font-black italic text-sm">VS</span>
                          <div className="w-full sm:flex-1 p-3 bg-zinc-50 dark:bg-[#070709] rounded-lg text-sm font-medium border border-zinc-200 dark:border-white/10 text-center text-zinc-900 dark:text-white">{parts[1]?.trim() || "Contradiction"}</div>
                        </div>
                        <p className="text-sm text-amber-800 dark:text-amber-400 leading-relaxed"><span className="font-bold">Effect: </span>{conflict.explanation}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <h4 className="font-bold uppercase tracking-widest text-cyan-500 text-sm mb-4">Compound Risk Chains</h4>
              {(!analysis.riskChains || analysis.riskChains.length === 0) ? (
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">No risk chains detected.</p>
              ) : (
                <div className="space-y-6">
                  {analysis.riskChains.map((chain, i) => (
                    <div key={i} className="p-5 rounded-xl border bg-white text-zinc-900 border-zinc-200 dark:bg-[#121216] dark:text-white dark:border-white/10">
                      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-4">
                        {chain.clauses.map((clause, j) => (
                          <div key={j} className="flex flex-col md:flex-row items-center gap-3 flex-1">
                            <div className="w-full p-3 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg text-xs font-bold text-cyan-800 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-900/50 text-center tracking-wider uppercase">
                              {clause}
                            </div>
                            {j < chain.clauses.length - 1 && <div className="text-zinc-600 dark:text-zinc-400 md:rotate-0 rotate-90 my-1 md:my-0">→</div>}
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-zinc-900 dark:text-white leading-relaxed"><span className="text-cyan-700 dark:text-cyan-400 font-bold mr-2">Loophole Effect:</span>{chain.effect}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ExpandableDrawer>

        {/* Drawer 3: Enforceability Likelihood & Benchmarks */}
        <ExpandableDrawer 
          title="View Enforceability Likelihood & Industry Benchmarks"
          isOpen={activeDrawer === 'enforceability'}
          onToggle={() => toggleDrawer('enforceability')}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          }
        >
          <div className="mt-4 space-y-4">
            {enforceabilityFlags.length === 0 ? (
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">No benchmark or enforceability data extracted.</p>
            ) : (
              enforceabilityFlags.map((flag, i) => (
                <div key={i} className="p-5 rounded-xl border bg-white text-zinc-900 border-zinc-200 dark:bg-[#121216] dark:text-white dark:border-white/10">
                  <h4 className="font-bold text-zinc-900 dark:text-white mb-4">{flag.title}</h4>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {flag.enforcementLikelihood && (
                      <div>
                        <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest mb-2">Enforcement Likelihood</p>
                        <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold border ${
                          flag.enforcementLikelihood === 'High' ? "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-900/50" : 
                          flag.enforcementLikelihood === 'Medium' ? "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/50" : 
                          "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
                        }`}>
                          {flag.enforcementLikelihood}
                        </span>
                        {flag.enforceabilityInsight && (
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">{flag.enforceabilityInsight}</p>
                        )}
                      </div>
                    )}
                    
                    {flag.industryStandard && (
                      <div>
                        <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest mb-2">Industry Benchmark</p>
                        <div className="bg-zinc-50 dark:bg-[#070709] rounded-lg border border-zinc-200 dark:border-white/10 overflow-hidden">
                          <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between text-sm">
                            <span className="text-zinc-600 dark:text-zinc-400">Standard:</span>
                            <span className="font-medium text-zinc-800 dark:text-zinc-300 text-right">{flag.industryStandard}</span>
                          </div>
                          {flag.deviation && (
                            <div className="p-3 flex justify-between text-sm">
                              <span className="text-zinc-600 dark:text-zinc-400">Deviation:</span>
                              <span className="font-bold text-amber-600 dark:text-amber-400 text-right">{flag.deviation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ExpandableDrawer>


        {/* Drawer 5: Original Contract Clauses */}
        <ExpandableDrawer 
          title="View Original Contract Clauses"
          isOpen={activeDrawer === 'clauses'}
          onToggle={() => toggleDrawer('clauses')}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        >
          <div className="mt-4 space-y-4">
            {sortedFlags.map((flag, i) => (
              <div key={i} className="p-5 rounded-xl border bg-white text-zinc-900 border-zinc-200 dark:bg-[#121216] dark:text-white dark:border-white/10">
                <p className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest mb-2">{flag.title}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 italic leading-relaxed border-l-2 border-zinc-200 dark:border-white/10 pl-3">"{flag.clauseExcerpt}"</p>
              </div>
            ))}
          </div>
        </ExpandableDrawer>
      </div>

      <div className="p-5 rounded-xl border mt-8 bg-white text-zinc-900 border-zinc-200 dark:bg-[#121216] dark:text-white dark:border-white/10">
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          <strong className="text-zinc-900 dark:text-white">Disclaimer:</strong> Vera is an AI analysis tool, not legal counsel. This report does not constitute legal advice. Consult a qualified attorney before signing any legally binding documents.
        </p>
      </div>
    </div>
  );
}
