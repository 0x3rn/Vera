"use client";

import { useState, useEffect, useCallback } from "react";
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

type Tab = "overview" | "subscription" | "settings";

function riskBadge(score: number) {
  if (score >= 7) return "bg-red-500/10 text-red-400 border-red-500/30";
  if (score >= 4) return "bg-amber-500/10 text-amber-400 border-amber-500/30";
  return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
}

function riskLabel(score: number) {
  if (score >= 7) return "High";
  if (score >= 4) return "Medium";
  return "Low";
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
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Subscription state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMsg, setCancelMsg] = useState("");
  const [upgrading, setUpgrading] = useState(false);

  // Account settings state
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [accountMsg, setAccountMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/login");
        return;
      }
      setUser(session.user);

      try {
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

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "subscription" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Could not start checkout");
      }
    } catch (err: any) {
      alert(err.message || "Checkout failed");
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    setCancelMsg("");
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cancellation failed");

      setCancelMsg("Subscription cancelled. A confirmation email has been sent.");
      // Refresh dbUser
      const refresh = await fetch("/api/dashboard");
      const refreshData = await refresh.json();
      setDbUser(refreshData.user);
    } catch (err: any) {
      setCancelMsg(err.message);
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountMsg(null);
    if (newPassword.length < 8) {
      setAccountMsg({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    setSavingAccount(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setAccountMsg({ type: "error", text: error.message });
    } else {
      setAccountMsg({ type: "success", text: "Password updated successfully." });
      setNewPassword("");
    }
    setSavingAccount(false);
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountMsg(null);
    if (!newEmail.includes("@")) {
      setAccountMsg({ type: "error", text: "Please enter a valid email address." });
      return;
    }
    setSavingAccount(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      setAccountMsg({ type: "error", text: error.message });
    } else {
      setAccountMsg({
        type: "success",
        text: "Check your new email for a confirmation link.",
      });
      setNewEmail("");
    }
    setSavingAccount(false);
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

  const isPro = dbUser?.subscription_status === "active";

  return (
    <div className="flex flex-col min-h-full">
      <nav className="fixed top-0 w-full z-50 bg-[#070709]/80 backdrop-blur-xl border-b border-[#22222a]">
        <div className="max-w-6xl mx-auto px-8 h-[70px] flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Vera<span className="text-indigo-500">.</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">Scanner</Link>
            <span className="text-xs text-zinc-600 hidden sm:inline">{user?.email}</span>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-32 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-zinc-400 text-sm mt-1">
                {isPro ? "Pro Plan" : "Free Trial"} · {user?.email}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-[#121216] border border-[#22222a] rounded-lg w-fit mb-8">
            {(["overview", "subscription", "settings"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {tab === "overview" ? "Scans" : tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Summary cards */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-[#121216] border border-[#22222a] rounded-2xl p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Plan</p>
                  <p className="text-2xl font-bold">{isPro ? "Pro" : "Free Trial"}</p>
                  <p className="text-zinc-400 text-sm mt-1">
                    {isPro ? "Unlimited scans" : `${freeScansLeft} of 2 free scans remaining`}
                  </p>
                </div>
                <div className="bg-[#121216] border border-[#22222a] rounded-2xl p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Total Scans</p>
                  <p className="text-2xl font-bold">{scans.length}</p>
                  <p className="text-zinc-400 text-sm mt-1">
                    {scans.filter((s) => s.payment_status === "paid").length} paid
                  </p>
                </div>
              </div>

              {/* Scan history */}
              <div>
                <h2 className="text-lg font-bold mb-4">Scan History</h2>
                {scans.length === 0 ? (
                  <div className="bg-[#121216] border border-[#22222a] rounded-2xl p-12 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-zinc-400 mb-4">No scans yet.</p>
                    <Link href="/" className="inline-block px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
                      Scan a contract
                    </Link>
                  </div>
                ) : (
                  <div className="bg-[#121216] border border-[#22222a] rounded-2xl overflow-hidden">
                    <div className="hidden sm:grid grid-cols-5 gap-4 px-6 py-4 border-b border-[#22222a] text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      <span>Document</span>
                      <span>Date</span>
                      <span>Risk</span>
                      <span>Status</span>
                      <span className="text-right">Action</span>
                    </div>
                    {scans.map((scan) => (
                      <div key={scan.id} className="grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-4 px-6 py-4 border-b border-[#22222a] last:border-0 items-center hover:bg-white/[0.02] transition-colors">
                        <span className="text-sm font-medium truncate">{scan.document_name}</span>
                        <span className="text-xs text-zinc-500">
                          {new Date(scan.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase px-2.5 py-1 rounded-full border w-fit ${riskBadge(scan.risk_score)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${scan.risk_score >= 7 ? "bg-red-500" : scan.risk_score >= 4 ? "bg-amber-500" : "bg-emerald-500"}`} />
                          {riskLabel(scan.risk_score)} ({scan.risk_score}/10)
                        </span>
                        <span className="text-xs text-zinc-500 capitalize">{scan.payment_status}</span>
                        <div className="sm:text-right">
                          {scan.ai_result ? (
                            <Link href={`/results/${scan.id}`} className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-4">View report</Link>
                          ) : scan.payment_status === "unpaid" ? (
                            <span className="text-xs text-zinc-600">Pending</span>
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
          )}

          {activeTab === "subscription" && (
            <div className="max-w-lg space-y-6">
              <div className="bg-[#121216] border border-[#22222a] rounded-2xl p-8">
                <h2 className="text-xl font-bold mb-1">
                  {isPro ? "Pro Plan" : "Free Trial"}
                </h2>
                <p className="text-zinc-400 text-sm mb-6">
                  {isPro
                    ? "$10/month — Unlimited scans, export summaries, priority support."
                    : "2 free scans. Upgrade for unlimited access."}
                </p>

                {isPro ? (
                  <>
                    {cancelMsg && (
                      <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 mb-6">
                        <p className="text-sm text-emerald-400">{cancelMsg}</p>
                      </div>
                    )}
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="px-6 py-3 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/5 transition-colors"
                    >
                      Cancel Subscription
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleUpgrade}
                    disabled={upgrading}
                    className="w-full py-3 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {upgrading ? "Redirecting..." : "Upgrade to Pro — $10/month"}
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="max-w-lg space-y-8">
              {/* Change Password */}
              <div className="bg-[#121216] border border-[#22222a] rounded-2xl p-6 sm:p-8">
                <h2 className="text-lg font-bold mb-4">Change Password</h2>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min. 8 characters)"
                    className="w-full px-4 py-3 rounded-lg bg-[#0a0a0e] border border-[#22222a] text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={savingAccount}
                    className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {savingAccount ? "Saving..." : "Update password"}
                  </button>
                </form>
              </div>

              {/* Change Email */}
              <div className="bg-[#121216] border border-[#22222a] rounded-2xl p-6 sm:p-8">
                <h2 className="text-lg font-bold mb-4">Change Email</h2>
                <form onSubmit={handleChangeEmail} className="space-y-4">
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="New email address"
                    className="w-full px-4 py-3 rounded-lg bg-[#0a0a0e] border border-[#22222a] text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                  />
                  <p className="text-xs text-zinc-500">
                    You will receive a confirmation link at your new email to approve this change.
                  </p>
                  <button
                    type="submit"
                    disabled={savingAccount}
                    className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {savingAccount ? "Saving..." : "Update email"}
                  </button>
                </form>
              </div>

              {/* Account messages */}
              {accountMsg && (
                <div className={`p-4 rounded-lg border ${
                  accountMsg.type === "success"
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-red-500/30 bg-red-500/5"
                }`}>
                  <p className={`text-sm ${accountMsg.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
                    {accountMsg.text}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Cancel confirmation modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#121216] border border-[#22222a] rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Cancel Subscription?</h3>
            <p className="text-zinc-400 text-sm mb-6">
              You will lose access at the end of your billing cycle.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-sm font-medium hover:bg-white/5 transition-colors"
              >
                Keep plan
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Confirm cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-[#22222a] py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-600">&copy; {new Date().getFullYear()} Vera</p>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-zinc-600">
            <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-zinc-400 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}