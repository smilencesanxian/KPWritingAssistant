'use client';

import { useState, useCallback, useMemo } from 'react';
import type { ErrorAnnotation } from '@/types/ai';
import AnnotationDrawer from './AnnotationDrawer';

interface Segment {
  text: string;
  annotation?: ErrorAnnotation;
  index: number;
}

function buildSegments(text: string, annotations: ErrorAnnotation[]): Segment[] {
  if (!annotations.length) return [{ text, index: 0 }];

  const sorted = [...annotations].sort((a, b) => a.start - b.start);
  const segments: Segment[] = [];
  let cursor = 0;
  let index = 0;

  for (const ann of sorted) {
    const start = Math.max(ann.start, cursor);
    const end = Math.min(ann.end, text.length);
    if (start >= end) continue;

    if (start > cursor) {
      segments.push({ text: text.slice(cursor, start), index });
      index++;
    }
    segments.push({ text: text.slice(start, end), annotation: ann, index });
    index++;
    cursor = end;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), index });
  }

  return segments;
}

const severityUnderline: Record<string, string> = {
  critical: 'decoration-red-500',
  major: 'decoration-orange-400',
  minor: 'decoration-neutral-400',
};

const severityBg: Record<string, string> = {
  critical: 'bg-red-500/10',
  major: 'bg-orange-400/10',
  minor: 'bg-neutral-400/10',
};

interface AnnotatedEssayProps {
  text: string;
  annotations: ErrorAnnotation[];
}

export default function AnnotatedEssay({ text, annotations }: AnnotatedEssayProps) {
  const [activeAnnotation, setActiveAnnotation] = useState<ErrorAnnotation | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setIsDrawerOpen(false);
    // Delay clearing the annotation to allow exit animation
    setTimeout(() => setActiveAnnotation(null), 300);
  }, []);

  const handleAnnotationClick = useCallback((annotation: ErrorAnnotation) => {
    setActiveAnnotation(annotation);
    setIsDrawerOpen(true);
  }, []);

  const segments = useMemo(() => buildSegments(text, annotations), [text, annotations]);

  // Calculate error summary statistics
  const errorSummary = useMemo(() => {
    const summary: Record<string, number> = {};
    annotations.forEach((ann) => {
      summary[ann.error_type] = (summary[ann.error_type] || 0) + 1;
    });
    return summary;
  }, [annotations]);

  const totalErrors = annotations.length;
  const errorTypes = Object.keys(errorSummary);

  // Filter segments by selected type
  const filteredSegments = useMemo(() => {
    if (!selectedType) return segments;
    return segments.map((seg) => ({
      ...seg,
      isDimmed: seg.annotation && seg.annotation.error_type !== selectedType,
    }));
  }, [segments, selectedType]);

  return (
    <div className="space-y-4">
      {/* Essay content with annotations */}
      <div
        className="bg-white rounded-2xl p-4 text-sm leading-loose text-neutral-800 font-mono whitespace-pre-wrap relative"
        style={{
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          backgroundImage:
            'repeating-linear-gradient(transparent, transparent 1.8em, #e5e7eb 1.8em, #e5e7eb calc(1.8em + 1px))',
          backgroundPositionY: '0.4em',
        }}
      >
        {filteredSegments.map((seg, i) => {
          if (!seg.annotation) {
            return (
              <span
                key={i}
                className={(seg as Segment & { isDimmed?: boolean }).isDimmed ? 'opacity-30' : ''}
              >
                {seg.text}
              </span>
            );
          }

          const underline = severityUnderline[seg.annotation.severity] ?? 'decoration-red-400';
          const highlightBg = severityBg[seg.annotation.severity] ?? '';
          const isDimmed = (seg as Segment & { isDimmed?: boolean }).isDimmed;
          const isHighlighted =
            selectedType && seg.annotation.error_type === selectedType;

          return (
            <span
              key={i}
              className={`relative inline ${isDimmed ? 'opacity-30' : ''} ${
                isHighlighted ? highlightBg : ''
              }`}
            >
              <span
                className={`underline decoration-dashed decoration-2 cursor-pointer rounded px-0.5 transition-colors hover:bg-neutral-100 ${underline}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAnnotationClick(seg.annotation!);
                }}
              >
                {seg.text}
              </span>
            </span>
          );
        })}
      </div>

      {/* Error Summary Bar */}
      {totalErrors > 0 && (
        <div
          className="bg-white rounded-xl p-3 border border-neutral-200"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
          data-testid="error-summary-bar"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-neutral-700">
              共<span className="text-red-600 font-bold mx-1">{totalErrors}</span>处错误
            </span>
            <span className="text-neutral-300">|</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {errorTypes.map((type) => {
                const count = errorSummary[type];
                const isSelected = selectedType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedType(isSelected ? null : type)}
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs transition-all ${
                      isSelected
                        ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-400'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                    data-testid={`error-summary-${type}`}
                  >
                    {type}
                    <span
                      className={`ml-1 font-medium ${
                        isSelected ? 'text-primary-600' : 'text-neutral-500'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            {selectedType && (
              <button
                onClick={() => setSelectedType(null)}
                className="text-xs text-neutral-400 hover:text-neutral-600 ml-1"
              >
                清除筛选
              </button>
            )}
          </div>
        </div>
      )}

      {/* Annotation Drawer */}
      <AnnotationDrawer
        annotation={activeAnnotation}
        isOpen={isDrawerOpen}
        onClose={handleClose}
      />
    </div>
  );
}
