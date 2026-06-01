"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import type { User } from "@supabase/supabase-js";
import type { AnalysisResult, RedFlag } from "@/lib/contract-analyzer";

type AppState =
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
          <span className="text-lg font-normal text-zinc-600">/100</span>
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

function TrialBadge({ remaining, total }: { remaining: number; total: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 bg-[#121216] border border-[#22222a] px-3 py-1.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      {remaining} of {total} free scans remaining
    </span>
  );
}

export default function Home() {
  const supabase = createClient();
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRemainingScans(null);
    setAnalysis(null);
    setScanId(null);
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

      // If free scans exhausted, redirect to Stripe
      if (res.status === 402 && data.requires_payment && data.stripe_url) {
        window.location.href = data.stripe_url;
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
        signInWithGoogle();
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

  const showLanding = appState === "idle" && !file && !textInput;
  const showInput =
    appState === "idle" || appState === "uploaded" || appState === "error";

  return (
    <div className="flex flex-col min-h-full">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#070709]/80 backdrop-blur-xl border-b border-[#22222a]">
        <div className="max-w-6xl mx-auto px-8 h-[70px] flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Vera<span className="text-indigo-500">.</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              How it Works
            </a>
            <a href="#features" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Red Flags
            </a>
            <a href="/pricing" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-4">
            {user && remainingScans !== null && remainingScans > 0 && (
              <TrialBadge remaining={remainingScans} total={maxFreeScans} />
            )}
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-400 hidden sm:inline">
                  {user.email}
                </span>
                <button
                  onClick={signOut}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:bg-white/5 transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      {showLanding && (
        <>
          <section className="pt-[180px] pb-[100px] text-center relative" id="hero">
            <div className="max-w-6xl mx-auto px-4 sm:px-8">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight mx-auto mb-6">
                Don't Sign Away Your Rights.{" "}
                <br />
                <span className="text-indigo-400">
                  Let AI Read the Fine Print.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-zinc-400 max-w-xl mx-auto mb-12 leading-relaxed">
                Lawyers cost $400/hr. Vera scans contracts in seconds, outputting a plain-English summary of hidden traps, bad payment terms, and toxic clauses.
              </p>
              <p className="text-sm text-zinc-600">2 free scans. Sign in with Google to get started.</p>
            </div>
          </section>

          <section id="features" className="py-[100px]">
            <div className="max-w-6xl mx-auto px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Professionals lose thousands to bad contracts.
                </h2>
                <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                  Vera's AI engine is strictly trained on legal contracts to catch what you missed.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-[#121216] border border-[#22222a] p-10 rounded-2xl hover:border-[#33333d] hover:-translate-y-1 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-4">Payment Timelines</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Stop agreeing to{" "}
                    <span className="text-red-500 font-medium">Net-90 payment terms</span>{" "}
                    blindly. Vera highlights delayed payment clauses so you know exactly when you're getting paid.
                  </p>
                </div>
                <div className="bg-[#121216] border border-[#22222a] p-10 rounded-2xl hover:border-[#33333d] hover:-translate-y-1 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-4">Perpetual IP Rights</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Are they claiming your work forever? We catch clauses that force you to give away your intellectual property rights without proper compensation.
                  </p>
                </div>
                <div className="bg-[#121216] border border-[#22222a] p-10 rounded-2xl hover:border-[#33333d] hover:-translate-y-1 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-4">Kill Fees & Exclusivity</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Avoid{" "}
                    <span className="text-red-500 font-medium">exclusivity traps</span>{" "}
                    that prevent you from working with other clients, and ensure your contract has a clear cancellation (kill) fee.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing — integrated on landing page */}
          <section id="pricing" className="py-[80px]">
            <div className="max-w-4xl mx-auto px-4 sm:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-3">Simple pricing</h2>
                <p className="text-zinc-400">2 free scans. Then pick a plan.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-[#121216] border border-[#22222a] rounded-2xl p-8 text-center hover:border-zinc-600 transition-all">
                  <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">Per Scan</p>
                  <div className="text-5xl font-bold mb-4">$5</div>
                  <p className="text-zinc-400 text-sm mb-6">One contract, one fee</p>
                  <ul className="text-left space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-sm text-zinc-400">
                      <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      Full contract analysis
                    </li>
                    <li className="flex items-center gap-2 text-sm text-zinc-400">
                      <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      PDF or text input
                    </li>
                  </ul>
                  <Link href="/pricing" className="inline-block w-full py-3 rounded-lg border border-zinc-700 text-sm font-medium hover:border-zinc-500 hover:bg-white/5 transition-all">
                    Get started
                  </Link>
                </div>
                <div className="bg-gradient-to-b from-[#141419] to-[#0c0c0f] border border-indigo-500/50 rounded-2xl p-8 text-center hover:border-indigo-500 transition-all relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    Best Value
                  </div>
                  <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3 mt-1">Pro</p>
                  <div className="text-5xl font-bold mb-1">$10<span className="text-lg font-normal text-zinc-600">/mo</span></div>
                  <p className="text-zinc-400 text-sm mb-6">Unlimited scans</p>
                  <ul className="text-left space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-sm text-zinc-400">
                      <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      Everything in Per Scan
                    </li>
                    <li className="flex items-center gap-2 text-sm text-zinc-400">
                      <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      Unlimited scans
                    </li>
                    <li className="flex items-center gap-2 text-sm text-zinc-400">
                      <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      Cancel anytime
                    </li>
                  </ul>
                  <Link href="/pricing" className="inline-block w-full py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold hover:-translate-y-0.5 transition-all">
                    Subscribe
                  </Link>
                </div>
              </div>
              <p className="text-xs text-zinc-600 text-center mt-6">
                <Link href="/pricing" className="underline underline-offset-4 hover:text-zinc-400 transition-colors">View full pricing</Link>
              </p>
            </div>
          </section>
        </>
      )}

      {/* Input zone */}
      {showInput && (
        <section className={`${showLanding ? "pb-[100px]" : "pt-[120px] pb-[60px]"}`} id="how-it-works">
          <div className="max-w-6xl mx-auto px-8">
            {!file && appState !== "error" && (
              <div className="flex justify-center gap-2 mb-8">
                <button
                  onClick={() => { setInputMode("pdf"); setTextInput(""); setError(""); }}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    inputMode === "pdf"
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/50"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Upload PDF
                </button>
                <button
                  onClick={() => { setInputMode("text"); setFile(null); setError(""); }}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
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
                className={`max-w-[700px] mx-auto bg-[#121216] border border-dashed rounded-2xl p-16 text-center transition-all cursor-pointer
                  ${isDragActive
                    ? "border-indigo-500 bg-indigo-500/5 shadow-2xl shadow-indigo-500/10 -translate-y-1"
                    : "border-indigo-500/50 hover:border-violet-500 hover:bg-[#16161c] hover:-translate-y-1 shadow-xl shadow-black/50"
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
                    <div className="w-16 h-16 mx-auto mb-4 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-semibold">
                      {isDragActive ? "Drop your contract here" : "Drop your contract here"}
                    </h3>
                    <p className="text-zinc-500">Supports PDF (Max 15MB)</p>
                    <label className="inline-block px-6 py-3 rounded-lg border border-zinc-700 text-sm font-medium cursor-pointer hover:border-zinc-500 hover:bg-white/5 transition-all">
                      Browse Files
                    </label>
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-[700px] mx-auto space-y-4">
                <textarea
                  ref={textAreaRef}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste the full text of your contract here..."
                  rows={14}
                  className="w-full p-6 rounded-xl bg-[#121216] border border-[#22222a] text-white placeholder-zinc-500 text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                />
                <button
                  onClick={handleTextSubmit}
                  disabled={textInput.trim().length < 100}
                  className="w-full py-4 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-base hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  Analyze this contract
                </button>
              </div>
            )}

            {!file && inputMode === "pdf" && appState !== "error" && (
              <div className="flex items-center justify-center gap-2 mt-6 text-sm text-zinc-600">
                <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Bank-level encryption. We never store your contracts.
              </div>
            )}
          </div>
        </section>
      )}

      {/* Error */}
      {appState === "error" && (
        <div className="max-w-[700px] mx-auto px-8 mt-6">
          <div className="p-5 rounded-xl border border-red-500/30 bg-red-500/5">
            <p className="text-sm font-medium text-red-400">{error}</p>
            <button onClick={reset} className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 underline underline-offset-4">
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Scanning */}
      {appState === "scanning" && (
        <section className="pt-[140px] pb-[80px] text-center">
          <div className="max-w-6xl mx-auto px-8">
            <div className="w-16 h-16 mx-auto mb-8 rounded-full border-4 border-zinc-800 border-t-indigo-500 animate-spin" />
            <h2 className="text-2xl font-bold mb-3">Analyzing your contract</h2>
            <p className="text-zinc-400 max-w-sm mx-auto leading-relaxed">
              Scanning every clause for red flags. This usually takes 10–20 seconds.
            </p>
          </div>
        </section>
      )}

      {/* Results */}
      {appState === "results" && analysis && (
        <section className="pt-[120px] pb-[80px]">
          <div className="max-w-3xl mx-auto px-8 space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <span className="inline-block px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-[#121216] text-zinc-400 border border-[#22222a] mb-2">
                  {analysis.contractType}
                </span>
                <h2 className="text-3xl font-bold">Analysis Report</h2>
              </div>
              <button onClick={reset} className="text-sm text-indigo-400 hover:text-indigo-300 underline underline-offset-4 self-start">
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

            <div className="p-6 rounded-xl bg-[#121216] border border-[#22222a]">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Summary</h3>
              <p className="text-zinc-300 leading-relaxed text-lg">{analysis.summary}</p>
            </div>

            {analysis.keyDates && analysis.keyDates.length > 0 && (
              <div className="p-6 rounded-xl bg-[#121216] border border-[#22222a]">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Key Dates & Deadlines</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {analysis.keyDates.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0e] border border-[#22222a] text-sm text-zinc-300">
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
                  {analysis.redFlags.map((flag) => (
                    <div
                      key={flag.id}
                      className={`p-6 rounded-xl border bg-[#121216] ${
                        flag.severity === "high"
                          ? "border-red-500/50 bg-red-500/5"
                          : flag.severity === "medium"
                            ? "border-amber-500/50 bg-amber-500/5"
                            : "border-blue-500/50 bg-blue-500/5"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
                        <div>
                          <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-[#0a0a0e] text-zinc-400 border border-[#22222a] mb-2">
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
                        <div className="mb-4 p-4 rounded-lg bg-[#0a0a0e] border border-[#22222a]">
                          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Original Language</p>
                          <p className="text-sm text-zinc-400 italic">&ldquo;{flag.clauseExcerpt}&rdquo;</p>
                        </div>
                      )}

                      <div className="mb-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">What This Means</p>
                        <p className="text-sm text-zinc-300 leading-relaxed">{flag.plainEnglishExplanation}</p>
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

            <div className="p-4 rounded-lg bg-[#121216] border border-[#22222a]">
              <p className="text-xs text-zinc-500 leading-relaxed">
                <strong className="text-zinc-400">Disclaimer:</strong> Vera is an AI analysis tool, not legal counsel. This report does not constitute legal advice. Consult a qualified attorney before signing any legally binding documents.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-[#22222a] py-12 mt-auto">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <p className="text-sm text-zinc-600">
            &copy; {new Date().getFullYear()} Vera AI Contract Scanner. Not legal advice. Built for professionals who sign contracts.
          </p>
        </div>
      </footer>
    </div>
  );
}