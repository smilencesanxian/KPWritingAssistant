import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type BadgeColor = 'blue' | 'green' | 'orange' | 'red' | 'gray';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
  children: React.ReactNode;
}

const colorClasses: Record<BadgeColor, string> = {
  blue: 'bg-primary-100 text-primary-700',
  green: 'bg-green-100 text-green-700',
  orange: 'bg-orange-100 text-orange-700',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-neutral-100 text-neutral-600',
};

export default function Badge({ color = 'blue', children, className, ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        colorClasses[color],
        className
      )}
    >
      {children}
    </span>
  );
}
