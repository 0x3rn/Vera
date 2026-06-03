"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
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

type Tab = "scan" | "overview" | "subscription" | "settings";

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
      const data = await res.json();
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

  // Subscription state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMsg, setCancelMsg] = useState("");
  const [upgrading, setUpgrading] = useState(false);
  
  // Sign out state
  const [signingOut, setSigningOut] = useState(false);
  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/");
  };

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
            <button 
              type="button" 
              onClick={handleSignOut} 
              disabled={signingOut}
              className="text-sm text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
            >
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
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
          <div className="flex gap-2 p-1.5 bg-[#121216] border border-[#22222a] rounded-xl w-full sm:w-fit mb-8 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {(["scan", "overview", "subscription", "settings"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 capitalize whitespace-nowrap group ${
                  activeTab === tab
                    ? "text-white shadow-md"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {activeTab === tab && (
                  <span className="absolute inset-0 bg-indigo-600 rounded-lg shadow-sm" />
                )}
                <span className="relative z-10">
                  {tab === "overview" ? "History" : tab === "scan" ? "New Scan" : tab}
                </span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "scan" && (
            <div className="space-y-6">
              <div className="max-w-3xl">
                <h2 className="text-2xl font-bold mb-6">Scan a Contract</h2>
                
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
                    <div className="flex gap-2 mb-6">
                      <button
                        onClick={() => { setInputMode("pdf"); setTextInput(""); setScanError(""); }}
                        className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          inputMode === "pdf"
                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/50"
                            : "bg-[#121216] border border-[#22222a] text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Upload PDF
                      </button>
                      <button
                        onClick={() => { setInputMode("text"); setFile(null); setScanError(""); }}
                        className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
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
                        className={`bg-[#121216] border border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer
                          ${isDragActive
                            ? "border-indigo-500 bg-indigo-500/5 shadow-2xl shadow-indigo-500/10 -translate-y-1"
                            : "border-[#22222a] hover:border-violet-500 hover:bg-[#16161c] hover:-translate-y-1"
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
                              Remove & choose another file
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="w-14 h-14 mx-auto mb-4 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                              <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <h3 className="text-xl font-semibold">
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
                          rows={12}
                          className="w-full p-5 rounded-xl bg-[#121216] border border-[#22222a] text-white placeholder-zinc-500 text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
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
            </div>
          )}

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
                    <button onClick={() => setActiveTab("scan")} className="inline-block px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
                      Scan a contract
                    </button>
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