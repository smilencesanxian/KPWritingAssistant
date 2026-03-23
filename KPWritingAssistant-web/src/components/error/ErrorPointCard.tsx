'use client';

import { useRef, useState } from 'react';
import { ErrorPoint } from '@/types/database';

interface ErrorPointCardProps {
  errorPoint: ErrorPoint;
  onClick: (id: string) => void;
  onDelete?: (id: string) => void;
  manageMode?: boolean;
}

const ERROR_TYPE_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
  subject_verb_agreement: { icon: '主', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  verb_tense: { icon: '时', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  article_usage: { icon: '冠', color: 'text-green-700', bgColor: 'bg-green-100' },
  preposition_usage: { icon: '介', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  spelling: { icon: '拼', color: 'text-red-700', bgColor: 'bg-red-100' },
  punctuation: { icon: '标', color: 'text-pink-700', bgColor: 'bg-pink-100' },
  word_choice: { icon: '词', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  sentence_structure: { icon: '句', color: 'text-teal-700', bgColor: 'bg-teal-100' },
  plural_singular: { icon: '数', color: 'text-orange-700', bgColor: 'bg-orange-100' },
};

function getTypeConfig(errorType: string) {
  return ERROR_TYPE_CONFIG[errorType] ?? { icon: '误', color: 'text-neutral-700', bgColor: 'bg-neutral-100' };
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
}

const DELETE_WIDTH = 72;
const SNAP_THRESHOLD = 24; // 降低阈值，更容易触发删除按钮展开

export default function ErrorPointCard({ errorPoint, onClick, onDelete, manageMode }: ErrorPointCardProps) {
  const config = getTypeConfig(errorPoint.error_type);
  const isFlagged = errorPoint.is_flagged;

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

  function handleClose() {
    setOffsetX(0);
  }

  const isOpen = offsetX !== 0;

  return (
    <div className="relative overflow-hidden border-b border-neutral-100 last:border-b-0">
      {/* Delete button revealed by swipe (non-manage mode) */}
      {onDelete && !manageMode && (
        <div
          className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-red-500"
          style={{ width: DELETE_WIDTH }}
        >
          <button
            onClick={() => onDelete(errorPoint.id)}
            className="w-full h-full flex flex-col items-center justify-center gap-1 text-white text-xs font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
            删除
          </button>
        </div>
      )}

      {/* Swipeable row */}
      <div
        style={{
          transform: manageMode ? 'none' : `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease',
        }}
        onTouchStart={manageMode ? undefined : handleTouchStart}
        onTouchMove={manageMode ? undefined : handleTouchMove}
        onTouchEnd={manageMode ? undefined : handleTouchEnd}
      >
        <button
          onClick={() => {
            if (manageMode) return;
            if (isOpen) {
              handleClose();
            } else {
              onClick(errorPoint.id);
            }
          }}
          className={`w-full flex items-center gap-3 py-3.5 px-4 text-left border-l-4 transition-colors hover:bg-neutral-50 active:bg-neutral-100 ${
            isFlagged ? 'border-l-orange-400 pl-3' : 'border-l-transparent'
          }`}
        >
          {/* Left icon */}
          {isFlagged ? (
            <span className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-orange-100">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </span>
          ) : (
            <span
              className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${config.bgColor} ${config.color}`}
            >
              {config.icon}
            </span>
          )}

          {/* Middle: label + count */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-800 truncate">{errorPoint.error_type_label}</p>
            <p className="text-xs text-neutral-400 mt-0.5">出现{errorPoint.occurrence_count}次</p>
          </div>

          {/* Right: date + delete button in manage mode, or arrow */}
          {manageMode && onDelete ? (
            <button
              onClick={(e) => { e.preventDefault(); onDelete(errorPoint.id); }}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-500 active:bg-red-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <div className="flex-shrink-0 flex items-center gap-1.5">
              <span className="text-xs text-neutral-400">{formatDate(errorPoint.last_seen_at)}</span>
              <svg className="w-4 h-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
