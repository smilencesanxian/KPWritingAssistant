'use client';

import { useState } from 'react';

interface AddKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { text: string; type: string; essayType: string }) => void;
  defaultEssayType: string;
  isSubmitting?: boolean;
}

const typeOptions = [
  { value: 'vocabulary', label: '词汇' },
  { value: 'phrase', label: '短语' },
  { value: 'sentence', label: '句子' },
];

const essayTypeOptions = [
  { value: 'email', label: '邮件' },
  { value: 'article', label: '文章' },
  { value: 'story', label: '故事' },
];

export default function AddKnowledgeModal({
  isOpen,
  onClose,
  onSubmit,
  defaultEssayType,
  isSubmitting,
}: AddKnowledgeModalProps) {
  const [text, setText] = useState('');
  const [type, setType] = useState('vocabulary');
  const [essayType, setEssayType] = useState(defaultEssayType);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit({ text: text.trim(), type, essayType });
      // Reset form
      setText('');
      setType('vocabulary');
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setText('');
      setType('vocabulary');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
        data-testid="add-knowledge-modal"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100">
          <h3 className="text-lg font-semibold text-neutral-900">添加自定义知识</h3>
          <p className="text-sm text-neutral-500 mt-1">添加你自己的亮点词句到知识库</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Content input */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              知识内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="输入你要积累的好词好句..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[80px] resize-none"
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              类型
            </label>
            <div className="flex gap-2">
              {typeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  disabled={isSubmitting}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    type === option.value
                      ? 'bg-primary-50 text-primary-600 border border-primary-200'
                      : 'bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Essay type selector */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              作文类型
            </label>
            <div className="flex gap-2">
              {essayTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setEssayType(option.value)}
                  disabled={isSubmitting}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    essayType === option.value
                      ? 'bg-primary-50 text-primary-600 border border-primary-200'
                      : 'bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !text.trim()}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  添加中...
                </span>
              ) : (
                '添加'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
