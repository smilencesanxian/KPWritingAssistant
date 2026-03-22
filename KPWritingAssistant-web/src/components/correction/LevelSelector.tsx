'use client';

import { cn } from '@/lib/utils';

export type EssayLevel = 'pass' | 'good' | 'excellent';

const LEVELS: { value: EssayLevel; label: string }[] = [
  { value: 'pass', label: '合格' },
  { value: 'good', label: '优秀' },
  { value: 'excellent', label: '卓越' },
];

interface LevelSelectorProps {
  value: EssayLevel;
  onChange: (level: EssayLevel) => void;
  disabled?: boolean;
}

export default function LevelSelector({ value, onChange, disabled }: LevelSelectorProps) {
  return (
    <div className="flex gap-0">
      {LEVELS.map(({ value: level, label }, i) => (
        <button
          key={level}
          onClick={() => onChange(level)}
          disabled={disabled}
          className={cn(
            'flex-1 py-2 text-sm font-medium border transition-colors',
            i === 0 && 'rounded-l-lg',
            i === LEVELS.length - 1 && 'rounded-r-lg',
            i > 0 && '-ml-px',
            value === level
              ? 'bg-primary-600 text-white border-primary-600 z-10 relative'
              : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
