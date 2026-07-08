import { getCurrentUser } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase/admin";
import { redirect } from "next/navigation";
import BillingPlan from "@/components/BillingPlan";
import type { AnalysisResult } from "@/lib/contract-analyzer";
import { checkIsPro } from "@/lib/subscription";

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

  const isPro = checkIsPro(dbUser);
  const bonusScans = dbUser.bonus_scans || 0;
  const hasPurchased = bonusScans > 0;
  const packSize = hasPurchased ? 5 : 1;
  const scansAllowed = 1 + bonusScans;
  const freeScansLeft = Math.max(0, scansAllowed - (dbUser.free_scans_used || 0));

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
        <p className="text-muted-foreground text-sm mt-1">
          Manage your subscription and view your usage.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-8 items-start">
        {/* Current Plan & Billing Details (Left side or Top-Left) */}
        <div className="w-full">
          <BillingPlan 
            isPro={isPro} 
            freeScansLeft={freeScansLeft} 
            totalAllowed={packSize} 
            subscriptionStatus={dbUser.subscription_status}
            subscriptionRenewsAt={dbUser.subscription_renews_at}
            subscriptionEndsAt={dbUser.subscription_ends_at}
          />
        </div>

        {/* Upgrade Benefits Section - Hidden if already Pro, so Lifetime Usage slides up if Pro */}
        {!isPro && (
          <div className="bg-card border border-primary/30 rounded-2xl p-6 sm:p-8 w-full max-w-lg">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
              Pro Plan Benefits
            </div>
            <h2 className="text-2xl font-bold mb-6">Why upgrade to Pro?</h2>
            <ul className="space-y-4">
              {[
                "Unlimited contract scans",
                "Upload multi-document portfolios",
                "Priority email support",
              ].map((benefit, idx) => (
                <li key={idx} className="flex gap-3 text-muted-foreground">
                  <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Usage This Month (Right side if Pro, Bottom-Left if Free) */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 w-full max-w-lg">
          <h2 className="text-xl font-bold mb-6">Lifetime Usage</h2>
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Contracts Scanned</p>
              <p className="text-2xl font-bold text-foreground">{totalScans}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">High Risk Clauses Caught</p>
              <p className="text-2xl font-bold text-red-400">{highRiskClauses}</p>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-sm font-medium text-muted-foreground mb-1">Estimated Legal Review Time Saved</p>
              <p className="text-2xl font-bold text-emerald-400">{estimatedTimeSaved} hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
