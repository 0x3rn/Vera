export default function TrialBadge({ remaining, total }: { remaining: number; total: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-card border border-border px-3 py-1.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      {remaining} of {total} free scans remaining
    </span>
  );
}
