"use client";

import { useState } from "react";
import Link from "next/link";

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<"onetime" | "subscription">("subscription");

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
        alert(data.error || "Could not start checkout");
      }
    } catch (err: any) {
      alert(err.message || "Checkout failed");
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-full bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              V
            </div>
            <span className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Vera</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-sm font-medium text-zinc-900 dark:text-white">Pricing</Link>
            <Link href="/" className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">Scan a contract</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-4 tracking-tight">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
            Scan as many or as few contracts as you need. No hidden fees, no surprises.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Pay-per-scan */}
          <div
            className={`relative rounded-2xl border-2 p-8 transition-all ${
              selectedPlan === "onetime"
                ? "border-red-600 bg-red-50/30 dark:bg-red-950/10"
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
            onClick={() => setSelectedPlan("onetime")}
          >
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">Per Scan</p>
            <div className="mb-6">
              <span className="text-5xl font-bold text-zinc-900 dark:text-white">$10</span>
              <span className="text-zinc-400 ml-1">/scan</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Full contract analysis
              </li>
              <li className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                PDF or text input
              </li>
              <li className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Plain-English red flag report
              </li>
            </ul>
            <button
              onClick={() => handleCheckout("onetime")}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
                selectedPlan === "onetime"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              }`}
            >
              Pay $10 per scan
            </button>
          </div>

          {/* Subscription */}
          <div
            className={`relative rounded-2xl border-2 p-8 transition-all ${
              selectedPlan === "subscription"
                ? "border-red-600 bg-red-50/30 dark:bg-red-950/10"
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
            onClick={() => setSelectedPlan("subscription")}
          >
            <div className="absolute -top-3 left-6 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
              Best value
            </div>
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">Unlimited</p>
            <div className="mb-6">
              <span className="text-5xl font-bold text-zinc-900 dark:text-white">$20</span>
              <span className="text-zinc-400 ml-1">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Everything in Per Scan
              </li>
              <li className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Unlimited scans
              </li>
              <li className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Priority processing
              </li>
              <li className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Cancel anytime
              </li>
            </ul>
            <button
              onClick={() => handleCheckout("subscription")}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
                selectedPlan === "subscription"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              }`}
            >
              Start $20/month
            </button>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-xs text-zinc-400">
            Secured by Stripe · Cancel anytime · No long-term contracts
          </p>
        </div>
      </main>

      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 py-8">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-xs text-zinc-400">
            Vera · Not legal advice · Built for professionals who sign contracts
          </p>
        </div>
      </footer>
    </div>
  );
}