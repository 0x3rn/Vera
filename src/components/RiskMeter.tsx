export default function RiskMeter({ score }: { score: number }) {
  const color =
    score <= 30 ? "bg-emerald-500" : score <= 60 ? "bg-amber-500" : "bg-red-500";
  const textColor =
    score <= 30
      ? "text-emerald-400"
      : score <= 60
        ? "text-amber-400"
        : "text-red-400";
  const label =
    score <= 30 ? "Low Risk" : score <= 60 ? "Moderate Risk" : "High Risk";

  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="flex justify-between items-baseline mb-2">
        <span className={`text-sm font-semibold ${textColor}`}>{label}</span>
        <span className="text-4xl font-bold">
          {score}
          <span className="text-lg font-normal text-muted-foreground">/100</span>
        </span>
      </div>
      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
