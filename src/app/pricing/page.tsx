"use client";

import { useState } from "react";
import Link from "next/link";

export default function PricingPage() {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

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
    <div className="flex flex-col min-h-full">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#070709]/80 backdrop-blur-xl border-b border-[#22222a]">
        <div className="max-w-6xl mx-auto px-8 h-[70px] flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Vera<span className="text-indigo-500">.</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/#how-it-works" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              How it Works
            </Link>
            <Link href="/#features" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Red Flags
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-white transition-colors">
              Pricing
            </Link>
          </div>
          <div>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-0.5 transition-all"
            >
              Scan a Contract
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-[180px] pb-[100px] text-center relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            Simple,{" "}
            <span className="text-indigo-400">
              transparent pricing.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Pay a fraction of a lawyer's hourly rate. No hidden fees, no surprises.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="pb-[100px]">
        <div className="max-w-[900px] mx-auto px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Pay As You Go */}
            <div
              className={`relative bg-[#121216] border rounded-2xl p-12 transition-all duration-300 ${
                hoveredPlan === "onetime"
                  ? "border-zinc-600 -translate-y-1 shadow-2xl shadow-black/50"
                  : "border-[#22222a]"
              }`}
              onMouseEnter={() => setHoveredPlan("onetime")}
              onMouseLeave={() => setHoveredPlan(null)}
            >
              <h3 className="text-xl text-zinc-400 font-medium mb-2">Pay As You Go</h3>
              <div className="text-6xl font-bold mb-8">
                $5
                <span className="text-lg font-normal text-zinc-600 ml-1">/ document</span>
              </div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3 text-zinc-300">
                  <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  1 Full PDF Scan (up to 30 pages)
                </li>
                <li className="flex items-center gap-3 text-zinc-300">
                  <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}> <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /> </svg>
                  1-Page Plain English Summary
                </li>
                <li className="flex items-center gap-3 text-zinc-300">
                  <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}> <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /> </svg>
                  Highlights Red Flags & Toxic Clauses
                </li>
                <li className="flex items-center gap-3 text-zinc-300">
                  <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}> <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /> </svg>
                  Secure Stripe Checkout
                </li>
              </ul>
              <button
                onClick={() => handleCheckout("onetime")}
                className="w-full py-4 rounded-lg border text-sm font-semibold transition-all hover:-translate-y-0.5 border-zinc-700 hover:border-zinc-500 hover:bg-white/5"
              >
                Scan a Document
              </button>
            </div>

            {/* Pro */}
            <div
              className={`relative bg-[#121216] border rounded-2xl p-12 transition-all duration-300 ${
                hoveredPlan === "subscription"
                  ? "border-indigo-500 -translate-y-1 shadow-2xl shadow-indigo-500/10"
                  : "border-indigo-500/50"
              }`}
              onMouseEnter={() => setHoveredPlan("subscription")}
              onMouseLeave={() => setHoveredPlan(null)}
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 px-5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Most Popular
              </div>
              <h3 className="text-xl text-zinc-400 font-medium mb-2">Pro</h3>
              <div className="text-6xl font-bold mb-8">
                $10
                <span className="text-lg font-normal text-zinc-600 ml-1">/ month</span>
              </div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3 text-zinc-300">
                  <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}> <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /> </svg>
                  Unlimited Document Scans
                </li>
                <li className="flex items-center gap-3 text-zinc-300">
                  <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}> <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /> </svg>
                  Export Summaries to PDF
                </li>
                <li className="flex items-center gap-3 text-zinc-300">
                  <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}> <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /> </svg>
                  Upload Multi-Document Portfolios
                </li>
                <li className="flex items-center gap-3 text-zinc-300">
                  <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}> <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /> </svg>
                  Priority Email Support
                </li>
              </ul>
              <button
                onClick={() => handleCheckout("subscription")}
                className="w-full py-4 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-0.5 transition-all"
              >
                Subscribe Now
              </button>
            </div>
          </div>
        </div>
      </section>

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