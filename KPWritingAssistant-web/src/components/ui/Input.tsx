import { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Input({ label, error, helperText, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={cn(
          'w-full px-3 py-2 border rounded-lg text-sm transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-neutral-300',
          className
        )}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-neutral-500">{helperText}</p>}
    </div>
  );
}
