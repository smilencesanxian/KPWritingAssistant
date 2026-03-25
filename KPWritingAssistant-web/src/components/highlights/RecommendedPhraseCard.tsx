'use client';

import { useState } from 'react';
import { RecommendedPhrase } from '@/types/database';

interface RecommendedPhraseCardProps {
  phrase: RecommendedPhrase;
  isCollected: boolean;
  isLoading: boolean;
  onCollect: (id: string) => Promise<void>;
}

const TYPE_CONFIG = {
  vocabulary: { label: '词汇', color: 'bg-blue-100 text-blue-700' },
  phrase: { label: '短语', color: 'bg-purple-100 text-purple-700' },
  sentence: { label: '句子', color: 'bg-green-100 text-green-700' },
};

const ESSAY_TYPE_LABELS: Record<string, string> = {
  email: '邮件',
  article: '文章',
  general: '通用',
};

export default function RecommendedPhraseCard({
  phrase,
  isCollected,
  isLoading,
  onCollect,
}: RecommendedPhraseCardProps) {
  const [showExample, setShowExample] = useState(false);
  const typeConfig = TYPE_CONFIG[phrase.type];
  const essayTypeLabel = phrase.essay_type ? ESSAY_TYPE_LABELS[phrase.essay_type] : null;

  return (
    <div
      data-testid={`recommended-card-${phrase.id}`}
      className="bg-white rounded-xl p-4 border border-neutral-100"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
    >
      {/* Header: badges and collect button */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap gap-2">
          {/* Type badge */}
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig.color}`}
          >
            {typeConfig.label}
          </span>
          {/* Essay type badge */}
          {essayTypeLabel && (
            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
              {essayTypeLabel}
            </span>
          )}
        </div>

        {/* Collect button */}
        <button
          data-testid={`collect-button-${phrase.id}`}
          onClick={() => onCollect(phrase.id)}
          disabled={isCollected || isLoading}
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            isCollected
              ? 'bg-green-100 text-green-600 cursor-default'
              : isLoading
              ? 'bg-neutral-100 text-neutral-400 cursor-wait'
              : 'bg-primary-50 text-primary-600 hover:bg-primary-100 active:scale-95'
          }`}
          aria-label={isCollected ? '已收藏' : '收藏'}
        >
          {isCollected ? (
            // Solid checkmark
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            // Plus icon
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          )}
        </button>
      </div>

      {/* Main text */}
      <p className="text-base text-neutral-800 leading-relaxed mb-2">{phrase.text}</p>

      {/* Usage example (collapsible) */}
      {phrase.usage_example && (
        <div className="mt-3">
          <button
            onClick={() => setShowExample(!showExample)}
            className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            {showExample ? '收起示例' : '查看示例'}
            <svg
              className={`w-3 h-3 transition-transform ${showExample ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showExample && (
            <p className="mt-2 text-sm text-neutral-500 italic bg-neutral-50 rounded-lg px-3 py-2">
              &ldquo;{phrase.usage_example}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
}
