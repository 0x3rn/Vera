"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { auth } from "@/lib/firebase/client";
import { onAuthStateChanged, User } from "firebase/auth";
import type { AnalysisResult } from "@/lib/contract-analyzer";
import RiskMeter from "./RiskMeter";
import TrialBadge from "./TrialBadge";
import AnalysisReport from "./AnalysisReport";

export type AppState =
  | "idle"
  | "uploaded"
  | "scanning"
  | "results"
  | "payment_required"
  | "error";

type InputMode = "pdf" | "text";


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
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state upward when it changes
  useEffect(() => {
    if (onStateChange) onStateChange(appState);
  }, [appState, onStateChange]);

  // Listen for reset events from Sidebar when already on the scan page
  useEffect(() => {
    const handleReset = () => reset();
    window.addEventListener("reset-scanner", handleReset);
    return () => window.removeEventListener("reset-scanner", handleReset);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleCheckout = async (plan: "onetime" | "subscription") => {
    setCheckoutLoading(plan);
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
        setAppState("error");
      }
    } catch (err: any) {
      setError(err.message || "Checkout failed");
      setAppState("error");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const scanWithData = useCallback(async (formData: FormData) => {
    setAppState("scanning");
    setError("");

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.status === 402 && data.requires_payment) {
        setAppState("payment_required");
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
      <div className="w-full text-center py-20 animate-in fade-in zoom-in duration-500 bg-transparent">
        <div className="w-16 h-16 mx-auto mb-8 rounded-full border-4 border-border border-t-primary animate-spin" />
        <h2 className="text-3xl font-bold mb-4">Vera Risk Engine™ is analyzing</h2>
        <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed text-lg">
          Scanning every clause for red flags. This usually takes 10–20 seconds.
        </p>
      </div>
    );
  }

  if (appState === "payment_required") {
    return (
      <div className="w-full text-center py-16 animate-in fade-in zoom-in duration-500 bg-transparent">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
          <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-3">You've used all your free scans</h2>
        <p className="text-muted-foreground max-w-md mx-auto leading-relaxed mb-10">
          Choose an option below to continue scanning your contracts for hidden risks.
        </p>

        <div className="max-w-lg mx-auto grid sm:grid-cols-2 gap-4">
          {/* One-Time Purchase */}
          <div className="bg-card border border-border rounded-2xl p-6 text-left flex flex-col">
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">One-Time</p>
              <p className="text-2xl font-bold mb-1">$5</p>
              <p className="text-sm text-muted-foreground mb-6">Get 5 extra scans added to your balance.</p>
            </div>
            <button
              onClick={() => handleCheckout("onetime")}
              disabled={checkoutLoading !== null}
              className="w-full py-3 rounded-lg border border-border text-foreground font-semibold text-sm hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50"
            >
              {checkoutLoading === "onetime" ? "Redirecting..." : "Pay $5 for 5 extra scans"}
            </button>
          </div>

          {/* Subscription */}
          <div className="bg-card border border-primary/30 rounded-2xl p-6 text-left flex flex-col relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-full border border-primary/20">
                Best Value
              </span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Monthly</p>
              <p className="text-2xl font-bold mb-1">$10<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              <p className="text-sm text-muted-foreground mb-6">Unlimited scans, every month.</p>
            </div>
            <button
              onClick={() => handleCheckout("subscription")}
              disabled={checkoutLoading !== null}
              className="w-full py-3 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-all disabled:opacity-50"
            >
              {checkoutLoading === "subscription" ? "Redirecting..." : "Subscribe for $10/month"}
            </button>
          </div>
        </div>

        <button
          onClick={reset}
          className="mt-8 text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
        >
          Go back
        </button>
      </div>
    );
  }

  if (appState === "results" && analysis) {
    return (
      <div className="w-full space-y-10 animate-in fade-in zoom-in duration-500 bg-transparent">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="mb-4">
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-hover font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                New Scan
              </button>
            </div>
            <span className="inline-block px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-muted/50 text-muted-foreground border border-border mb-3 shadow-sm">
              {analysis.contractType}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold">Analysis Report</h2>
          </div>
          <button onClick={reset} className="text-sm text-primary hover:text-primary-hover font-medium px-4 py-2 bg-primary/10 rounded-lg hover:bg-primary-hover/20 transition-colors duration-500 ease-out self-start border border-primary/20">
            Scan another
          </button>
        </div>

        {remainingScans !== null && remainingScans > 0 && (
          <div className="flex justify-center">
            <TrialBadge remaining={remainingScans} total={maxFreeScans} />
          </div>
        )}

        <AnalysisReport analysis={analysis} />
      </div>
    );
  }

  // Render the input UI (Dropzone or Text Area)
  return (
    <div className="w-full bg-transparent">
      {appState === "error" && (
        <div className="p-5 rounded-xl border border-red-500/30 bg-red-500/5 mb-6">
          <p className="text-sm font-medium text-red-400">{error}</p>
          <button onClick={reset} className="mt-2 text-sm text-primary hover:text-primary-hover underline underline-offset-4">
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
                ? "bg-primary/20 text-primary border border-primary/50"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Upload PDF
          </button>
          <button
            onClick={() => { setInputMode("text"); setFile(null); setError(""); }}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-500 ease-out ${
              inputMode === "text"
                ? "bg-primary/20 text-primary border border-primary/50"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Paste text
          </button>
        </div>
      )}

      {inputMode === "pdf" ? (
        <div
          {...getRootProps()}
          className={`w-full bg-muted border border-dashed rounded-2xl p-10 sm:p-16 text-center animate-in fade-in zoom-in-95 duration-300 cursor-pointer
            ${isDragActive
              ? "border-primary bg-primary/5 -translate-y-1"
              : "border-border hover:border-primary/50 hover:bg-muted hover:-translate-y-1 transition duration-500 ease-out"
            }
          `}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="space-y-3 animate-in fade-in duration-300">
              <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">{file.name}</h3>
              <p className="text-muted-foreground text-sm">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              <button
                onClick={(e) => { e.stopPropagation(); reset(); }}
                className="text-sm text-primary hover:text-primary-hover underline underline-offset-4 mt-2"
              >
                Remove & choose another file
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold">
                {isDragActive ? "Drop your contract here" : "Drop your contract here"}
              </h3>
              <p className="text-muted-foreground">Supports PDF (Max 15MB)</p>
              <label className="inline-block px-6 py-3 rounded-lg border border-border text-sm font-medium cursor-pointer hover:border-primary/50 hover:bg-muted/80 transition-colors duration-300">
                Browse Files
              </label>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full space-y-4 animate-in fade-in zoom-in-95 duration-300">
          <textarea
            ref={textAreaRef}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste the full text of your contract here..."
            rows={12}
            className="w-full p-6 rounded-xl bg-muted border border-border text-foreground placeholder-zinc-500 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors duration-300"
          />
          <button
            onClick={handleTextSubmit}
            disabled={textInput.trim().length < 100}
            className="w-full py-4 rounded-lg bg-primary text-white font-semibold text-base hover:bg-primary-hover hover:-translate-y-0.5 transition duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            Analyze this contract
          </button>
        </div>
      )}

      {!file && inputMode === "pdf" && appState !== "error" && (
        <div className="flex items-center justify-center gap-2 mt-4 text-xs sm:text-sm text-muted-foreground">
          <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Bank-level encryption. We never store your contracts.
        </div>
      )}
    </div>
  );
}
