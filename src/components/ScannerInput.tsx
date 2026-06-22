"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { auth } from "@/lib/firebase/client";
import { onAuthStateChanged, User } from "firebase/auth";
import type { AnalysisResult, RedFlag } from "@/lib/contract-analyzer";
import RiskMeter from "./RiskMeter";
import TrialBadge from "./TrialBadge";

export type AppState =
  | "idle"
  | "uploaded"
  | "scanning"
  | "results"
  | "error";

type InputMode = "pdf" | "text";

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

interface ScannerInputProps {
  onStateChange?: (state: AppState) => void;
}

export default function ScannerInput({ onStateChange }: ScannerInputProps) {
  const [appState, setAppState] = useState<AppState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("pdf");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const [remainingScans, setRemainingScans] = useState<number | null>(null);
  const [maxFreeScans, setMaxFreeScans] = useState(2);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state upward when it changes
  useEffect(() => {
    if (onStateChange) onStateChange(appState);
  }, [appState, onStateChange]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const scanWithData = useCallback(async (formData: FormData) => {
    setAppState("scanning");
    setError("");

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.status === 402 && data.requires_payment && data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Scan failed");
      }

      const { scan_id, free_scans_remaining, max_free_scans, ...result } = data;
      setAnalysis(result);
      setScanId(scan_id);
      setRemainingScans(free_scans_remaining ?? null);
      setMaxFreeScans(max_free_scans ?? 2);
      setAppState("results");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setAppState("error");
    }
  }, []);

  const triggerScan = useCallback(
    (payload: FormData) => {
      if (!user) {
        window.location.href = "/register";
        return;
      }
      scanWithData(payload);
    },
    [user, scanWithData]
  );

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
      const formData = new FormData();
      formData.append("file", f);
      triggerScan(formData);
    },
    [triggerScan]
  );

  const reset = () => {
    setFile(null);
    setTextInput("");
    setAnalysis(null);
    setScanId(null);
    setError("");
    setAppState("idle");
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 15 * 1024 * 1024,
    disabled: appState === "scanning",
  });

  if (appState === "scanning") {
    return (
      <div className="w-full text-center py-20 animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 mx-auto mb-8 rounded-full border-4 border-[#22222a] border-t-indigo-500 animate-spin" />
        <h2 className="text-3xl font-bold mb-4">Analyzing your contract</h2>
        <p className="text-zinc-400 max-w-sm mx-auto leading-relaxed text-lg">
          Scanning every clause for red flags. This usually takes 10–20 seconds.
        </p>
      </div>
    );
  }

  if (appState === "results" && analysis) {
    return (
      <div className="w-full space-y-10 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="inline-block px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-white/5 text-zinc-300 border border-white/10 mb-3 shadow-sm">
              {analysis.contractType}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold">Analysis Report</h2>
          </div>
          <button onClick={reset} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium px-4 py-2 bg-indigo-500/10 rounded-lg hover:bg-indigo-500/20 transition-colors duration-500 ease-out self-start border border-indigo-500/20">
            Scan another
          </button>
        </div>

        {remainingScans !== null && remainingScans > 0 && (
          <div className="flex justify-center">
            <TrialBadge remaining={remainingScans} total={maxFreeScans} />
          </div>
        )}

        <div className="flex justify-center py-6">
          <RiskMeter score={analysis.overallRiskScore} />
        </div>

        <div className="p-8 rounded-2xl bg-[#121216] border border-white/5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Summary</h3>
          <p className="text-zinc-300 leading-relaxed text-lg">{analysis.summary}</p>
        </div>

        {analysis.keyDates && analysis.keyDates.length > 0 && (
          <div className="p-8 rounded-2xl bg-[#121216] border border-white/5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6">Key Dates & Deadlines</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {analysis.keyDates.map((d: string, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 text-sm text-zinc-300">
                  <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {d}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Issues Found ({analysis.redFlags.length})
          </h3>
          <div className="space-y-4">
            {analysis.redFlags.length === 0 ? (
              <div className="p-10 text-center rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
                <svg className="w-12 h-12 mx-auto text-emerald-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg font-semibold text-emerald-400 mb-2">Looks clean!</p>
                <p className="text-zinc-400">We didn't find any major red flags in this contract.</p>
              </div>
            ) : (
              analysis.redFlags.map((flag: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-8 rounded-2xl border bg-[#121216] ${
                    flag.severity === "high"
                      ? "border-red-500/30"
                      : flag.severity === "medium"
                        ? "border-amber-500/30"
                        : "border-blue-500/30"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                    <div>
                      <span className="inline-block px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest bg-white/5 text-zinc-400 mb-3 border border-white/10">
                        {CATEGORY_LABELS[flag.category as RedFlag["category"]] || flag.category}
                      </span>
                      <h4 className="text-xl font-bold text-white">{flag.title}</h4>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 border ${
                        flag.severity === "high"
                          ? "bg-red-500/10 text-red-400 border-red-500/30"
                          : flag.severity === "medium"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          flag.severity === "high" ? "bg-red-500" : flag.severity === "medium" ? "bg-amber-500" : "bg-blue-500"
                        }`}
                      />
                      {flag.severity} Risk
                    </span>
                  </div>
                  <div className="bg-[#0a0a0e] p-5 rounded-xl border border-white/5 mb-6">
                    <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest mb-2">Original Text</p>
                    <p className="text-zinc-300 italic">"{flag.clauseExcerpt}"</p>
                  </div>
                  <p className="text-zinc-400 mb-6 leading-relaxed">{flag.plainEnglishExplanation}</p>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-xl">
                    <p className="text-sm text-emerald-300">
                      <span className="font-bold text-emerald-400">Recommendation:</span> {flag.suggestedFix}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render the input UI (Dropzone or Text Area)
  return (
    <div className="w-full">
      {appState === "error" && (
        <div className="p-5 rounded-xl border border-red-500/30 bg-red-500/5 mb-6">
          <p className="text-sm font-medium text-red-400">{error}</p>
          <button onClick={reset} className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 underline underline-offset-4">
            Try again
          </button>
        </div>
      )}

      {!file && appState !== "error" && (
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => { setInputMode("pdf"); setTextInput(""); setError(""); }}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-500 ease-out ${
              inputMode === "pdf"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/50"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Upload PDF
          </button>
          <button
            onClick={() => { setInputMode("text"); setFile(null); setError(""); }}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-500 ease-out ${
              inputMode === "text"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/50"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Paste text
          </button>
        </div>
      )}

      {inputMode === "pdf" ? (
        <div
          {...getRootProps()}
          className={`w-full bg-white/5 backdrop-blur-sm border border-dashed rounded-2xl p-10 sm:p-16 text-center transition-all duration-500 ease-out cursor-pointer
            ${isDragActive
              ? "border-indigo-500 bg-indigo-500/5 -translate-y-1"
              : "border-white/10 hover:border-indigo-500/50 hover:bg-white/10 hover:-translate-y-1"
            }
          `}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="space-y-3">
              <div className="w-14 h-14 mx-auto mb-4 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">{file.name}</h3>
              <p className="text-zinc-500 text-sm">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              <button
                onClick={(e) => { e.stopPropagation(); reset(); }}
                className="text-sm text-indigo-400 hover:text-indigo-300 underline underline-offset-4 mt-2"
              >
                Remove & choose another file
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold">
                {isDragActive ? "Drop your contract here" : "Drop your contract here"}
              </h3>
              <p className="text-zinc-500">Supports PDF (Max 15MB)</p>
              <label className="inline-block px-6 py-3 rounded-lg border border-white/10 text-sm font-medium cursor-pointer hover:border-white/20 hover:bg-white/5 transition-all duration-500 ease-out">
                Browse Files
              </label>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full space-y-4">
          <textarea
            ref={textAreaRef}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste the full text of your contract here..."
            rows={12}
            className="w-full p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-white placeholder-zinc-500 text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-500 ease-out"
          />
          <button
            onClick={handleTextSubmit}
            disabled={textInput.trim().length < 100}
            className="w-full py-4 rounded-lg bg-indigo-600 text-white font-semibold text-base hover:bg-indigo-700 hover:-translate-y-0.5 transition-all duration-500 ease-out disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            Analyze this contract
          </button>
        </div>
      )}

      {!file && inputMode === "pdf" && appState !== "error" && (
        <div className="flex items-center justify-center gap-2 mt-4 text-xs sm:text-sm text-zinc-600">
          <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Bank-level encryption. We never store your contracts.
        </div>
      )}
    </div>
  );
}
