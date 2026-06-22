import { getCurrentUser } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase/admin";
import { redirect } from "next/navigation";
import BillingPlan from "@/components/BillingPlan";
import type { AnalysisResult } from "@/lib/contract-analyzer";

export const metadata = {
  title: "Billing | Vera",
};

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { uid, dbUser } = user;

  if (!dbUser) {
    redirect("/login");
  }

  const isPro = dbUser.subscription_status === "active";

  const scansSnapshot = await adminDb
    .collection("users")
    .doc(uid)
    .collection("scans")
    .get();

  const scans = scansSnapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...(doc.data() as any),
  }));
  const totalScans = scans.length;
  let highRiskClauses = 0;

  scans.forEach((scan: any) => {
    if (scan.ai_result) {
      const aiResult = scan.ai_result as unknown as AnalysisResult;
      highRiskClauses += (aiResult.redFlags || []).filter((f) => f.severity === "high").length;
    }
  });

  const estimatedTimeSaved = (totalScans * 1.5).toFixed(1);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Billing &amp; Plan</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Manage your subscription and view your usage.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-8 items-start">
        <div className="space-y-8">
          {/* Current Plan & Billing Details */}
          <BillingPlan isPro={isPro} />

          {/* Usage This Month */}
          <div className="bg-[#121216] border border-[#22222a] rounded-2xl p-6 sm:p-8 max-w-lg">
            <h2 className="text-xl font-bold mb-6">Lifetime Usage</h2>
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-zinc-400 mb-1">Contracts Scanned</p>
                <p className="text-2xl font-bold text-white">{totalScans}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-400 mb-1">High Risk Clauses Caught</p>
                <p className="text-2xl font-bold text-red-400">{highRiskClauses}</p>
              </div>
              <div className="pt-4 border-t border-[#22222a]">
                <p className="text-sm font-medium text-zinc-400 mb-1">Estimated Legal Review Time Saved</p>
                <p className="text-2xl font-bold text-emerald-400">{estimatedTimeSaved} hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Benefits Section */}
        <div className="bg-[#121216] border border-indigo-500/30 rounded-2xl p-6 sm:p-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-6">
            Pro Plan Benefits
          </div>
          <h2 className="text-2xl font-bold mb-6">Why upgrade to Pro?</h2>
          <ul className="space-y-4">
            {[
              "Unlimited contract scans",
              "Export risk summaries to PDF",
              "Upload multi-document portfolios",
              "Priority email support",
              "Faster AI processing times",
            ].map((benefit, idx) => (
              <li key={idx} className="flex gap-3 text-zinc-300">
                <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
