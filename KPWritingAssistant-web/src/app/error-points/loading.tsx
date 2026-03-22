import Skeleton from '@/components/ui/Skeleton';

export default function ErrorPointsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Tab skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>

      {/* Error point cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl border border-neutral-100 space-y-2">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
