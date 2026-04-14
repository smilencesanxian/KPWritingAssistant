'use client';

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

export default function ErrorPointCard({ errorPoint, onClick, onDelete, manageMode }: ErrorPointCardProps) {
  const config = getTypeConfig(errorPoint.error_type);
  const isFlagged = errorPoint.is_flagged;

  return (
    <div className="border-b border-neutral-100 last:border-b-0">
      <div className={`w-full flex items-stretch gap-3 py-3.5 px-4 border-l-4 ${
        isFlagged ? 'border-l-orange-400 pl-3' : 'border-l-transparent'
      }`}>
        <button
          onClick={() => {
            if (!manageMode) {
              onClick(errorPoint.id);
            }
          }}
          className="flex flex-1 items-center gap-3 text-left hover:bg-neutral-50 active:bg-neutral-100 rounded-lg transition-colors"
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

          {/* Right: date or chevron */}
          {!manageMode && (
            <div className="flex-shrink-0 flex items-center gap-1.5 pr-1">
              <span className="text-xs text-neutral-400">{formatDate(errorPoint.last_seen_at)}</span>
              <svg className="w-4 h-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          )}
        </button>

        {manageMode && onDelete ? (
          <button
            onClick={() => onDelete(errorPoint.id)}
            className="flex-shrink-0 w-8 h-8 self-center flex items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-100 active:bg-red-200"
            aria-label={`删除 ${errorPoint.error_type_label}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
}
