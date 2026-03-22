import { cn } from '@/lib/utils';

interface SkeletonProps {
  width?: string;
  height?: string;
  rounded?: boolean | string;
  className?: string;
}

export default function Skeleton({ width, height, rounded, className }: SkeletonProps) {
  const roundedClass =
    rounded === true
      ? 'rounded-full'
      : typeof rounded === 'string'
      ? rounded
      : 'rounded-md';

  return (
    <div
      className={cn('animate-pulse bg-neutral-200', roundedClass, className)}
      style={{ width, height }}
    />
  );
}
