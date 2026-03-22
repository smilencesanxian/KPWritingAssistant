'use client';

import { useState, useCallback } from 'react';
import type { ErrorAnnotation } from '@/types/ai';
import ErrorTooltip from './ErrorTooltip';

interface Segment {
  text: string;
  annotation?: ErrorAnnotation;
}

function buildSegments(text: string, annotations: ErrorAnnotation[]): Segment[] {
  if (!annotations.length) return [{ text }];

  const sorted = [...annotations].sort((a, b) => a.start - b.start);
  const segments: Segment[] = [];
  let cursor = 0;

  for (const ann of sorted) {
    const start = Math.max(ann.start, cursor);
    const end = Math.min(ann.end, text.length);
    if (start >= end) continue;

    if (start > cursor) {
      segments.push({ text: text.slice(cursor, start) });
    }
    segments.push({ text: text.slice(start, end), annotation: ann });
    cursor = end;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) });
  }

  return segments;
}

const severityUnderline: Record<string, string> = {
  critical: 'decoration-red-500',
  major: 'decoration-red-400',
  minor: 'decoration-orange-400',
};

interface AnnotatedEssayProps {
  text: string;
  annotations: ErrorAnnotation[];
}

export default function AnnotatedEssay({ text, annotations }: AnnotatedEssayProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleClose = useCallback(() => setActiveIndex(null), []);

  const segments = buildSegments(text, annotations);

  return (
    <div
      className="bg-white rounded-2xl p-4 text-sm leading-loose text-neutral-800 font-mono whitespace-pre-wrap relative"
      style={{
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        backgroundImage:
          'repeating-linear-gradient(transparent, transparent 1.8em, #e5e7eb 1.8em, #e5e7eb calc(1.8em + 1px))',
        backgroundPositionY: '0.4em',
      }}
    >
      {segments.map((seg, i) => {
        if (!seg.annotation) {
          return <span key={i}>{seg.text}</span>;
        }

        const isActive = activeIndex === i;
        const underline = severityUnderline[seg.annotation.severity] ?? 'decoration-red-400';

        return (
          <span key={i} className="relative inline">
            <span
              className={`underline decoration-dashed decoration-2 cursor-pointer ${underline}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex(isActive ? null : i);
              }}
            >
              {seg.text}
            </span>
            {isActive && (
              <ErrorTooltip annotation={seg.annotation} onClose={handleClose} />
            )}
          </span>
        );
      })}
    </div>
  );
}
