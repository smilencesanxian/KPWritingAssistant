'use client';

import { useRef, useState } from 'react';
import { Highlight } from '@/types/database';

interface HighlightItemProps {
  highlight: Highlight;
  onDelete: (id: string) => void;
}

const TYPE_CONFIG = {
  vocabulary: { label: '词汇', icon: '字', color: 'bg-blue-100 text-blue-700' },
  phrase: { label: '短语', icon: '组', color: 'bg-purple-100 text-purple-700' },
  sentence: { label: '句子', icon: '句', color: 'bg-green-100 text-green-700' },
};

const DELETE_WIDTH = 72;
const SNAP_THRESHOLD = 40;

export default function HighlightItem({ highlight, onDelete }: HighlightItemProps) {
  const config = TYPE_CONFIG[highlight.type] ?? TYPE_CONFIG.vocabulary;

  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const isHorizontal = useRef<boolean | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    startOffset.current = offsetX;
    isHorizontal.current = null;
  }

  function handleTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    if (isHorizontal.current === null) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      isHorizontal.current = Math.abs(dx) >= Math.abs(dy);
    }
    if (!isHorizontal.current) return;

    e.preventDefault();
    if (!isDragging) setIsDragging(true);
    const newOffset = Math.min(0, Math.max(-DELETE_WIDTH, startOffset.current + dx));
    setOffsetX(newOffset);
  }

  function handleTouchEnd() {
    if (isHorizontal.current === null) return;
    setIsDragging(false);
    if (offsetX < -SNAP_THRESHOLD) {
      setOffsetX(-DELETE_WIDTH);
    } else {
      setOffsetX(0);
    }
  }

  return (
    <div className="relative overflow-hidden border-b border-neutral-100 last:border-b-0">
      {/* Delete button revealed by swipe */}
      <div
        className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-red-500"
        style={{ width: DELETE_WIDTH }}
      >
        <button
          onClick={() => onDelete(highlight.id)}
          className="w-full h-full flex flex-col items-center justify-center gap-1 text-white text-xs font-medium"
          aria-label="删除"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
            />
          </svg>
          删除
        </button>
      </div>

      {/* Swipeable row */}
      <div
        className="flex items-center gap-3 py-3 px-4 bg-white"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => { if (offsetX !== 0) setOffsetX(0); }}
      >
        <span
          className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${config.color}`}
        >
          {config.icon}
        </span>
        <span className="flex-1 text-sm text-neutral-800 leading-snug break-all">
          {highlight.text}
        </span>
        {/* Desktop delete button (hidden on touch devices via pointer) */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(highlight.id); }}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors pointer-events-auto hidden sm:flex"
          aria-label="删除"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
