import { cn } from '@/lib/utils';

type Size = 'sm' | 'md' | 'lg';

interface SpinnerProps {
  size?: Size;
  color?: string;
  className?: string;
}

const sizeClasses: Record<Size, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
};

export default function Spinner({ size = 'md', color, className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'rounded-full border-transparent animate-spin',
        sizeClasses[size],
        className
      )}
      style={{
        borderTopColor: color ?? 'currentColor',
        borderRightColor: color ?? 'currentColor',
        borderBottomColor: 'transparent',
        borderLeftColor: 'transparent',
      }}
    />
  );
}
