"use client";

import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";

export default function ScanDropzone({ isPro, freeScansLeft }: { isPro: boolean; freeScansLeft: number }) {
  const router = useRouter();
  
  // Scan state
  const [appState, setAppState] = useState<"idle" | "scanning" | "payment_required" | "error">("idle");
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState("");
  const [inputMode, setInputMode] = useState<"pdf" | "text">("pdf");
  const [scanError, setScanError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

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
        setScanError(data.error || "Could not start checkout");
        setAppState("error");
      }
    } catch (err: any) {
      setScanError(err.message || "Checkout failed");
      setAppState("error");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const scanWithData = useCallback(async (formData: FormData) => {
    setAppState("scanning");
    setScanError("");
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server returned an invalid response. Please try again.`);
      }

      if (res.status === 402 && data.requires_payment) {
        setAppState("payment_required");
        return;
      }
      if (!res.ok) throw new Error(data.error || "Scan failed");
      router.push(`/results/${data.scan_id}`);
    } catch (err: any) {
      setScanError(err.message || "An unexpected error occurred");
      setAppState("error");
    }
  }, [router]);

  const triggerScan = useCallback((payload: FormData) => {
    scanWithData(payload);
  }, [scanWithData]);

  const handleTextSubmit = useCallback(() => {
    const trimmed = textInput.trim();
    if (trimmed.length < 100) {
      setScanError("Please paste at least 100 characters of contract text.");
      setAppState("error");
      return;
    }
    const formData = new FormData();
    formData.append("text", trimmed);
    triggerScan(formData);
  }, [textInput, triggerScan]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];
    setFile(f);
    setScanError("");
    const formData = new FormData();
    formData.append("file", f);
    triggerScan(formData);
  }, [triggerScan]);

  const resetScan = () => {
    setFile(null);
    setTextInput("");
    setScanError("");
    setAppState("idle");
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 15 * 1024 * 1024,
    disabled: appState === "scanning",
  });

  return (
    <div className="max-w-3xl md:animate-in md:fade-in md:duration-500">
      {appState === "error" && (
        <div className="mb-6 p-5 rounded-xl border border-red-500/30 bg-red-500/5">
          <p className="text-sm font-medium text-red-400">{scanError}</p>
          <button onClick={resetScan} className="mt-2 text-sm text-primary hover:text-primary-hover underline underline-offset-4">
            Try again
          </button>
        </div>
      )}

      {appState === "scanning" ? (
        <div className="py-16 text-center bg-card border border-border rounded-2xl">
          <div className="w-12 h-12 mx-auto mb-6 rounded-full border-4 border-zinc-800 border-t-primary animate-spin" />
          <h3 className="text-xl font-bold mb-2">Analyzing your contract</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Scanning every clause for red flags. This usually takes 10–20 seconds.
          </p>
        </div>
      ) : appState === "payment_required" ? (
        <div className="py-12 text-center bg-card border border-border rounded-2xl px-6">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">You've used all your free scans</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-8">
            Choose an option to continue scanning contracts.
          </p>

          <div className="max-w-md mx-auto grid sm:grid-cols-2 gap-4 text-left">
            {/* One-Time Purchase */}
            <div className="border border-border rounded-xl p-5 flex flex-col">
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">One-Time</p>
                <p className="text-xl font-bold mb-1">$5</p>
                <p className="text-xs text-muted-foreground mb-4">5 extra scans</p>
              </div>
              <button
                onClick={() => handleCheckout("onetime")}
                disabled={checkoutLoading !== null}
                className="w-full py-2.5 rounded-lg border border-border text-foreground font-semibold text-sm hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50"
              >
                {checkoutLoading === "onetime" ? "Redirecting..." : "Pay $5 for 5 scans"}
              </button>
            </div>

            {/* Subscription */}
            <div className="border border-primary/30 rounded-xl p-5 flex flex-col relative">
              <div className="absolute top-2.5 right-2.5">
                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-full border border-primary/20">
                  Best Value
                </span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Monthly</p>
                <p className="text-xl font-bold mb-1">$10<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                <p className="text-xs text-muted-foreground mb-4">Unlimited scans</p>
              </div>
              <button
                onClick={() => handleCheckout("subscription")}
                disabled={checkoutLoading !== null}
                className="w-full py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-all disabled:opacity-50"
              >
                {checkoutLoading === "subscription" ? "Redirecting..." : "Subscribe $10/mo"}
              </button>
            </div>
          </div>

          <button
            onClick={resetScan}
            className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
          >
            Go back
          </button>
        </div>
      ) : (
        <>
          {/* Free scans badge */}
          {!isPro && (
            <div className="mb-6 p-4 rounded-xl bg-card border border-border flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${freeScansLeft > 0 ? "bg-emerald-500" : "bg-red-500"}`} />
              <p className="text-sm text-muted-foreground">
                {freeScansLeft > 0
                  ? `${freeScansLeft} free scan${freeScansLeft !== 1 ? "s" : ""} remaining`
                  : "Free scans used. Next scan requires payment."}
              </p>
            </div>
          )}

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setInputMode("pdf"); setTextInput(""); setScanError(""); setAppState("idle"); }}
              className={`px-4 sm:px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                inputMode === "pdf"
                  ? "bg-primary/20 text-primary border border-primary/50"
                  : "bg-card border border-border text-muted-foreground hover:text-muted-foreground"
              }`}
            >
              Upload PDF
            </button>
            <button
              onClick={() => { setInputMode("text"); setFile(null); setScanError(""); setAppState("idle"); }}
              className={`px-4 sm:px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                inputMode === "text"
                  ? "bg-primary/20 text-primary border border-primary/50"
                  : "bg-card border border-border text-muted-foreground hover:text-muted-foreground"
              }`}
            >
              Paste text
            </button>
          </div>

          {inputMode === "pdf" ? (
            <div
              {...getRootProps()}
              className={`bg-card border border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer
                ${isDragActive
                  ? "border-primary bg-primary/5 shadow-2xl shadow-indigo-500/10 -translate-y-1"
                  : "border-[#33333d] hover:border-violet-500 hover:bg-[#16161c] hover:-translate-y-1"
                }
              `}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="space-y-3">
                  <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">{file.name}</h3>
                  <p className="text-muted-foreground text-sm">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); resetScan(); }}
                    className="text-sm text-primary hover:text-primary-hover underline underline-offset-4 mt-2"
                  >
                    Remove &amp; choose another file
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold">
                    {isDragActive ? "Drop your contract here" : "Drop your contract here"}
                  </h3>
                  <p className="text-muted-foreground text-sm">Supports PDF (Max 15MB)</p>
                  <label className="inline-block px-5 py-2.5 rounded-lg border border-[#33333d] text-sm font-medium cursor-pointer hover:border-border hover:bg-muted/50 transition-all mt-2">
                    Browse Files
                  </label>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <textarea
                ref={textAreaRef}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste the full text of your contract here..."
                rows={10}
                className="w-full p-4 sm:p-5 rounded-xl bg-card border border-border text-foreground placeholder-zinc-500 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              <button
                onClick={handleTextSubmit}
                disabled={textInput.trim().length < 100}
                className="w-full py-3.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Analyze this contract
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
