import { Skeleton } from "@/components/Skeleton";

export default function ReportsLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Reports Table/List Skeleton */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Table Header (Desktop only approx) */}
        <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/50">
          <Skeleton className="h-4 w-24 col-span-5" />
          <Skeleton className="h-4 w-16 col-span-2" />
          <Skeleton className="h-4 w-16 col-span-2" />
          <Skeleton className="h-4 w-24 col-span-2" />
        </div>
        
        {/* Rows */}
        <div className="divide-y divide-border">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-5 flex flex-col gap-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/3 sm:hidden" />
              </div>
              <div className="sm:col-span-2 hidden sm:block">
                <Skeleton className="h-6 w-16 rounded-md" />
              </div>
              <div className="sm:col-span-2 hidden sm:block">
                <Skeleton className="h-6 w-16 rounded-md" />
              </div>
              <div className="sm:col-span-2 hidden sm:block">
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="sm:col-span-1 flex justify-end">
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
