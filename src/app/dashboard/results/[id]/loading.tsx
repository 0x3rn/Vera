import { Skeleton } from "@/components/Skeleton";

export default function ResultsLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>

      {/* Main Score Card Skeleton */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-center md:items-start">
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-border flex items-center justify-center shrink-0">
          <Skeleton className="h-10 w-16" />
        </div>
        
        <div className="flex-1 space-y-6 text-center md:text-left w-full">
          <div>
            <Skeleton className="h-8 w-48 mb-2 mx-auto md:mx-0" />
            <Skeleton className="h-4 w-full max-w-md mx-auto md:mx-0" />
            <Skeleton className="h-4 w-3/4 max-w-sm mx-auto md:mx-0 mt-1" />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-border">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="h-8 w-12 mb-1 mx-auto md:mx-0" />
                <Skeleton className="h-3 w-20 mx-auto md:mx-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Red Flags List Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-7 w-48 mb-6" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-6">
            <div className="flex gap-3 items-start mb-4">
              <Skeleton className="h-6 w-6 rounded-full shrink-0" />
              <div className="w-full">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg mb-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
