'use client';

import { useState, useCallback } from 'react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface RegenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  essayId: string;
  onRegenerate: (updatedEssay: { id: string; user_edited_content: string | null; is_user_edited: boolean }) => void;
}

export default function RegenerateModal({
  isOpen,
  onClose,
  essayId,
  onRegenerate,
}: RegenerateModalProps) {
  const [preferenceNotes, setPreferenceNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/model-essays/${essayId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preference_notes: preferenceNotes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '重新生成失败');
      }

      const { model_essay } = await response.json() as {
        model_essay: { id: string; user_edited_content: string | null; is_user_edited: boolean };
      };

      onRegenerate(model_essay);
      onClose();
      // Reset input after successful regeneration
      setPreferenceNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '重新生成失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }, [preferenceNotes, essayId, onClose, onRegenerate]);

  const handleClose = useCallback(() => {
    if (!isLoading) {
      onClose();
    }
  }, [isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={handleClose}
        data-testid="regenerate-sheet-backdrop"
      />

      {/* Sheet */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl',
          'transform transition-transform duration-300 ease-out',
          'max-h-[80vh] flex flex-col'
        )}
        data-testid="regenerate-sheet"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-neutral-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-100">
          <h2 className="text-lg font-semibold text-neutral-800">重新生成范文</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors disabled:opacity-50"
            data-testid="regenerate-sheet-close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-sm text-neutral-600 mb-4">
            告诉AI如何改进这篇范文
          </p>

          <textarea
            value={preferenceNotes}
            onChange={(e) => setPreferenceNotes(e.target.value)}
            disabled={isLoading}
            placeholder="例如：更正式一些，加入描述性词汇，适合Part 2文章风格..."
            className="w-full h-32 p-4 text-sm text-neutral-800 bg-neutral-50 border border-neutral-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
            data-testid="preference-input"
          />

          {error && (
            <p className="mt-3 text-sm text-red-500" data-testid="regenerate-error">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
          <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
            取消
          </Button>
          <Button
            onClick={handleRegenerate}
            loading={isLoading}
            disabled={isLoading}
            data-testid="regenerate-button"
          >
            {isLoading ? '正在重新生成...' : '重新生成范文'}
          </Button>
        </div>
      </div>
    </div>
  );
}
