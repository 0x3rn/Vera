"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import type { User } from "@supabase/supabase-js";

interface ScanRecord {
  id: string;
  document_name: string;
  risk_score: number;
  payment_status: string;
  created_at: string;
  ai_result: any;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [dbUser, setDbUser] = useState<any>(null);
  const [freeScansLeft, setFreeScansLeft] = useState(2);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/login");
        return;
      }
      setUser(session.user);

      try {
        // Fetch user profile + scans
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to load dashboard");
        const data = await res.json();
        setDbUser(data.user);
        setScans(data.scans);
        if (data.user?.subscription_status === "active") {
          setFreeScansLeft(Infinity);
        } else {
          setFreeScansLeft(Math.max(0, 2 - (data.user?.free_scans_used || 0)));
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleManageSubscription = () => {
    // Lemon Squeezy customer portal URL pattern
    const storeSlug = process.env.NEXT_PUBLIC_LEMONSQUEEZY_STORE_SLUG || "";
    if (dbUser?.subscription_id && storeSlug) {
      window.open(
        `https://${storeSlug}.lemonsqueezy.com/billing`,
        "_blank"
      );
    } else {
      router.push("/pricing");
    }
  };

  const riskBadge = (score: number) => {
    if (score >= 7) return "bg-red-500/10 text-red-400 border-red-500/30";
    if (score >= 4) return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  };

  const riskLabel = (score: number) => {
    if (score >= 7) return "High";
    if (score >= 4) return "Medium";
    return "Low";
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <nav className="fixed top-0 w-full z-50 bg-[#070709]/80 backdrop-blur-xl border-b border-[#22222a]">
          <div className="max-w-6xl mx-auto px-8 h-[70px] flex items-center">
            <Link href="/" className="text-2xl font-bold tracking-tight">
              Vera<span className="text-indigo-500">.</span>
            </Link>
          </div>
        </nav>
        <section className="pt-44 pb-24 text-center">
          <div className="w-14 h-14 mx-auto mb-6 rounded-full border-4 border-zinc-800 border-t-indigo-500 animate-spin" />
          <p className="text-zinc-400">Loading dashboard...</p>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <nav className="fixed top-0 w-full z-50 bg-[#070709]/80 backdrop-blur-xl border-b border-[#22222a]">
        <div className="max-w-6xl mx-auto px-8 h-[70px] flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Vera<span className="text-indigo-500">.</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">Scanner</Link>
            <Link href="/pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">Pricing</Link>
            <span className="text-xs text-zinc-600">{user?.email}</span>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-32 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 space-y-10">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-zinc-400 text-sm mt-1">Manage your account and view scan history.</p>
          </div>

          {error && (
            <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/5">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Overview cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-[#121216] border border-[#22222a] rounded-2xl p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Subscription</p>
              <p className="text-2xl font-bold">
                {dbUser?.subscription_status === "active" ? "Pro" : "Free Trial"}
              </p>
              <p className="text-zinc-400 text-sm mt-1">
                {dbUser?.subscription_status === "active"
                  ? "Unlimited scans — $10/month"
                  : `${freeScansLeft} of 2 free scans remaining`}
              </p>
            </div>
            <div className="bg-[#121216] border border-[#22222a] rounded-2xl p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Billing</p>
              <p className="text-2xl font-bold">
                {scans.filter((s) => s.payment_status === "paid").length} Paid Scans
              </p>
              <button
                onClick={handleManageSubscription}
                className="mt-3 text-sm text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
              >
                Manage Subscription →
              </button>
            </div>
          </div>

          {/* Scan history */}
          <div>
            <h2 className="text-xl font-bold mb-4">Scan History</h2>
            {scans.length === 0 ? (
              <div className="bg-[#121216] border border-[#22222a] rounded-2xl p-12 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-zinc-400 mb-4">No scans yet. Start by uploading a contract.</p>
                <Link
                  href="/"
                  className="inline-block px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Scan a contract
                </Link>
              </div>
            ) : (
              <div className="bg-[#121216] border border-[#22222a] rounded-2xl overflow-hidden">
                {/* Table header */}
                <div className="hidden sm:grid grid-cols-5 gap-4 px-6 py-4 border-b border-[#22222a] text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <span>Document</span>
                  <span>Date</span>
                  <span>Risk</span>
                  <span>Status</span>
                  <span className="text-right">Action</span>
                </div>
                {/* Table rows */}
                {scans.map((scan) => (
                  <div
                    key={scan.id}
                    className="grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-4 px-6 py-4 border-b border-[#22222a] last:border-0 items-center hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="text-sm font-medium truncate">{scan.document_name}</span>
                    <span className="text-xs text-zinc-500">
                      {new Date(scan.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase px-2.5 py-1 rounded-full border w-fit ${riskBadge(scan.risk_score)}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        scan.risk_score >= 7 ? "bg-red-500" : scan.risk_score >= 4 ? "bg-amber-500" : "bg-emerald-500"
                      }`} />
                      {riskLabel(scan.risk_score)} ({scan.risk_score}/10)
                    </span>
                    <span className="text-xs text-zinc-500 capitalize">{scan.payment_status}</span>
                    <div className="sm:text-right">
                      {scan.ai_result ? (
                        <Link
                          href={`/results/${scan.id}`}
                          className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
                        >
                          View report
                        </Link>
                      ) : scan.payment_status === "unpaid" ? (
                        <span className="text-xs text-zinc-600">Pending payment</span>
                      ) : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-[#22222a] py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-600">
            &copy; {new Date().getFullYear()} Vera AI Contract Scanner
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-zinc-600">
            <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-zinc-400 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}