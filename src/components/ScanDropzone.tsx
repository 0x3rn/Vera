"use client";

import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";

export default function ScanDropzone({ isPro, freeScansLeft }: { isPro: boolean; freeScansLeft: number }) {
  const router = useRouter();
  
  // Scan state
  const [appState, setAppState] = useState<"idle" | "scanning" | "error">("idle");
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState("");
  const [inputMode, setInputMode] = useState<"pdf" | "text">("pdf");
  const [scanError, setScanError] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

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

      if (res.status === 402 && data.requires_payment && data.checkout_url) {
        window.location.href = data.checkout_url;
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
    <div className="max-w-3xl animate-in fade-in duration-500">
      {appState === "error" && (
        <div className="mb-6 p-5 rounded-xl border border-red-500/30 bg-red-500/5">
          <p className="text-sm font-medium text-red-400">{scanError}</p>
          <button onClick={resetScan} className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 underline underline-offset-4">
            Try again
          </button>
        </div>
      )}

      {appState === "scanning" ? (
        <div className="py-16 text-center bg-[#121216] border border-[#22222a] rounded-2xl">
          <div className="w-12 h-12 mx-auto mb-6 rounded-full border-4 border-zinc-800 border-t-indigo-500 animate-spin" />
          <h3 className="text-xl font-bold mb-2">Analyzing your contract</h3>
          <p className="text-zinc-400 text-sm max-w-sm mx-auto">
            Scanning every clause for red flags. This usually takes 10–20 seconds.
          </p>
        </div>
      ) : (
        <>
          {/* Free scans badge */}
          {!isPro && (
            <div className="mb-6 p-4 rounded-xl bg-[#121216] border border-[#22222a] flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${freeScansLeft > 0 ? "bg-emerald-500" : "bg-red-500"}`} />
              <p className="text-sm text-zinc-400">
                {freeScansLeft > 0
                  ? `${freeScansLeft} of 1 free scan remaining`
                  : "Free scans used. Next scan requires payment."}
              </p>
            </div>
          )}

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setInputMode("pdf"); setTextInput(""); setScanError(""); setAppState("idle"); }}
              className={`px-4 sm:px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                inputMode === "pdf"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/50"
                  : "bg-[#121216] border border-[#22222a] text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Upload PDF
            </button>
            <button
              onClick={() => { setInputMode("text"); setFile(null); setScanError(""); setAppState("idle"); }}
              className={`px-4 sm:px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                inputMode === "text"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/50"
                  : "bg-[#121216] border border-[#22222a] text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Paste text
            </button>
          </div>

          {inputMode === "pdf" ? (
            <div
              {...getRootProps()}
              className={`bg-[#121216] border border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer
                ${isDragActive
                  ? "border-indigo-500 bg-indigo-500/5 shadow-2xl shadow-indigo-500/10 -translate-y-1"
                  : "border-[#33333d] hover:border-violet-500 hover:bg-[#16161c] hover:-translate-y-1"
                }
              `}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="space-y-3">
                  <div className="w-12 h-12 mx-auto mb-4 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">{file.name}</h3>
                  <p className="text-zinc-500 text-sm">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); resetScan(); }}
                    className="text-sm text-indigo-400 hover:text-indigo-300 underline underline-offset-4 mt-2"
                  >
                    Remove &amp; choose another file
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-14 h-14 mx-auto mb-4 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold">
                    {isDragActive ? "Drop your contract here" : "Drop your contract here"}
                  </h3>
                  <p className="text-zinc-500 text-sm">Supports PDF (Max 15MB)</p>
                  <label className="inline-block px-5 py-2.5 rounded-lg border border-[#33333d] text-sm font-medium cursor-pointer hover:border-zinc-500 hover:bg-white/5 transition-all mt-2">
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
                className="w-full p-4 sm:p-5 rounded-xl bg-[#121216] border border-[#22222a] text-white placeholder-zinc-500 text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />
              <button
                onClick={handleTextSubmit}
                disabled={textInput.trim().length < 100}
                className="w-full py-3.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
