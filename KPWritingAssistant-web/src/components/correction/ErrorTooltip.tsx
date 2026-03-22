'use client';

import { useEffect, useRef } from 'react';
import type { ErrorAnnotation } from '@/types/ai';
import Badge from '@/components/ui/Badge';

const severityColor: Record<string, 'red' | 'orange' | 'gray'> = {
  critical: 'red',
  major: 'orange',
  minor: 'gray',
};

interface ErrorTooltipProps {
  annotation: ErrorAnnotation;
  onClose: () => void;
}

export default function ErrorTooltip({ annotation, onClose }: ErrorTooltipProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-50 top-full mt-1 w-64 max-w-[min(16rem,calc(100vw-2rem))] bg-white rounded-xl shadow-lg border border-neutral-200 p-3 text-left"
      style={{ left: 'min(0px, calc(100vw - 17rem))' }}
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <Badge color={severityColor[annotation.severity] ?? 'gray'}>
          {annotation.error_type}
        </Badge>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-600 p-0.5"
          aria-label="关闭"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="space-y-1.5 text-xs">
        <div>
          <span className="text-neutral-400">原词：</span>
          <span className="text-red-600 line-through">{annotation.original}</span>
        </div>
        <div>
          <span className="text-neutral-400">修正：</span>
          <span className="text-green-600 font-medium">{annotation.corrected}</span>
        </div>
        {annotation.explanation && (
          <p className="text-neutral-600 leading-relaxed pt-1 border-t border-neutral-100">
            {annotation.explanation}
          </p>
        )}
      </div>
    </div>
  );
}
