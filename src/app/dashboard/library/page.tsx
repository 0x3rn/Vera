import { getCurrentUser } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase/admin";
import { redirect } from "next/navigation";
import type { AnalysisResult, RedFlag } from "@/lib/contract-analyzer";
import Link from "next/link";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  payment: "Payment Terms",
  "ip-rights": "IP Rights",
  exclusivity: "Exclusivity",
  termination: "Termination",
  liability: "Liability & Indemnity",
  "non-compete": "Non-Compete",
  "scope-creep": "Scope Creep",
  other: "Other Concern",
};

export default async function RiskLibraryPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { uid, dbUser } = user;

  if (!dbUser) {
    redirect("/login");
  }

  const scansSnapshot = await adminDb
    .collection("users")
    .doc(uid)
    .collection("scans")
    .get();

  const scans = scansSnapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...(doc.data() as any),
  }));

  // Flat-map and aggregate risks
  const riskCategories: Record<string, {
    count: number;
    highRiskCount: number;
    examples: Array<{ title: string; documentName: string; scanId: string }>
  }> = {};

  scans.forEach((scan: any) => {
    if (scan.ai_result) {
      const aiResult = scan.ai_result as unknown as AnalysisResult;
      const flags = aiResult.redFlags || [];
      
      flags.forEach(flag => {
        const cat = flag.category || "other";
        if (!riskCategories[cat]) {
          riskCategories[cat] = { count: 0, highRiskCount: 0, examples: [] };
        }
        
        riskCategories[cat].count++;
        if (flag.severity === "high") {
          riskCategories[cat].highRiskCount++;
        }

        // Store up to 3 examples
        if (riskCategories[cat].examples.length < 3) {
          riskCategories[cat].examples.push({
            title: flag.title,
            documentName: scan.document_name,
            scanId: scan.id,
          });
        }
      });
    }
  });

  const categoriesArray = Object.entries(riskCategories)
    .sort((a, b) => b[1].count - a[1].count);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Risk Library</h1>
        <p className="text-zinc-400 text-sm mt-1">
          A personalized database of every dangerous clause Vera has caught in your contracts.
        </p>
      </div>

      {categoriesArray.length === 0 ? (
        <div className="bg-[#121216] border border-[#22222a] rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <p className="text-zinc-400 mb-4">You have no risks in your library yet. Scan a contract to start building your knowledge base.</p>
          <Link href="/dashboard/scan" className="inline-block px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
            Scan a contract
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {categoriesArray.map(([category, data]) => (
            <div key={category} className="bg-[#121216] border border-white/5 rounded-2xl p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold">{CATEGORY_LABELS[category] || category}</h2>
                  <p className="text-sm text-zinc-400 mt-1">Appeared in {data.count} clauses</p>
                </div>
                {data.highRiskCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/30 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {data.highRiskCount} High Risk
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Examples found in your contracts</p>
                {data.examples.map((example, idx) => (
                  <Link key={idx} href={`/dashboard/results/${example.scanId}`} className="block group">
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:border-indigo-500/30 transition-colors">
                      <p className="text-sm font-medium text-zinc-200 group-hover:text-indigo-400 transition-colors mb-2 leading-relaxed">
                        "{example.title}"
                      </p>
                      <p className="text-xs text-zinc-500">— {example.documentName}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
