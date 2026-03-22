'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ModelEssay } from '@/types/database';
import type { CopybookMode } from '@/types/pdf';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';

interface TemplateOption {
  id: string;
  name: string;
  description: string;
}

interface FontOption {
  id: string;
  name: string;
  description: string;
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  { id: 'pet', name: 'PET Writing', description: 'Cambridge B1 Preliminary 标准答题纸' },
];

const FONT_OPTIONS: FontOption[] = [
  { id: 'hengshui', name: '衡水体', description: '舒窈衡水体，标准备考手写风格' },
  { id: 'ma-shan-zheng', name: '马善政楷书', description: '工整楷体，接近衡水体风格' },
  { id: 'zcool', name: '站酷庆科黄油体', description: '圆润手写楷体，亲切自然' },
  { id: 'zhi-mang-xing', name: '钟齐志莽行书', description: '行书风格，流畅有力' },
  { id: 'gochi-hand', name: 'Gochi Hand', description: '英文手写体' },
  { id: 'courier', name: 'Courier', description: '等宽体（打字机风格）' },
  { id: 'times', name: 'Times Roman', description: '衬线体（经典印刷）' },
  { id: 'helvetica', name: 'Helvetica', description: '无衬线体（简洁现代）' },
];

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

interface ModelEssayViewProps {
  correctionId: string;
  initialEssays: ModelEssay[];
}

export default function ModelEssayView({ correctionId, initialEssays }: ModelEssayViewProps) {
  const router = useRouter();

  // Always show excellent level only
  const existingExcellent = initialEssays.find((e) => e.target_level === 'excellent') ?? null;
  const [essay, setEssay] = useState<ModelEssay | null>(existingExcellent);
  const [loading, setLoading] = useState(!existingExcellent);
  const [copybookLoading, setCopybookLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [templateId, setTemplateId] = useState<string>('pet');
  const [copybookMode, setCopybookMode] = useState<CopybookMode>('tracing');
  const [fontStyle, setFontStyle] = useState<string>('hengshui');
  const [tracingOpacity, setTracingOpacity] = useState<number>(30);

  // Auto-fetch excellent essay on mount if not already available
  useEffect(() => {
    if (existingExcellent) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch('/api/generate/model-essay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correction_id: correctionId, target_level: 'excellent' }),
    })
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error ?? '生成失败');
        }
        const { model_essay } = (await res.json()) as { model_essay: ModelEssay };
        if (!cancelled) setEssay(model_essay);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '生成范文失败，请重试');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [correctionId, existingExcellent]);

  const handleGenerateCopybook = useCallback(async () => {
    if (!essay) return;
    setCopybookLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/generate/copybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_essay_id: essay.id,
          template_id: templateId,
          mode: copybookMode,
          font_style: fontStyle,
          tracing_opacity: copybookMode === 'tracing' ? tracingOpacity : 100,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? '生成字帖失败');
      }

      const { copybook } = (await res.json()) as { copybook: { id: string } };
      router.push(`/copybook/${copybook.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成字帖失败，请重试');
      setCopybookLoading(false);
    }
  }, [essay, router, templateId, copybookMode, fontStyle, tracingOpacity]);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-neutral-700">卓越范文</h3>

      {loading && (
        <Card>
          <div className="flex items-center justify-center gap-2 py-8 text-neutral-500">
            <Spinner size="sm" />
            <span className="text-sm">正在生成卓越范文...</span>
          </div>
        </Card>
      )}

      {!loading && essay && (
        <Card>
          {/* Essay content */}
          <p
            className="text-sm text-neutral-800 whitespace-pre-wrap select-text"
            style={{ fontFamily: 'monospace', lineHeight: '1.8' }}
          >
            {essay.content}
          </p>
          {/* Word count */}
          <p className="text-xs text-neutral-400 mt-2 text-right">
            共 {countWords(essay.content)} 词
          </p>

          {/* Copybook generation controls */}
          <div className="mt-4 pt-4 border-t border-neutral-100 space-y-3">
            <p className="text-xs font-medium text-neutral-500">生成字帖</p>

            {/* Template selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-600 shrink-0 w-14">模板</label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                disabled={copybookLoading}
                className="flex-1 text-xs border border-neutral-200 rounded-lg px-2 py-1.5 bg-white text-neutral-700 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
              >
                {TEMPLATE_OPTIONS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {t.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Font selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-600 shrink-0 w-14">字体</label>
              <select
                value={fontStyle}
                onChange={(e) => setFontStyle(e.target.value)}
                disabled={copybookLoading}
                className="flex-1 text-xs border border-neutral-200 rounded-lg px-2 py-1.5 bg-white text-neutral-700 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} — {f.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode toggle */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-600 shrink-0 w-14">模式</label>
              <div className="flex rounded-lg overflow-hidden border border-neutral-200 text-xs">
                <button
                  type="button"
                  onClick={() => setCopybookMode('tracing')}
                  disabled={copybookLoading}
                  className={`px-3 py-1.5 transition-colors disabled:opacity-50 ${
                    copybookMode === 'tracing'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  临摹
                </button>
                <button
                  type="button"
                  onClick={() => setCopybookMode('dictation')}
                  disabled={copybookLoading}
                  className={`px-3 py-1.5 transition-colors disabled:opacity-50 border-l border-neutral-200 ${
                    copybookMode === 'dictation'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  默写
                </button>
              </div>
              <span className="text-xs text-neutral-400">
                {copybookMode === 'tracing' ? '显示范文供临摹' : '空白行供默写'}
              </span>
            </div>

            {/* Tracing opacity slider (only in tracing mode) */}
            {copybookMode === 'tracing' && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-neutral-600 shrink-0 w-14">灰度</label>
                <input
                  type="range"
                  min={10}
                  max={80}
                  step={5}
                  value={tracingOpacity}
                  onChange={(e) => setTracingOpacity(Number(e.target.value))}
                  disabled={copybookLoading}
                  className="flex-1 h-1.5 accent-primary-600 disabled:opacity-50"
                />
                <span className="text-xs text-neutral-500 w-8 text-right">{tracingOpacity}%</span>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleGenerateCopybook}
                loading={copybookLoading}
                disabled={copybookLoading}
              >
                生成字帖
              </Button>
            </div>
          </div>
        </Card>
      )}

      {!loading && !essay && !error && (
        <Card>
          <div className="py-6 text-center text-sm text-neutral-400">暂无范文</div>
        </Card>
      )}

      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  );
}
