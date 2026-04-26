'use client';

import { useState } from 'react';
import { KbMaterialWithMeta } from '@/types/knowledge-base';

interface KnowledgeItemProps {
  item: KbMaterialWithMeta;
  onCollect: (id: string) => void;
  onDelete: (id: string) => void;
  isCollecting?: boolean;
  isDeleting?: boolean;
}

export default function KnowledgeItem({
  item,
  onCollect,
  onDelete,
  isCollecting,
  isDeleting,
}: KnowledgeItemProps) {
  const [showExample, setShowExample] = useState(false);

  const handleCollect = () => {
    if (!item.is_collected) {
      onCollect(item.id);
    }
  };

  const handleDelete = () => {
    if (item.highlight_id) {
      onDelete(item.highlight_id);
    }
  };

  const getTypeBadge = () => {
    const typeLabels: Record<string, string> = {
      vocabulary: '词汇',
      phrase: '短语',
      sentence: '句式',
    };
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 shrink-0">
        {typeLabels[item.type] || item.type}
      </span>
    );
  };

  return (
    <div
      className="flex items-start gap-3 py-3 px-4 border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 transition-colors"
      data-testid={`knowledge-item-${item.id}`}
    >
      <div className="flex-1">
        {/* Text content */}
        <span className="text-base text-neutral-800">{item.text}</span>

        {/* Meaning (Chinese) */}
        {item.meaning_zh && (
          <span className="block text-sm text-neutral-500 mt-1">{item.meaning_zh}</span>
        )}

        {/* Sub-category tag */}
        {item.sub_category && (
          <span className="inline-block text-xs px-2 py-0.5 mt-1 rounded bg-primary-50 text-primary-600">
            {item.sub_category}
          </span>
        )}

        {/* Example sentence - expandable */}
        {item.example_sentence && (
          <div className="mt-2">
            <button
              onClick={() => setShowExample(!showExample)}
              className="text-xs text-primary-600 hover:underline"
            >
              {showExample ? '收起例句' : '查看例句'}
            </button>
            {showExample && (
              <div className="mt-2 text-sm text-neutral-600 bg-neutral-50 p-2 rounded">
                <p>{item.example_sentence}</p>
                {item.example_source && (
                  <span className="text-xs text-neutral-400 block mt-1">
                    {item.example_source}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Type Badge */}
      <div className="flex flex-col items-center gap-2 ml-2">
        {getTypeBadge()}

        {/* Star indicator if collected */}
        {item.is_collected && (
          <span className="text-yellow-500 shrink-0" title="已收藏">
            🌟
          </span>
        )}

        {/* Action buttons */}
        <div className="flex gap-1">
          {item.is_collected ? (
            <button
              disabled
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium cursor-default"
              data-testid={`collect-button-${item.id}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              已收藏
            </button>
          ) : (
            <button
              onClick={handleCollect}
              disabled={isCollecting}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              data-testid={`collect-button-${item.id}`}
            >
              {isCollecting ? (
                <span className="w-4 h-4 border-2 border-primary-300 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
              收藏
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
