import { Skeleton } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
      </div>

      {/* Metrics Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-6 sm:p-8">
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-10 w-16 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>

      {/* Plan Details Skeleton */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-12 w-32 rounded-lg" />
      </div>

      {/* Recent Scans Skeleton */}
      <div className="mt-12">
        <Skeleton className="h-7 w-32 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 flex flex-col h-full">
              <Skeleton className="h-5 w-3/4 mb-3" />
              <div className="flex items-center gap-3 mb-6">
                <Skeleton className="h-6 w-16 rounded-md" />
                <Skeleton className="h-6 w-20 rounded-md" />
              </div>
              <div className="mt-auto pt-6 border-t border-border flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
