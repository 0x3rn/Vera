import { getRiskBand, getRiskLabel } from "@/lib/risk";

export default function RiskMeter({ score }: { score: number }) {
  const band = getRiskBand(score);
  const color = band === "acceptable" ? "bg-emerald-500" : band === "moderate" ? "bg-amber-500" : band === "high" ? "bg-orange-500" : "bg-red-600";
  const textColor = band === "acceptable" ? "text-emerald-800 dark:text-emerald-400" : band === "moderate" ? "text-amber-800 dark:text-amber-400" : "text-red-700 dark:text-red-400";

  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="flex justify-between items-baseline mb-2">
        <span className={`text-sm font-semibold ${textColor}`}>{getRiskLabel(score)}</span>
        <span className="text-4xl font-bold text-zinc-900 dark:text-white">
          {score}
          <span className="text-lg font-normal text-zinc-600 dark:text-zinc-400">/100</span>
        </span>
      </div>
      <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
