'use client';

import { useToast } from '@/components/ui/Toast';

interface ErrorPointDetailActionsProps {
  showPracticeButton?: boolean;
}

export default function ErrorPointDetailActions({ showPracticeButton }: ErrorPointDetailActionsProps) {
  const showToast = useToast();

  if (showPracticeButton) {
    return (
      <button
        onClick={() => showToast('即将推出，敬请期待！', 'warning')}
        className="w-full py-3.5 rounded-2xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 active:bg-orange-700 transition-colors"
      >
        生成专项练习纸
      </button>
    );
  }

  return (
    <button
      onClick={() => showToast('即将上线，敬请期待！', 'warning')}
      className="flex-shrink-0 px-3 py-1.5 rounded-xl border-2 border-dashed border-neutral-300 text-xs text-neutral-400 hover:border-neutral-400 hover:text-neutral-500 transition-colors"
    >
      已掌握
    </button>
  );
}
