import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCorrectionById, getModelEssaysByCorrectionId } from '@/lib/db/corrections';
import { getSubmissionById } from '@/lib/db/essays';
import ModelEssayView from '@/components/correction/ModelEssayView';
import type { Correction } from '@/types/database';
import ScoreOverview from './components/ScoreOverview';
import CorrectionDetails from './components/CorrectionDetails';
import ImprovementSuggestions from './components/ImprovementSuggestions';

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

  let correction: Correction | null;
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

  const [modelEssays] = await Promise.all([
    getModelEssaysByCorrectionId(id).catch(() => []),
  ]);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
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

      {/* Block 1: Score Overview */}
      <ScoreOverview
        totalScore={correction.total_score}
        scoringComments={correction.scoring_comments}
      />

      {/* Block 2: Correction Details */}
      <CorrectionDetails
        correctionSteps={correction.correction_steps}
      />

      {/* Block 3: Improvement Suggestions */}
      <ImprovementSuggestions
        structuredSuggestions={correction.structured_suggestions}
        fallbackSuggestions={correction.improvement_suggestions}
      />

      {/* Block 4: Model Essay */}
      <section data-testid="model-essay">
        <ModelEssayView
          correctionId={id}
          initialEssays={modelEssays}
          examPart={submission.exam_part}
        />
      </section>
    </div>
  );
}
