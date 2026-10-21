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
  showCopyAction?: boolean;
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

export function CopyFullReportButton({ analysis }: { analysis: AnalysisResult }) {
  const [copiedReport, setCopiedReport] = useState(false);
  const score = analysis.overallRiskScore;
  let verdictText = analysis.verdict || "";

  if (!verdictText) {
    if (score >= 90) verdictText = "CRITICAL WARNING: DO NOT SIGN";
    else if (score >= 75) verdictText = "WARNING: PROCEED WITH EXTREME CAUTION";
    else if (score >= 45) verdictText = "MODERATE RISK: NEGOTIATE BEFORE SIGNING";
    else verdictText = "PASSED: GENERALLY ACCEPTABLE";
  }

  const hasDealBreakers = Boolean(analysis.dealBreakers && analysis.dealBreakers.length > 0);
  const isPassedVerdict = !verdictText.includes("DO NOT SIGN") && !verdictText.includes("EXTREME CAUTION") && !verdictText.includes("NEGOTIATE") && !verdictText.includes("MODERATE");

  if (hasDealBreakers && isPassedVerdict) {
    verdictText = analysis.dealBreakers.length > 1
      ? "PASSED WITH EXCEPTIONS: DEAL BREAKERS IDENTIFIED"
      : "PASSED WITH EXCEPTIONS: DEAL BREAKER IDENTIFIED";
  }

  const severityOrder: Record<RedFlag["severity"], number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedFlags = [...analysis.redFlags].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  const copyFullReport = () => {
    const reportText = `
VERA RISK ANALYSIS REPORT
=========================
Title: ${analysis.suggestedTitle}
Risk Score: ${Math.round(analysis.overallRiskScore)}/100
Verdict: ${verdictText}
Lawyer Review: ${analysis.lawyerReview || "Not Assessed"}
${hasDealBreakers && isPassedVerdict ? `Notice: Overall risk score passed, but ${analysis.dealBreakers.length} deal breaker(s) must be resolved.\n` : ""}
EXECUTIVE SUMMARY
-----------------
${analysis.summary}

SCORE BREAKDOWN
---------------
Critical Risk Flags: ${analysis.scoreBreakdown?.criticalCount || 0}
High Risk Flags: ${analysis.scoreBreakdown?.highCount || 0}
Medium Risk Flags: ${analysis.scoreBreakdown?.mediumCount || 0}
Low Risk Flags: ${analysis.scoreBreakdown?.lowCount || 0}
Weighted Risk Points: ${analysis.scoreBreakdown?.baseScore != null ? Number(analysis.scoreBreakdown.baseScore).toFixed(1) : "N/A"}
One-Sidedness Multiplier: ${analysis.scoreBreakdown?.riskMultiplier != null ? `×${Number(analysis.scoreBreakdown.riskMultiplier).toFixed(1)}` : "1.0x"}
Final Score: ${analysis.scoreBreakdown?.finalScore != null ? Math.round(analysis.scoreBreakdown.finalScore) : Math.round(score)}/100
${analysis.scoreExplanation ? `Context: ${analysis.scoreExplanation}` : ""}

FINANCIAL EXPOSURE
------------------
Explicit Liability Cap: ${analysis.financialExposure?.explicitLiabilityCap || "N/A"}
Liquidated Damages: ${analysis.financialExposure?.liquidatedDamages || "N/A"}
Total Estimated Exposure: ${analysis.financialExposure?.totalEstimatedExposure || "N/A"}
${analysis.financialExposure?.capIllusion?.isIllusory ? "WARNING (Cap Illusion): " + analysis.financialExposure.capIllusion.explanation : ""}

MUTUALITY & BALANCE
-------------------
Termination: ${analysis.mutualityAnalysis?.termination || "N/A"}
Liability: ${analysis.mutualityAnalysis?.liability || "N/A"}
IP Rights: ${analysis.mutualityAnalysis?.ip || "N/A"}
Confidentiality: ${analysis.mutualityAnalysis?.confidentiality || "N/A"}
Overall: ${analysis.mutualityAnalysis?.overall || "N/A"}

WORST CASE SCENARIO
-------------------
${analysis.worstCaseScenario}

${hasDealBreakers ? `DEAL BREAKERS\n-------------\n${analysis.dealBreakers.join('\n')}\n` : ""}
RED FLAGS IDENTIFIED
--------------------
${sortedFlags.map(flag => `
[${flag.severity.toUpperCase()}] ${flag.title}
Category: ${CATEGORY_LABELS[flag.category] || flag.category}
Excerpt: "${flag.clauseExcerpt}"
Explanation: ${flag.plainEnglishExplanation}
Fix: ${flag.suggestedFix}
`).join('\n')}

NEGOTIATION CHECKLIST
---------------------
${(analysis.negotiationChecklist || []).join('\n')}
`.trim();

    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <button
      onClick={copyFullReport}
      className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 rounded-lg transition-colors text-sm font-bold shadow-sm"
    >
      {copiedReport ? (
        <>
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Copied to Clipboard!
        </>
      ) : (
        <>
          <svg className="w-4 h-4 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          Copy Full Report
        </>
      )}
    </button>
  );
}

export default function AnalysisReport({ analysis, showCopyAction = true }: AnalysisReportProps) {
  const [copiedChecklist, setCopiedChecklist] = useState(false);
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
    setCopiedChecklist(true);
    setTimeout(() => setCopiedChecklist(false), 2000);
  };

  const score = analysis.overallRiskScore;
  let verdictClass = "";
  let verdictText = analysis.verdict || "";
  
  if (!verdictText) {
    if (score >= 90) verdictText = "CRITICAL WARNING: DO NOT SIGN";
    else if (score >= 75) verdictText = "WARNING: PROCEED WITH EXTREME CAUTION";
    else if (score >= 45) verdictText = "MODERATE RISK: NEGOTIATE BEFORE SIGNING";
    else verdictText = "PASSED: GENERALLY ACCEPTABLE";
  }

  const hasDealBreakers = Boolean(analysis.dealBreakers && analysis.dealBreakers.length > 0);
  const isPassedVerdict = !verdictText.includes("DO NOT SIGN") && !verdictText.includes("EXTREME CAUTION") && !verdictText.includes("NEGOTIATE") && !verdictText.includes("MODERATE");

  let dealBreakerPassedExplanation = "";
  if (hasDealBreakers && isPassedVerdict) {
    verdictText = analysis.dealBreakers.length > 1
      ? "PASSED WITH EXCEPTIONS: DEAL BREAKERS IDENTIFIED"
      : "PASSED WITH EXCEPTIONS: DEAL BREAKER IDENTIFIED";
    verdictClass = "bg-amber-600 border-amber-700 text-white dark:bg-amber-900/80 dark:border-amber-900/50 dark:text-white";
    dealBreakerPassedExplanation = `Overall risk score is within acceptable limits, but ${
      analysis.dealBreakers.length === 1 ? "1 deal breaker requires" : `${analysis.dealBreakers.length} deal breakers require`
    } resolution before signing.`;
  } else if (verdictText.includes("DO NOT SIGN") || verdictText.includes("EXTREME CAUTION")) {
    verdictClass = "bg-red-600 border-red-700 text-white dark:bg-red-900/80 dark:border-red-900/50 dark:text-white";
  } else if (verdictText.includes("NEGOTIATE") || verdictText.includes("MODERATE")) {
    verdictClass = "bg-amber-600 border-amber-700 text-white dark:bg-amber-900/80 dark:border-amber-900/50 dark:text-white";
  } else {
    verdictClass = "bg-emerald-600 border-emerald-700 text-white dark:bg-emerald-900/80 dark:border-emerald-900/50 dark:text-white";
  }

  const enforceabilityFlags = sortedFlags.filter(f => f.enforcementLikelihood || f.industryStandard || f.enforceabilityInsight);

  const displayFinalScore = analysis.scoreBreakdown?.finalScore != null
    ? Math.round(analysis.scoreBreakdown.finalScore)
    : Math.round(analysis.overallRiskScore);

  return (
    <div className="w-full space-y-10 animate-in fade-in zoom-in duration-500 relative">
      
      {showCopyAction && (
        <div className="flex justify-end mb-[-20px] relative z-10">
          <CopyFullReportButton analysis={analysis} />
        </div>
      )}

      {/* 1. EXECUTIVE SUMMARY SECTION & VERDICT */}
      
      <div className="flex flex-col items-center justify-center py-6 gap-4">
        <RiskMeter score={analysis.overallRiskScore} />
        <div className={`px-6 py-3 rounded-full border shadow-sm font-black tracking-widest uppercase text-sm ${verdictClass}`}>
          {verdictText}
        </div>
        {dealBreakerPassedExplanation && (
          <p className="text-xs sm:text-sm font-medium text-amber-800 dark:text-amber-400 text-center max-w-lg mt-1">
            {dealBreakerPassedExplanation}
          </p>
        )}
      </div>

      {/* Deal Breakers (Moved up, directly under the verdict, above Key Dates) */}
      {hasDealBreakers && (
        <div className="p-8 rounded-2xl border bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-400 border-red-200 dark:border-red-900/50">
          <h3 className="text-sm font-bold uppercase tracking-widest text-red-800 dark:text-red-400 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

      {/* Lawyer Review Recommendation */}
      {analysis.lawyerReview && (
        <div className="p-4 rounded-xl border bg-white text-zinc-900 border-zinc-200 dark:bg-[#121216] dark:text-white dark:border-white/10 flex items-center justify-center gap-3">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
          <span className="font-medium text-sm text-zinc-700 dark:text-zinc-300">Lawyer Review:</span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
            analysis.lawyerReview === 'Essential' || analysis.lawyerReview === 'Strongly Recommended'
              ? 'bg-red-50 text-red-800 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-900/50'
              : analysis.lawyerReview === 'Recommended'
              ? 'bg-amber-50 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-900/50'
              : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              analysis.lawyerReview === 'Essential' || analysis.lawyerReview === 'Strongly Recommended'
                ? 'bg-red-600'
                : analysis.lawyerReview === 'Recommended'
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`} />
            {analysis.lawyerReview}
          </span>
        </div>
      )}

      {/* Risk Concentration Warning (Carries a verdict: colored tint and border) */}
      {analysis.riskConcentration && (
        <div className="p-5 rounded-xl border bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200 dark:border-amber-900/50">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-bold uppercase tracking-widest text-xs mb-1">Risk Concentration Detected</h3>
              <p className="text-sm font-medium">{analysis.riskConcentration.warning}</p>
            </div>
          </div>
        </div>
      )}

      {/* Executive Summary & Score Breakdown */}
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div className="p-8 rounded-2xl border bg-white text-zinc-900 border-zinc-200 dark:bg-[#121216] dark:text-white dark:border-white/10 flex flex-col justify-start">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 mb-4">Executive Summary</h3>
          <p className="text-zinc-900 dark:text-white leading-relaxed text-base font-medium">{analysis.summary}</p>
          {analysis.scoreExplanation && (
            <p className="mt-4 pt-4 border-t border-zinc-200 dark:border-white/10 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {analysis.scoreExplanation}
            </p>
          )}
        </div>

        {/* Score Breakdown Card */}
        {analysis.scoreBreakdown && (
          <div className="p-8 rounded-2xl border bg-white text-zinc-900 border-zinc-200 dark:bg-[#121216] dark:text-white dark:border-white/10 flex flex-col justify-start">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 mb-3">Score Breakdown</h3>
            
            <div className="text-base font-semibold text-zinc-900 dark:text-white mb-2">
              Risk score: {displayFinalScore}/100 <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">(lower is safer)</span>
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              {analysis.scoreBreakdown.criticalCount} critical · {analysis.scoreBreakdown.highCount} high · {analysis.scoreBreakdown.mediumCount} medium · {analysis.scoreBreakdown.lowCount} low
            </p>

            <details className="group border-t border-zinc-200 dark:border-white/10 pt-3">
              <summary className="flex items-center justify-between cursor-pointer text-xs font-bold uppercase tracking-wider text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white select-none">
                <span>How this score is calculated</span>
                <svg className="w-4 h-4 transition-transform duration-200 group-open:rotate-180 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mt-3 space-y-2 pt-1 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-600 dark:text-zinc-400">Weighted risk points</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    {Number(analysis.scoreBreakdown.baseScore).toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-600 dark:text-zinc-400">One-sidedness multiplier</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    ×{Number(analysis.scoreBreakdown.riskMultiplier).toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="font-bold text-xs uppercase tracking-widest text-zinc-900 dark:text-white">Final Score</span>
                  <span className="font-black text-primary">
                    {displayFinalScore} / 100
                  </span>
                </div>
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Key Dates & Deadlines */}
      {analysis.keyDates && analysis.keyDates.length > 0 && (
        <div className="p-8 rounded-2xl border bg-white text-zinc-900 border-zinc-200 dark:bg-[#121216] dark:text-white dark:border-white/10">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* Financial Exposure Widget */}
        {analysis.financialExposure && (
          <div className="p-8 rounded-2xl border bg-white text-zinc-900 border-zinc-200 dark:bg-[#121216] dark:text-white dark:border-white/10 flex flex-col">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            <div className="mt-4 p-5 rounded-xl border bg-zinc-50 dark:bg-[#070709] border-zinc-200 dark:border-white/10">
              <p className="text-xs font-bold uppercase tracking-widest mb-1 text-zinc-600 dark:text-zinc-400">Total Estimated Exposure</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-white">{analysis.financialExposure.totalEstimatedExposure}</p>
              {analysis.financialExposure.capIllusion?.isIllusory && (
                <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-900/50">
                  <div className="flex items-start gap-2 text-amber-800 dark:text-amber-400">
                    <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest mb-1">Cap Illusion Detected</p>
                      <p className="text-sm font-medium">{analysis.financialExposure.capIllusion.explanation}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Worst-Case Scenario (Normal body text with an amber left border, not italic amber) */}
        {analysis.worstCaseScenario && (
          <div className="p-8 rounded-2xl border bg-white text-zinc-900 border-zinc-200 dark:bg-[#121216] dark:text-white dark:border-white/10 flex flex-col">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Worst-Case Scenario
            </h3>
            <div className="flex-grow flex items-start">
              <p className="font-medium leading-relaxed text-sm border-l-2 border-amber-500 pl-4 py-2 text-zinc-900 dark:text-white">
                {analysis.worstCaseScenario}
              </p>
            </div>
          </div>
        )}

        {/* Mutuality Analysis (Cyan removed entirely) */}
        {analysis.mutualityAnalysis && (
          <div className="p-8 rounded-2xl border bg-white text-zinc-900 border-zinc-200 dark:bg-[#121216] dark:text-white dark:border-white/10 flex flex-col md:col-span-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
              Mutuality & Balance
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-zinc-50 dark:bg-[#070709] rounded-xl border border-zinc-200 dark:border-white/10">
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest mb-1 block">Termination</span>
                <span className="font-semibold text-zinc-900 dark:text-white">{analysis.mutualityAnalysis.termination}</span>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-[#070709] rounded-xl border border-zinc-200 dark:border-white/10">
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest mb-1 block">Liability</span>
                <span className="font-semibold text-zinc-900 dark:text-white">{analysis.mutualityAnalysis.liability}</span>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-[#070709] rounded-xl border border-zinc-200 dark:border-white/10">
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest mb-1 block">IP Rights</span>
                <span className="font-semibold text-zinc-900 dark:text-white">{analysis.mutualityAnalysis.ip}</span>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-[#070709] rounded-xl border border-zinc-200 dark:border-white/10">
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest mb-1 block">Confidentiality</span>
                <span className="font-semibold text-zinc-900 dark:text-white">{analysis.mutualityAnalysis.confidentiality}</span>
              </div>
            </div>
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              analysis.mutualityAnalysis.riskMultiplier >= 1.5 
                ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200 dark:border-amber-900/50'
                : 'bg-zinc-50 text-zinc-900 border-zinc-200 dark:bg-[#070709] dark:text-white dark:border-white/10'
            }`}>
              <span className="font-bold uppercase tracking-widest text-xs">Overall Balance</span>
              <span className="font-bold text-sm">{analysis.mutualityAnalysis.overall} (Multiplier: {analysis.mutualityAnalysis.riskMultiplier}x)</span>
            </div>
          </div>
        )}
      </div>

      {/* Top 5 Negotiation Points (Cyan removed, neutral card with brand indigo accent) */}
      {analysis.negotiationChecklist && analysis.negotiationChecklist.length > 0 && (
        <div className="p-8 rounded-2xl border bg-white text-zinc-900 border-zinc-200 dark:bg-[#121216] dark:text-white dark:border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Top Negotiation Points
            </h3>
            <button 
              onClick={copyChecklist}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg border border-zinc-200 dark:border-white/10 transition-colors flex items-center gap-2"
            >
              {copiedChecklist ? (
                <>
                  <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
          <div className="space-y-3 p-5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#070709]">
            {analysis.negotiationChecklist.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 text-primary shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-medium text-sm leading-relaxed text-zinc-900 dark:text-white">{item.replace(/^\d+\.\s*/, '')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Positive Findings (Carries a verdict: colored tint and border) */}
      {analysis.positiveFindings && analysis.positiveFindings.length > 0 && (
        <div className="p-8 rounded-2xl border bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50">
          <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-400 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                const severityTextClass = isCritical || isHigh
                  ? "text-red-700 dark:text-red-400"
                  : isMedium
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-emerald-700 dark:text-emerald-400";
                
                return (
                  <div key={idx} className="p-6 md:p-8 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white text-zinc-900 dark:bg-[#121216] dark:text-white shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                      <div>
                        <span className="inline-block px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 mb-3 border border-zinc-200 dark:border-white/10">
                          {CATEGORY_LABELS[flag.category as RedFlag["category"]] || flag.category}
                        </span>
                        <h4 className="text-xl font-bold text-zinc-900 dark:text-white">{flag.title}</h4>
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                            isCritical || isHigh ? "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-900/50" : isMedium ? "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/50" : "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isCritical ? "bg-red-600 animate-pulse" : isHigh ? "bg-red-500" : isMedium ? "bg-amber-500" : "bg-emerald-500"}`} />
                          {flag.severity} Risk
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400">
                          Confidence: {flag.confidenceScore}%
                        </span>
                        {flag.enforcementLikelihood && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300">
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
                            <span className={`font-bold text-right ${severityTextClass}`}>{flag.deviation}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-zinc-900 dark:text-white mb-6 leading-relaxed text-base font-medium">{flag.plainEnglishExplanation}</p>
                    
                    <div className="border border-zinc-200 dark:border-white/10 p-5 rounded-xl bg-zinc-50 text-zinc-800 dark:bg-[#0b0b0e] dark:text-zinc-200">
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

        {/* Drawer 2: Clause Conflicts & Compound Risk Chains */}
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
              <h4 className="font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 text-sm mb-4">Critical Conflicts</h4>
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
              <h4 className="font-bold uppercase tracking-widest text-zinc-900 dark:text-white text-sm mb-4">Compound Risk Chains</h4>
              {(!analysis.riskChains || analysis.riskChains.length === 0) ? (
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">No risk chains detected.</p>
              ) : (
                <div className="space-y-6">
                  {analysis.riskChains.map((chain, i) => (
                    <div key={i} className="p-5 rounded-xl border bg-white text-zinc-900 border-zinc-200 dark:bg-[#121216] dark:text-white dark:border-white/10">
                      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-4">
                        {chain.clauses.map((clause, j) => (
                          <div key={j} className="flex flex-col md:flex-row items-center gap-3 flex-1">
                            <div className="w-full p-3 bg-zinc-50 dark:bg-[#070709] rounded-lg text-xs font-bold text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 text-center tracking-wider uppercase">
                              {clause}
                            </div>
                            {j < chain.clauses.length - 1 && <div className="text-zinc-600 dark:text-zinc-400 md:rotate-0 rotate-90 my-1 md:my-0">→</div>}
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-zinc-900 dark:text-white leading-relaxed"><span className="font-bold mr-2 text-zinc-900 dark:text-white">Loophole Effect:</span>{chain.effect}</p>
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
                        <span className="inline-block px-3 py-1 rounded-lg text-sm font-bold border border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300">
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

        {/* Drawer 4: Original Contract Clauses */}
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
