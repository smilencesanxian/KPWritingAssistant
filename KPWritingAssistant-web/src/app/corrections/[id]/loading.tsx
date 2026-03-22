import Skeleton from '@/components/ui/Skeleton';

export default function CorrectionLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Score area - 3 columns */}
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20 w-4/5" />
        <Skeleton className="h-20 w-3/5" />
      </div>

      {/* Original essay area */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-10/12" />
      </div>

      {/* Model essay area */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-9/12" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-7/12" />
      </div>
    </div>
  );
}
