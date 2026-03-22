'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { SubmissionWithScore } from '@/lib/db/essays';

interface HistoryItemProps {
  item: SubmissionWithScore;
  onDelete?: (id: string) => void;
  manageMode?: boolean;
}

function getScoreColor(score: number | null): { icon: string; badge: string } {
  if (score === null) return { icon: 'text-neutral-400', badge: 'bg-neutral-100 text-neutral-500' };
  if (score >= 24) return { icon: 'text-green-500', badge: 'bg-green-50 text-green-600' };
  if (score >= 18) return { icon: 'text-blue-500', badge: 'bg-blue-50 text-blue-600' };
  return { icon: 'text-orange-500', badge: 'bg-orange-50 text-orange-600' };
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日的作文`;
}

function formatCorrectionTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return '今天批改';
  if (diffDays === 1) return '昨天批改';
  if (diffDays < 7) return `${diffDays}天前批改`;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日批改`;
}

const DELETE_WIDTH = 72;
const SNAP_THRESHOLD = 40;

export default function HistoryItem({ item, onDelete, manageMode }: HistoryItemProps) {
  const colors = getScoreColor(item.total_score);
  const title = item.title ?? formatDate(item.created_at);
  const href = item.correction_id ? `/corrections/${item.correction_id}` : '#';

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
    <div className="relative overflow-hidden border-b border-neutral-100 last:border-0">
      {/* Delete button revealed by swipe (non-manage mode) */}
      {onDelete && !manageMode && (
        <div
          className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-red-500"
          style={{ width: DELETE_WIDTH }}
        >
          <button
            onClick={() => onDelete(item.id)}
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
        <Link
          href={manageMode ? '#' : (isOpen ? '#' : href)}
          onClick={(e) => {
            if (manageMode) {
              e.preventDefault();
              return;
            }
            if (isOpen) {
              e.preventDefault();
              handleClose();
            }
          }}
          className="flex items-center gap-3 py-3.5 px-4 bg-white active:bg-neutral-50 transition-colors"
        >
          {/* Left icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center ${colors.icon}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
              />
            </svg>
          </div>

          {/* Center: title + time */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-800 truncate">{title}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{formatCorrectionTime(item.created_at)}</p>
          </div>

          {/* Right: score badge or delete button in manage mode */}
          {manageMode && onDelete ? (
            <button
              onClick={(e) => { e.preventDefault(); onDelete(item.id); }}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-500 active:bg-red-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <div className="flex-shrink-0 flex items-center gap-1.5">
              {item.total_score !== null ? (
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${colors.badge}`}>
                  {item.total_score}/30
                </span>
              ) : (
                <span className="text-xs text-neutral-400 px-2 py-1 rounded-lg bg-neutral-50">
                  批改中
                </span>
              )}
              <svg className="w-4 h-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </Link>
      </div>
    </div>
  );
}
