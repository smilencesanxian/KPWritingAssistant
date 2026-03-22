'use client';

import { ButtonHTMLAttributes } from 'react';
import Spinner from './Spinner';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 border border-transparent',
  secondary: 'bg-white text-primary-600 border border-primary-600 hover:bg-primary-50',
  ghost: 'bg-transparent text-neutral-600 border border-transparent hover:bg-neutral-100',
  danger: 'bg-red-600 text-white hover:bg-red-700 border border-transparent',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors',
        variantClasses[variant],
        sizeClasses[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {loading && <Spinner size="sm" className="mr-2" />}
      {children}
    </button>
  );
}
