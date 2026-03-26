import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getCopybookById, type CopybookWithCorrectionId } from '@/lib/db/copybooks';
import { getAllTemplates } from '@/lib/pdf/templates';
import CopybookPreview from '@/components/copybook/CopybookPreview';

export const metadata: Metadata = {
  title: 'KP作文宝 - 字帖下载',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

const MODE_LABELS: Record<string, string> = {
  tracing: '临摹模式',
  dictation: '默写模式',
};

const MODE_DESCRIPTIONS: Record<string, string> = {
  tracing: '范文已印在答题线上，请在旁边临摹练习',
  dictation: '范文中的重点词汇已挖空，请根据记忆填空练习',
};

export default async function CopybookPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  let copybook: CopybookWithCorrectionId | null = null;
  try {
    copybook = await getCopybookById(id, user.id);
  } catch {
    notFound();
  }
  if (!copybook) notFound();

  const correctionId = copybook.model_essays?.correction_id ?? null;

  const templates = getAllTemplates();
  const template = templates.find((t) => t.id === copybook.template_id);
  const templateName = template?.name ?? copybook.template_id.toUpperCase();
  const modeLabel = MODE_LABELS[copybook.mode] ?? copybook.mode;
  const modeDescription = MODE_DESCRIPTIONS[copybook.mode] ?? '';

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* PDF Preview */}
      <div>
        <h1 className="text-lg font-bold text-neutral-800 mb-3">字帖预览</h1>
        <CopybookPreview pdfUrl={copybook.pdf_url} />
      </div>

      {/* Template & mode info */}
      <div className="bg-neutral-50 rounded-xl p-4 text-sm text-neutral-600 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400 w-10 shrink-0">模板</span>
          <span className="font-medium text-neutral-700">{templateName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400 w-10 shrink-0">模式</span>
          <span className="font-medium text-neutral-700">{modeLabel}</span>
          <span className="text-xs text-neutral-400">— {modeDescription}</span>
        </div>
      </div>

      {/* Print tip */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-600">
        建议使用 A4 纸打印，按照 PET 标准答题纸格式排版
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-2">
        {copybook.pdf_url && (
          <a
            href={`/api/copybooks/${copybook.id}/download`}
            className="block w-full text-center bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            下载 PDF
          </a>
        )}
        <Link
          href={correctionId ? `/corrections/${correctionId}` : '/history'}
          className="block w-full text-center border border-neutral-200 text-neutral-600 hover:bg-neutral-50 font-medium py-3 rounded-xl transition-colors"
        >
          返回批改结果
        </Link>
      </div>
    </div>
  );
}
