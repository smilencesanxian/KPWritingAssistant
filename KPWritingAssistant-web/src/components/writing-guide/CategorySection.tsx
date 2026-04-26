'use client';

import { useState } from 'react';
import { KbSectionWithItems } from '@/types/knowledge-base';
import KnowledgeItem from './KnowledgeItem';

interface CategorySectionProps {
  section: KbSectionWithItems;
  onCollect: (id: string) => void;
  onDelete: (id: string) => void;
  isCollecting?: string | null;
  isDeleting?: string | null;
}

export default function CategorySection({
  section,
  onCollect,
  onDelete,
  isCollecting,
  isDeleting,
}: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div
      className="bg-white rounded-lg border border-neutral-200 overflow-hidden"
      data-testid={`category-section-${section.slug}`}
    >
      {/* Header - Clickable for accordion */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50 hover:bg-neutral-100 transition-colors"
      >
        <span className="font-medium text-neutral-800">{section.label_zh}</span>
        {section.description && (
          <span className="text-sm text-neutral-500 ml-2">{section.description}</span>
        )}
        <span className="text-sm text-neutral-500">{section.materials.length} 条</span>
        <svg
          className={`w-5 h-5 text-neutral-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Items list */}
      {isExpanded && (
        <div className="animate-in slide-in-from-top-1 duration-200">
          {section.materials.map((item) => (
            <KnowledgeItem
              key={item.id}
              item={item}
              onCollect={onCollect}
              onDelete={onDelete}
              isCollecting={isCollecting === item.id}
              isDeleting={isDeleting === item.highlight_id || undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
