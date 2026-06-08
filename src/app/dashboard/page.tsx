import { createServerSupabase } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

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

export default async function DashboardOverview() {
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email || "" },
  });

  if (!dbUser) {
    redirect("/login");
  }

  const scans = await prisma.scan.findMany({
    where: { userId: dbUser.id },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      document_name: true,
      risk_score: true,
      payment_status: true,
      created_at: true,
      ai_result: true,
    },
  });

  const isPro = dbUser.subscription_status === "active";
  const freeScansLeft = isPro ? Infinity : Math.max(0, 2 - dbUser.free_scans_used);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Overview</h1>
        <p className="text-zinc-400 text-sm mt-1">
          {isPro ? "Pro Plan" : "Free Trial"} · {session.user.email}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-[#121216] border border-[#22222a] rounded-2xl p-4 sm:p-6">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1 sm:mb-2">Plan</p>
          <p className="text-xl sm:text-2xl font-bold">{isPro ? "Pro" : "Free Trial"}</p>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">
            {isPro ? "Unlimited scans" : `${freeScansLeft} of 2 free remaining`}
          </p>
        </div>
        <div className="bg-[#121216] border border-[#22222a] rounded-2xl p-4 sm:p-6">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1 sm:mb-2">Total Scans</p>
          <p className="text-xl sm:text-2xl font-bold">{scans.length}</p>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">
            {scans.filter((s) => s.payment_status === "paid").length} paid
          </p>
        </div>
      </div>

      {/* Scan history */}
      <div>
        <h2 className="text-lg font-bold mb-4">Recent Scans</h2>
        {scans.length === 0 ? (
          <div className="bg-[#121216] border border-[#22222a] rounded-2xl p-8 sm:p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-zinc-400 mb-4">No scans yet.</p>
            <Link href="/dashboard/scan" className="inline-block px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
              Scan a contract
            </Link>
          </div>
        ) : (
          <div className="bg-[#121216] border border-[#22222a] rounded-2xl overflow-hidden shadow-sm">
            <div className="hidden sm:grid grid-cols-5 gap-4 px-6 py-4 border-b border-[#22222a] text-xs font-semibold uppercase tracking-wider text-zinc-500 bg-[#0a0a0e]">
              <span>Document</span>
              <span>Date</span>
              <span>Risk</span>
              <span>Status</span>
              <span className="text-right">Action</span>
            </div>
            {scans.map((scan) => (
              <div key={scan.id} className="grid grid-cols-1 sm:grid-cols-5 gap-1.5 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-[#22222a] last:border-0 items-start sm:items-center hover:bg-white/[0.02] transition-colors">
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
  );
}