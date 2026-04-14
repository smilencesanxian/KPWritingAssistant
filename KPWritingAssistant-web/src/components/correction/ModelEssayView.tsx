'use client';

import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { ModelEssay, ModelEssaySourceSpan } from '@/types/database';
import type { CopybookMode } from '@/types/pdf';
import {
  getModelEssayWordCount,
  getModelEssayWordCountLimits,
} from '@/lib/model-essay/format';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import EditEssayModal from '@/components/model-essay/EditEssayModal';
import RegenerateModal from '@/components/model-essay/RegenerateModal';

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
  { id: 'pet', name: 'PET Part 1', description: '邮件写作 - 18行答题纸' },
  { id: 'pet-part2', name: 'PET Part 2', description: '文章/故事写作 - 17行答题纸' },
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

function getSourceSpanClass(sourceType: ModelEssaySourceSpan['source_type']): string {
  if (sourceType === 'historical_highlight') {
    return 'bg-sky-100 text-sky-800 border-sky-200';
  }
  return 'bg-amber-100 text-amber-800 border-amber-200';
}

function renderEssayWithSourceSpans(
  content: string,
  sourceSpans: ModelEssaySourceSpan[]
): ReactNode[] {
  if (sourceSpans.length === 0) {
    return [content];
  }

  const orderedSpans = [...sourceSpans].sort((left, right) => left.start - right.start);
  const nodes: ReactNode[] = [];
  let cursor = 0;

  orderedSpans.forEach((span, index) => {
    if (span.start > cursor) {
      nodes.push(content.slice(cursor, span.start));
    }

    nodes.push(
      <span
        key={`${span.source_type}-${span.source_id ?? 'unknown'}-${index}-${span.start}`}
        className={`rounded px-0.5 border ${getSourceSpanClass(span.source_type)}`}
        title={span.source_type === 'historical_highlight' ? '历史亮点' : '知识库素材'}
      >
        {content.slice(span.start, span.end)}
      </span>
    );

    cursor = span.end;
  });

  if (cursor < content.length) {
    nodes.push(content.slice(cursor));
  }

  return nodes;
}

interface ModelEssayViewProps {
  correctionId: string;
  initialEssays: ModelEssay[];
  examPart?: 'part1' | 'part2' | null;
  questionType?: 'q1' | 'q2' | null;
}

export default function ModelEssayView({
  correctionId,
  initialEssays,
  examPart,
  questionType,
}: ModelEssayViewProps) {
  const router = useRouter();

  // Always show excellent level only
  const existingExcellent = initialEssays.find((e) => e.target_level === 'excellent') ?? null;
  const [essay, setEssay] = useState<ModelEssay | null>(existingExcellent);
  const [loading, setLoading] = useState(!existingExcellent);
  const [copybookLoading, setCopybookLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 根据 examPart 自动选择默认模板，Part2 使用 pet-part2，其他使用 pet
  const [templateId, setTemplateId] = useState<string>(examPart === 'part2' ? 'pet-part2' : 'pet');
  const [copybookMode, setCopybookMode] = useState<CopybookMode>('tracing');
  const [fontStyle, setFontStyle] = useState<string>('hengshui');
  const [fontSize, setFontSize] = useState<number>(18); // 默认字体大小18pt
  const [tracingOpacity, setTracingOpacity] = useState<number>(30);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);

  // Get display content (use user_edited_content if available), clean residual Markdown symbols
  const rawContent = essay?.user_edited_content ?? essay?.content ?? '';
  const displayContent = rawContent.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/^#{1,6}\s+/gm, '');
  const sourceSpans = essay?.source_spans ?? [];
  const wordCountMetrics = getModelEssayWordCount(displayContent, examPart, questionType);
  const wordCountLimits = getModelEssayWordCountLimits();

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
          font_size: fontSize,
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
  }, [essay, router, templateId, copybookMode, fontStyle, fontSize, tracingOpacity]);

  const handleEditSave = useCallback(
    (updatedEssay: {
      id: string;
      user_edited_content: string | null;
      is_user_edited: boolean;
      source_spans?: ModelEssaySourceSpan[] | null;
    }) => {
      setEssay((prev) =>
        prev
          ? {
              ...prev,
              user_edited_content: updatedEssay.user_edited_content,
              is_user_edited: updatedEssay.is_user_edited,
              source_spans: updatedEssay.source_spans ?? null,
            }
          : null
      );
    },
    []
  );

  const handleRegenerateSave = useCallback(
    (updatedEssay: {
      id: string;
      user_edited_content: string | null;
      is_user_edited: boolean;
      source_spans?: ModelEssaySourceSpan[] | null;
    }) => {
      setEssay((prev) =>
        prev
          ? {
              ...prev,
              user_edited_content: updatedEssay.user_edited_content,
              is_user_edited: updatedEssay.is_user_edited,
              source_spans: updatedEssay.source_spans ?? null,
            }
          : null
      );
    },
    []
  );

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
        <>
          <Card>
            {/* Header with badge and buttons */}
            <div className="flex items-center justify-between mb-3">
              {essay.is_user_edited && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700"
                  data-testid="user-edited-badge"
                >
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  已自定义
                </span>
              )}
              {!essay.is_user_edited && <div />}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                  data-testid="edit-essay-button"
                >
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  编辑范文
                </button>
                <button
                  onClick={() => setIsRegenerateModalOpen(true)}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                  data-testid="regenerate-essay-button"
                >
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  重新生成
                </button>
              </div>
            </div>

            {/* Essay content */}
            {sourceSpans.length > 0 && (
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-1 text-sky-700">
                  <span className="h-2 w-2 rounded-full bg-sky-500" />
                  历史亮点
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  知识库素材
                </span>
              </div>
            )}
            <p
              className="text-sm text-neutral-800 whitespace-pre-wrap select-text"
              style={{ fontFamily: 'monospace', lineHeight: '1.8' }}
            >
              {renderEssayWithSourceSpans(displayContent, sourceSpans)}
            </p>
            {/* Word count */}
            <p
              className={`text-xs mt-2 text-right ${
                wordCountMetrics.withinHardLimit ? 'text-neutral-400' : 'text-red-500'
              }`}
            >
              正文 {wordCountMetrics.wordCount} 词
              {!wordCountMetrics.withinTargetRange && (
                <span className="ml-1">
                  （目标 {wordCountLimits.targetMin}-{wordCountLimits.targetMax}，上限 {wordCountLimits.hardMax}）
                </span>
              )}
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

              {/* Font size slider */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-neutral-600 shrink-0 w-14">字号</label>
                <input
                  type="range"
                  min={12}
                  max={22}
                  step={1}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  disabled={copybookLoading}
                  className="flex-1 h-1.5 accent-primary-600 disabled:opacity-50"
                />
                <span className="text-xs text-neutral-500 w-10 text-right">{fontSize}pt</span>
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
                <Button onClick={handleGenerateCopybook} loading={copybookLoading} disabled={copybookLoading}>
                  生成字帖
                </Button>
              </div>
            </div>
          </Card>

          {/* Modals */}
          <EditEssayModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            initialContent={displayContent}
            essayId={essay.id}
            examPart={examPart}
            questionType={questionType}
            onSave={handleEditSave}
          />
          <RegenerateModal
            isOpen={isRegenerateModalOpen}
            onClose={() => setIsRegenerateModalOpen(false)}
            essayId={essay.id}
            onRegenerate={handleRegenerateSave}
          />
        </>
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
