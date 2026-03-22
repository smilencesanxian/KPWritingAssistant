import Skeleton from '@/components/ui/Skeleton';

export default function HighlightsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Search bar skeleton */}
      <Skeleton className="h-10 w-full rounded-lg" />

      {/* Highlight list items */}
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="p-3 rounded-xl border border-neutral-100 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
