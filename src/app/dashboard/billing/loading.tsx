import { Skeleton } from "@/components/Skeleton";

export default function BillingLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-8 items-start">
        <div className="space-y-8">
          {/* Plan Details Skeleton */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 max-w-lg">
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-48 mb-6" />
            
            <div className="space-y-3">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>

          {/* Usage This Month Skeleton */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 max-w-lg">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
              <div className="pt-6 border-t border-border grid grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-12" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice History Skeleton */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden max-w-lg">
          <div className="p-6 sm:p-8 border-b border-border">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex flex-col items-center justify-center py-8">
              <Skeleton className="h-12 w-12 rounded-full mb-4" />
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
