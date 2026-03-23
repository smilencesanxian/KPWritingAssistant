import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCorrectionById, getModelEssaysByCorrectionId } from '@/lib/db/corrections';
import { getSubmissionById } from '@/lib/db/essays';
import { getHighlightsBySubmissionId } from '@/lib/db/highlights';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import AnnotatedEssay from '@/components/correction/AnnotatedEssay';
import HighlightsList from '@/components/correction/HighlightsList';
import ModelEssayView from '@/components/correction/ModelEssayView';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ flagged_id?: string; flagged_label?: string }>;
}

export default async function CorrectionPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { flagged_id, flagged_label } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  let correction;
  try {
    correction = await getCorrectionById(id);
  } catch {
    notFound();
  }
  if (!correction) notFound();

  let submission;
  try {
    submission = await getSubmissionById(correction.submission_id, user.id);
  } catch {
    notFound();
  }
  if (!submission) notFound();

  const [highlights, modelEssays] = await Promise.all([
    getHighlightsBySubmissionId(correction.submission_id).catch(() => []),
    getModelEssaysByCorrectionId(id).catch(() => []),
  ]);

  const {
    total_score,
    content_score,
    communication_score,
    organization_score,
    language_score,
    overall_comment,
    improvement_suggestions,
    error_annotations,
  } = correction;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Flagged errors banner */}
      {flagged_id && flagged_label && (
        <Link href={`/error-points/${flagged_id}`}>
          <div className="bg-orange-50 border border-orange-300 rounded-xl p-3 flex items-center gap-2 cursor-pointer hover:bg-orange-100 transition-colors">
            <svg
              className="w-4 h-4 text-orange-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
            <span className="text-orange-700 text-sm font-medium">
              检测到新易错点：{flagged_label}，点击查看
            </span>
          </div>
        </Link>
      )}

      {/* Score section */}
      <Card>
        <div className="text-center mb-5">
          <div className="text-5xl font-bold text-primary-600">
            {total_score ?? '--'}
            <span className="text-lg font-normal text-neutral-500 ml-1">分</span>
          </div>
          <div className="text-sm text-neutral-400 mt-1">满分20分</div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <div className="text-xs text-neutral-500 mb-1.5">内容</div>
            <Badge color="blue">{content_score ?? '--'} 分</Badge>
          </div>
          <div className="text-center">
            <div className="text-xs text-neutral-500 mb-1.5">沟通</div>
            <Badge color="green">{communication_score ?? '--'} 分</Badge>
          </div>
          <div className="text-center">
            <div className="text-xs text-neutral-500 mb-1.5">组织</div>
            <Badge color="purple">{organization_score ?? '--'} 分</Badge>
          </div>
          <div className="text-center">
            <div className="text-xs text-neutral-500 mb-1.5">语言</div>
            <Badge color="orange">{language_score ?? '--'} 分</Badge>
          </div>
        </div>
      </Card>

      {/* Overall comment */}
      {overall_comment && (
        <Card>
          <h3 className="text-sm font-semibold text-neutral-700 mb-2">总体评语</h3>
          <p className="text-sm text-neutral-600 leading-relaxed">{overall_comment}</p>
        </Card>
      )}

      {/* Improvement suggestions */}
      {improvement_suggestions && (
        <Card>
          <h3 className="text-sm font-semibold text-neutral-700 mb-2">改进建议</h3>
          <p className="text-sm text-neutral-600 leading-relaxed">{improvement_suggestions}</p>
        </Card>
      )}

      {/* Annotated essay */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-700 mb-2">原文批注</h3>
        <AnnotatedEssay
          text={submission.ocr_text ?? ''}
          annotations={error_annotations ?? []}
        />
        {error_annotations && error_annotations.length > 0 && (
          <p className="text-xs text-neutral-400 mt-2 text-center">
            点击红色标注查看详细说明
          </p>
        )}
      </div>

      {/* Highlights */}
      <HighlightsList highlights={highlights} />

      {/* Model essay section */}
      <ModelEssayView correctionId={id} initialEssays={modelEssays} />
    </div>
  );
}
