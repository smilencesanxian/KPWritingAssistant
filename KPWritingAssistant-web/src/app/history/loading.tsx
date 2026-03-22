import Skeleton from '@/components/ui/Skeleton';

function HistoryCardSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-neutral-100 space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-3 w-16" />
      <div className="flex gap-2 mt-1">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    </div>
  );
}

export default function HistoryLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
      <Skeleton className="h-6 w-24 mb-4" />
      {Array.from({ length: 5 }).map((_, i) => (
        <HistoryCardSkeleton key={i} />
      ))}
    </div>
  );
}
