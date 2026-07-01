import { Skeleton } from "@/components/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">
      <div className="mb-8">
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      <div className="space-y-10">
        {/* Profile Information Skeleton */}
        <div>
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1.5" />
                <Skeleton className="h-11 w-full rounded-lg" />
              </div>
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1.5" />
                <Skeleton className="h-11 w-full rounded-lg" />
              </div>
            </div>
            <Skeleton className="h-10 w-[140px] rounded-lg" />
          </div>
        </div>

        <div className="h-px bg-border w-full" />

        {/* Email Skeleton */}
        <div>
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-4">
            <div>
              <Skeleton className="h-4 w-24 mb-1.5" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <div>
              <Skeleton className="h-4 w-32 mb-1.5" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <Skeleton className="h-10 w-[140px] rounded-lg" />
          </div>
        </div>

        <div className="h-px bg-border w-full" />

        {/* Password Skeleton */}
        <div>
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-4">
            <div>
              <Skeleton className="h-4 w-32 mb-1.5" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <div>
              <Skeleton className="h-4 w-32 mb-1.5" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <Skeleton className="h-10 w-[160px] rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
