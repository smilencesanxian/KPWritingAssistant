'use client';

import { useEffect, useRef } from 'react';
import type { ErrorAnnotation } from '@/types/ai';
import Badge from '@/components/ui/Badge';

const severityConfig: Record<string, { color: 'red' | 'orange' | 'gray'; label: string }> = {
  critical: { color: 'red', label: '严重' },
  major: { color: 'orange', label: '重要' },
  minor: { color: 'gray', label: '轻微' },
};

const errorTypeColors: Record<string, 'red' | 'orange' | 'blue' | 'green' | 'purple' | 'gray'> = {
  grammar: 'red',
  vocabulary: 'blue',
  spelling: 'orange',
  expression: 'green',
  punctuation: 'purple',
};

interface AnnotationDrawerProps {
  annotation: ErrorAnnotation | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AnnotationDrawer({ annotation, isOpen, onClose }: AnnotationDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Handle escape key to close drawer
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !annotation) return null;

  const severity = severityConfig[annotation.severity] ?? { color: 'gray', label: '未知' };
  const errorTypeColor = errorTypeColors[annotation.error_type] ?? 'gray';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
        onClick={onClose}
        data-testid="annotation-drawer-backdrop"
        style={{
          animation: 'fadeIn 0.2s ease-out',
        }}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[60vh] flex flex-col"
        data-testid="annotation-drawer"
        style={{
          animation: 'slideUp 0.3s ease-out',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-neutral-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Badge color={errorTypeColor} data-testid="error-type-badge">
              {annotation.error_type}
            </Badge>
            <Badge color={severity.color} className="border border-current opacity-80">
              {severity.label}
            </Badge>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"
            aria-label="关闭"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-4 overflow-y-auto">
          <div className="space-y-4">
            {/* Original text */}
            <div>
              <div className="text-xs text-neutral-500 mb-1.5 font-medium">原文</div>
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <span className="text-red-700 line-through text-base">{annotation.original}</span>
              </div>
            </div>

            {/* Corrected text */}
            <div>
              <div className="text-xs text-neutral-500 mb-1.5 font-medium">修正</div>
              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
                <span className="text-green-700 font-medium text-base">{annotation.corrected}</span>
              </div>
            </div>

            {/* Explanation */}
            {annotation.explanation && (
              <div className="pt-2 border-t border-neutral-100">
                <div className="text-xs text-neutral-500 mb-1.5 font-medium">解释</div>
                <p className="text-neutral-700 text-sm leading-relaxed">{annotation.explanation}</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom safe area padding for mobile */}
        <div className="h-safe-area-inset-bottom" />
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
