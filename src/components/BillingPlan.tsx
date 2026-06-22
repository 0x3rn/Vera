"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BillingPlan({ isPro }: { isPro: boolean }) {
  const router = useRouter();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMsg, setCancelMsg] = useState("");
  const [upgrading, setUpgrading] = useState(false);

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
      router.refresh();
    } catch (err: any) {
      setCancelMsg(err.message);
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
    }
  };

  return (
    <>
      <div className="max-w-lg space-y-6 animate-in fade-in duration-500">
        <div className="bg-[#121216] border border-[#22222a] rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-1">
            {isPro ? "Pro Plan" : "Free Trial"}
          </h2>
          <p className="text-zinc-400 text-sm mb-6">
            {isPro
              ? "$10/month — Unlimited scans, export summaries, priority support."
              : "1 free scan. Upgrade for unlimited access."}
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

      {/* Cancel confirmation modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-[#121216] border border-[#22222a] rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl">
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
    </>
  );
}
