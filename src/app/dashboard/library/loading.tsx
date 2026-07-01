import { Skeleton } from "@/components/Skeleton";

export default function LibraryLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-80" />
      </div>

      <div className="space-y-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-card border border-border rounded-xl overflow-hidden p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <Skeleton className="h-6 w-3/4 mb-3" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-md" />
                  <Skeleton className="h-6 w-24 rounded-md" />
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-border">
              <Skeleton className="h-4 w-32 mb-2" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
