"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase/client";
import { sendEmailVerification } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    
    setLoading(true);
    setError("");

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No user found. Please try logging in again.");
      }

      await sendEmailVerification(user, {
        url: window.location.origin + "/dashboard",
        handleCodeInApp: true,
      });
      setCooldown(60);
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          // Re-auth the session so the server gets the updated claims
          const idToken = await user.getIdToken(true);
          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken })
          });
          window.location.href = "/dashboard";
          return;
        }
      }
      setError("Email not verified yet. Please check your inbox and click the link.");
    } catch (err: any) {
      setError("Failed to check verification status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full animate-in fade-in duration-500">
      <nav className="fixed top-0 w-full z-50 bg-[#070709]/80 backdrop-blur-xl border-b border-[#22222a]">
        <div className="max-w-6xl mx-auto px-8 h-[70px] flex items-center">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Vera<span className="text-indigo-500">.</span>
          </Link>
        </div>
      </nav>
      <main className="flex-1 pt-44 pb-24 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Check your inbox</h1>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            We've sent a verification link to your email address. Please click the link to verify your account and access the dashboard.
          </p>

          {error && (
            <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/5 mb-6 text-left">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleCheckVerification}
              disabled={loading}
              className="w-full py-3 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {loading ? "Checking..." : "I've verified my email"}
            </button>
            
            <button
              onClick={handleResend}
              disabled={cooldown > 0 || loading}
              className="w-full py-3 rounded-lg border border-zinc-700 text-white font-medium text-sm hover:border-zinc-500 hover:bg-white/5 transition-all disabled:opacity-50"
            >
              {cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend Verification Link"}
            </button>
          </div>

          <p className="mt-8 text-sm text-zinc-500">
            Can't find the email? Check your spam folder, or contact{" "}
            <a href="mailto:support@verahq.xyz" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4">
              support@verahq.xyz
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
