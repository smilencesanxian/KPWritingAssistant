'use client';

import { useState, useCallback } from 'react';
import Button from '@/components/ui/Button';

interface EditEssayModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent: string;
  essayId: string;
  onSave: (updatedEssay: { id: string; user_edited_content: string | null; is_user_edited: boolean }) => void;
}

export default function EditEssayModal({
  isOpen,
  onClose,
  initialContent,
  essayId,
  onSave,
}: EditEssayModalProps) {
  const [content, setContent] = useState(initialContent);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/model-essays/${essayId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_edited_content: content,
          user_preference_notes: null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '保存失败');
      }

      const { model_essay } = await response.json() as {
        model_essay: { id: string; user_edited_content: string | null; is_user_edited: boolean };
      };

      onSave(model_essay);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }, [content, essayId, onClose, onSave]);

  const handleClose = useCallback(() => {
    if (!isLoading) {
      onClose();
    }
  }, [isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        data-testid="edit-modal-backdrop"
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="text-lg font-semibold text-neutral-800">编辑范文</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors disabled:opacity-50"
            data-testid="edit-modal-close"
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
        <div className="p-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isLoading}
            className="w-full h-[300px] p-4 text-sm text-neutral-800 bg-neutral-50 border border-neutral-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
            placeholder="在此编辑范文内容..."
            data-testid="edit-essay-textarea"
          />

          {error && (
            <p className="mt-3 text-sm text-red-500" data-testid="edit-error">
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
            onClick={handleSave}
            loading={isLoading}
            disabled={isLoading}
            data-testid="save-edit-button"
          >
            保存这个版本
          </Button>
        </div>
      </div>
    </div>
  );
}
