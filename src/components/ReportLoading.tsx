export default function ReportLoading() {
  return (
    <div className="animate-in fade-in duration-500 text-center py-20" role="status" aria-live="polite">
      <div className="w-16 h-16 mx-auto mb-8 rounded-full border-4 border-border border-t-primary animate-spin" aria-hidden="true" />
      <h2 className="text-2xl font-bold">Loading results...</h2>
    </div>
  );
}
