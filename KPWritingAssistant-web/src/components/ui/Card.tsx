import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={cn(
        'bg-white rounded-2xl p-4',
        className
      )}
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', ...props.style }}
    >
      {children}
    </div>
  );
}
