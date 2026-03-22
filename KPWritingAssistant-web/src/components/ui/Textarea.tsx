import { TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  maxLength?: number;
}

export default function Textarea({
  label,
  error,
  helperText,
  maxLength,
  className,
  id,
  value,
  rows = 4,
  ...props
}: TextareaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  const currentLength = typeof value === 'string' ? value.length : 0;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-neutral-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          id={textareaId}
          rows={rows}
          maxLength={maxLength}
          value={value}
          {...props}
          className={cn(
            'w-full px-3 py-2 border rounded-lg text-sm transition-colors resize-vertical',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            error ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300',
            maxLength && 'pb-6',
            className
          )}
        />
        {maxLength && (
          <span className="absolute bottom-2 right-3 text-xs text-neutral-400">
            {currentLength}/{maxLength}
          </span>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-neutral-500">{helperText}</p>}
    </div>
  );
}
