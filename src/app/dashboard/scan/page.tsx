"use client";

import { useState } from "react";
import ScannerInput, { AppState } from "@/components/ScannerInput";

export default function NewScanPage() {
  const [scannerState, setScannerState] = useState<AppState>("idle");

  const isInput = scannerState === "idle" || scannerState === "uploaded" || scannerState === "error";

  return (
    <div className="animate-in fade-in duration-500">
      {isInput && (
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">New Scan</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Upload a document or paste text to detect legal risks.
          </p>
        </div>
      )}

      <div className={isInput ? "grid lg:grid-cols-[1.5fr_1fr] gap-8 items-start" : "block"}>
        {/* Left Side: Scanner Component */}
        <div className="w-full relative">
          <ScannerInput onStateChange={setScannerState} />
        </div>

        {/* Right Side: Reassurance Checklist - only visible when uploading */}
        {isInput && (
          <div className="bg-card border border-border rounded-2xl p-6 lg:p-8">
            <h2 className="text-lg font-bold mb-6">What We'll Check</h2>
            <div className="space-y-4">
              {[
                { title: "Hidden Fees", desc: "Unexpected charges or transaction fees." },
                { title: "Landlord Advantages", desc: "Unfair eviction or entry terms." },
                { title: "Exclusivity & Non-Competes", desc: "Broad restrictions on your future." },
                { title: "Termination Risks", desc: "Unfair cancellation policies." },
                { title: "Uncapped Liability", desc: "Dangerous indemnification terms." },
                { title: "Payment Terms", desc: "Hidden Net-60 or Net-90 delays." },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
