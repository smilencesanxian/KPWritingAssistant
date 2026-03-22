'use client';

import { useState } from 'react';

interface AddHighlightModalProps {
  onClose: () => void;
  onAdd: (text: string, type: string) => Promise<void>;
}

const TYPE_OPTIONS = [
  { value: 'vocabulary', label: '词汇' },
  { value: 'phrase', label: '短语' },
  { value: 'sentence', label: '句子' },
];

export default function AddHighlightModal({ onClose, onAdd }: AddHighlightModalProps) {
  const [text, setText] = useState('');
  const [type, setType] = useState('vocabulary');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!text.trim()) {
      setError('请输入亮点内容');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onAdd(text.trim(), type);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />
      {/* Bottom drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl p-5 pb-8 shadow-2xl animate-slide-up">
        <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mb-5" />
        <h2 className="text-base font-semibold text-neutral-800 mb-4">手动添加亮点</h2>

        <div className="mb-4">
          <label className="block text-sm text-neutral-600 mb-1.5">亮点内容 <span className="text-red-500">*</span></label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="输入词汇、短语或句子..."
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-primary-500 resize-none"
          />
        </div>

        <div className="mb-5">
          <label className="block text-sm text-neutral-600 mb-1.5">类型</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-primary-500 bg-white"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-500 mb-3">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-primary-600 text-white font-medium text-sm hover:bg-primary-700 disabled:opacity-60 transition-colors"
        >
          {loading ? '添加中...' : '确认添加'}
        </button>
      </div>
    </>
  );
}
