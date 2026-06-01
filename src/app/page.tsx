"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import type { AnalysisResult, RedFlag } from "@/lib/contract-analyzer";

type AppState =
  | "idle"
  | "uploaded"
  | "requires-payment"
  | "scanning"
  | "results"
  | "error";

type InputMode = "pdf" | "text";

const SEVERITY_COLORS: Record<RedFlag["severity"], string> = {
  high: "border-red-500 bg-red-50 dark:bg-red-950/30",
  medium: "border-amber-500 bg-amber-50 dark:bg-amber-950/30",
  low: "border-blue-500 bg-blue-50 dark:bg-blue-950/30",
};

const SEVERITY_BADGE: Record<RedFlag["severity"], string> = {
  high: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800",
  medium:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800",
  low: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800",
};

const SEVERITY_LABELS: Record<RedFlag["severity"], string> = {
  high: "High Risk",
  medium: "Medium Risk",
  low: "Low Risk",
};

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
  const color = score <= 30 ? "bg-emerald-500" : score <= 60 ? "bg-amber-500" : "bg-red-500";
  const textColor =
    score <= 30
      ? "text-emerald-600 dark:text-emerald-400"
      : score <= 60
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";
  const label = score <= 30 ? "Low Risk" : score <= 60 ? "Moderate Risk" : "High Risk";

  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="flex justify-between items-baseline mb-2">
        <span className={`text-sm font-semibold ${textColor}`}>{label}</span>
        <span className="text-4xl font-bold text-zinc-900 dark:text-white">
          {score}
          <span className="text-lg font-normal text-zinc-300 dark:text-zinc-600">/100</span>
        </span>
      </div>
      <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("pdf");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<"onetime" | "subscription">("onetime");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paid = params.get("paid");
    const sessionId = params.get("session_id");

    if (paid === "true" && sessionId) {
      document.cookie = `vera_paid_session=${sessionId}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
      setIsLoggedIn(true);
      window.history.replaceState({}, "", "/");
    }

    const hasCookie = document.cookie.includes("vera_paid_session");
    if (hasCookie) setIsLoggedIn(true);
  }, []);

  const triggerScan = useCallback(
    (payload: FormData) => {
      if (!isLoggedIn && !document.cookie.includes("vera_paid_session")) {
        setAppState("requires-payment");
        return;
      }
      scanWithData(payload);
    },
    [isLoggedIn]
  );

  const scanWithData = useCallback(async (formData: FormData) => {
    setAppState("scanning");
    setError("");
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });
      if (res.status === 402) {
        setAppState("requires-payment");
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Scan failed");
      }
      const data: AnalysisResult = await res.json();
      setAnalysis(data);
      setAppState("results");
      sessionStorage.removeItem("vera_pending_file_name");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setAppState("error");
    }
  }, []);

  const handleTextSubmit = useCallback(() => {
    const trimmed = textInput.trim();
    if (trimmed.length < 100) {
      setError("Please paste at least 100 characters of contract text.");
      setAppState("error");
      return;
    }
    const formData = new FormData();
    formData.append("text", trimmed);
    triggerScan(formData);
  }, [textInput, triggerScan]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const f = acceptedFiles[0];
      setFile(f);
      setError("");
      setAnalysis(null);
      sessionStorage.setItem("vera_pending_file_name", f.name);

      const formData = new FormData();
      formData.append("file", f);
      triggerScan(formData);
    },
    [triggerScan]
  );

  const handleCheckout = async (plan: "onetime" | "subscription") => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Could not start checkout");
      }
    } catch (err: any) {
      setError(err.message || "Checkout failed");
    }
  };

  const reset = () => {
    setFile(null);
    setTextInput("");
    setAnalysis(null);
    setError("");
    setAppState("idle");
    sessionStorage.removeItem("vera_pending_file_name");
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 15 * 1024 * 1024,
    disabled: appState === "scanning",
  });

  const showInput = appState === "idle" || appState === "uploaded" || appState === "requires-payment" || appState === "error";

  return (
    <div className="flex flex-col flex-1 min-h-full bg-white dark:bg-zinc-950 font-sans">
      {/* Header */}
      <header className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">V</div>
            <div>
              <span className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Vera</span>
              <span className="hidden sm:inline text-xs text-zinc-400 ml-2">Contract Analyzer</span>
            </div>
          </Link>
          <div className="flex items-center gap-6">
            {isLoggedIn && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Pro
              </span>
            )}
            <Link href="/pricing" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
              Pricing
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-12 sm:py-16">
        {/* Hero */}
        {appState === "idle" && !file && !textInput && (
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-white mb-4 tracking-tight leading-tight">
              Read contracts{" "}
              <span className="text-red-600">before</span>
              <br />
              they cost you
            </h1>
            <p className="text-base sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              Upload a PDF or paste the text of any contract. Vera flags dangerous clauses and explains what they actually mean.
            </p>
          </div>
        )}

        {/* Input area */}
        {showInput && (
          <div className="space-y-6">
            {/* Mode toggle */}
            {!file && (
              <div className="flex justify-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-fit mx-auto">
                <button
                  onClick={() => { setInputMode("pdf"); setTextInput(""); }}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    inputMode === "pdf"
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                >
                  Upload PDF
                </button>
                <button
                  onClick={() => { setInputMode("text"); setFile(null); }}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    inputMode === "text"
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                >
                  Paste text
                </button>
              </div>
            )}

            {/* PDF upload */}
            {inputMode === "pdf" && (
              <div
                {...getRootProps()}
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
                  ${isDragActive && !isDragReject
                    ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                    : isDragReject
                      ? "border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-red-300 hover:bg-red-50/30 dark:hover:bg-red-950/10"
                  }
                `}
              >
                <input {...getInputProps()} />
                {file ? (
                  <div className="space-y-3">
                    <div className="w-14 h-14 mx-auto bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center justify-center">
                      <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-zinc-900 dark:text-white">{file.name}</p>
                    <p className="text-sm text-zinc-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                    <button onClick={(e) => { e.stopPropagation(); reset(); }} className="text-sm text-red-600 hover:text-red-700 underline underline-offset-4">
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                      <svg className="w-7 h-7 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      {isDragActive ? "Drop your PDF here" : "Drag & drop a PDF, or click to browse"}
                    </p>
                    <p className="text-xs text-zinc-400">PDF only · Max 15MB</p>
                  </div>
                )}
              </div>
            )}

            {/* Text input */}
            {inputMode === "text" && (
              <div className="space-y-4">
                <textarea
                  ref={textAreaRef}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste the full text of your contract here..."
                  rows={14}
                  className="w-full p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
                />
                <button
                  onClick={handleTextSubmit}
                  disabled={textInput.trim().length < 100}
                  className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Analyze this contract
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {appState === "error" && (
          <div className="mt-6 p-5 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
            <button onClick={reset} className="mt-2 text-sm text-red-600 hover:text-red-700 underline underline-offset-4">
              Try again
            </button>
          </div>
        )}

        {/* Payment wall */}
        {appState === "requires-payment" && (file || textInput) && (
          <div className="mt-10">
            <div className="p-8 sm:p-10 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Unlock your results</h2>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                  Vera found potential issues. Pay once to reveal the full analysis and negotiation guidance.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setSelectedPlan("onetime")}
                  className={`relative p-5 rounded-xl border-2 text-left transition-all ${
                    selectedPlan === "onetime"
                      ? "border-red-600 bg-red-50/30 dark:bg-red-950/10"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                  }`}
                >
                  {selectedPlan === "onetime" && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className="text-3xl font-bold text-zinc-900 dark:text-white">$10</div>
                  <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mt-1">One scan</div>
                  <div className="text-xs text-zinc-400 mt-1">Single contract</div>
                </button>

                <button
                  onClick={() => setSelectedPlan("subscription")}
                  className={`relative p-5 rounded-xl border-2 text-left transition-all ${
                    selectedPlan === "subscription"
                      ? "border-red-600 bg-red-50/30 dark:bg-red-950/10"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                  }`}
                >
                  {selectedPlan === "subscription" && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className="text-3xl font-bold text-zinc-900 dark:text-white">$20<span className="text-base font-medium text-zinc-400">/mo</span></div>
                  <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mt-1">Unlimited</div>
                  <div className="text-xs text-zinc-400 mt-1">Every contract</div>
                </button>
              </div>

              <button
                onClick={() => handleCheckout(selectedPlan)}
                className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-sm transition-colors"
              >
                Pay ${selectedPlan === "onetime" ? "10" : "20"}{selectedPlan === "subscription" ? "/month" : ""} with Stripe
              </button>
              <p className="text-xs text-zinc-400 text-center mt-3">
                Secure checkout · Instant access
              </p>
            </div>
          </div>
        )}

        {/* Scanning */}
        {appState === "scanning" && (
          <div className="mt-20 text-center">
            <div className="w-14 h-14 mx-auto mb-6 rounded-full border-4 border-zinc-100 dark:border-zinc-800 border-t-red-600 animate-spin" />
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Analyzing your contract</h2>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto text-sm leading-relaxed">
              Scanning every clause for red flags. This usually takes 10–20 seconds.
            </p>
          </div>
        )}

        {/* Results */}
        {appState === "results" && analysis && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 mb-2">
                  {analysis.contractType}
                </span>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Analysis Report</h2>
              </div>
              <button onClick={reset} className="text-sm font-medium text-red-600 hover:text-red-700 underline underline-offset-4 self-start">
                Scan another
              </button>
            </div>

            {/* Risk meter */}
            <div className="flex justify-center py-6">
              <RiskMeter score={analysis.overallRiskScore} />
            </div>

            {/* Summary */}
            <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Summary</h3>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{analysis.summary}</p>
            </div>

            {/* Key dates */}
            {analysis.keyDates && analysis.keyDates.length > 0 && (
              <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Key Dates & Deadlines</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {analysis.keyDates.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-sm text-zinc-700 dark:text-zinc-300">
                      <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {d}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Red flags */}
            <div>
              <div className="flex items-baseline gap-3 mb-5">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Red Flags</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm font-bold border border-red-200 dark:border-red-800/50">
                  {analysis.redFlags.length}
                </span>
              </div>

              {analysis.redFlags.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/20">
                  <p className="font-bold text-emerald-700 dark:text-emerald-400">No red flags found</p>
                  <p className="text-emerald-600 dark:text-emerald-500 text-sm mt-1">This contract appears clean.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analysis.redFlags.map((flag) => (
                    <div
                      key={flag.id}
                      className={`p-5 rounded-xl border border-l-4 border-zinc-200 dark:border-zinc-800 ${SEVERITY_COLORS[flag.severity]}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 mb-2">
                            {CATEGORY_LABELS[flag.category]}
                          </span>
                          <h4 className="font-bold text-zinc-900 dark:text-white">{flag.title}</h4>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border self-start ${SEVERITY_BADGE[flag.severity]}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${flag.severity === "high" ? "bg-red-500" : flag.severity === "medium" ? "bg-amber-500" : "bg-blue-500"}`} />
                          {SEVERITY_LABELS[flag.severity]}
                        </span>
                      </div>

                      {flag.clauseExcerpt && (
                        <div className="mb-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Original Language</p>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">&ldquo;{flag.clauseExcerpt}&rdquo;</p>
                        </div>
                      )}

                      <div className="mb-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">What This Means</p>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{flag.plainEnglishExplanation}</p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">How to Fix It</p>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/50 leading-relaxed">
                          {flag.suggestedFix}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700">
              <p className="text-xs text-zinc-400 leading-relaxed">
                <strong className="text-zinc-500 dark:text-zinc-300">Disclaimer:</strong> Vera is an AI analysis tool, not legal counsel. This report does not constitute legal advice. Consult a qualified attorney before signing any legally binding documents.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-red-600 rounded flex items-center justify-center text-white font-bold text-[10px]">V</div>
            <span className="text-xs text-zinc-400">Vera</span>
          </div>
          <p className="text-xs text-zinc-400">
            Not legal advice · Built for professionals who sign contracts · Powered by DeepSeek
          </p>
        </div>
      </footer>
    </div>
  );
}