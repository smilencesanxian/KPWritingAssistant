'use client';

import { KnowledgeItem as KnowledgeItemType } from '@/lib/db/recommended-phrases';

interface KnowledgeItemProps {
  item: KnowledgeItemType;
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
  const handleCollect = () => {
    if (!item.is_collected && item.source === 'system') {
      onCollect(item.id);
    }
  };

  const handleDelete = () => {
    if (item.source === 'user' && item.highlight_id) {
      onDelete(item.highlight_id);
    }
  };

  // Get level badge
  const getLevelBadge = () => {
    if (item.level === 'basic') {
      return (
        <span className="text-xs px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 shrink-0">
          [基础]
        </span>
      );
    }
    if (item.level === 'advanced') {
      return (
        <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-600 shrink-0">
          [高级★]
        </span>
      );
    }
    return null;
  };

  // Get type badge
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
      className="flex items-center gap-3 py-3 px-4 border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 transition-colors"
      data-testid={`knowledge-item-${item.id}`}
    >
      {/* Level Badge */}
      {getLevelBadge()}

      {/* Star indicator if in highlights */}
      {item.is_in_highlights && (
        <span className="text-yellow-500 shrink-0" title="已在亮点库中">
          🌟
        </span>
      )}

      {/* Text content */}
      <span className="flex-1 text-neutral-800">{item.text}</span>

      {/* Type Badge */}
      {getTypeBadge()}

      {/* Action buttons */}
      {item.source === 'system' ? (
        /* System item: show collect button */
        item.is_collected ? (
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
        )
      ) : (
        /* User item: show delete button */
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          data-testid={`delete-button-${item.id}`}
          title="删除"
        >
          {isDeleting ? (
            <span className="w-4 h-4 block border-2 border-neutral-300 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
