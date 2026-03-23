import { createClient } from '@/lib/supabase/server';
import { getSubmissionById, updateSubmissionStatus } from '@/lib/db/essays';
import { createCorrection } from '@/lib/db/corrections';
import { createHighlights } from '@/lib/db/highlights';
import { processErrorsFromCorrection } from '@/lib/db/error-points';
import { correctEssay } from '@/lib/ai/llm';
import { checkRateLimit } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!checkRateLimit(`${user.id}:correct`)) {
    return Response.json({ error: '操作太频繁，请稍后再试' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { submission_id } = body as Record<string, unknown>;

  if (!submission_id || typeof submission_id !== 'string') {
    return Response.json({ error: 'submission_id is required' }, { status: 400 });
  }

  // Query submission and verify ownership
  const submission = await getSubmissionById(submission_id, user.id);
  if (!submission) {
    return Response.json({ error: '作文记录不存在或无权访问' }, { status: 403 });
  }

  // Idempotent: if already completed, return existing correction
  if (submission.status === 'completed' && submission.correction) {
    return Response.json({
      correction: submission.correction,
      flagged_errors: [],
    });
  }

  if (!submission.ocr_text) {
    return Response.json({ error: '作文内容不能为空' }, { status: 400 });
  }

  // Mark as processing
  await updateSubmissionStatus(submission_id, 'processing');

  try {
    // Call LLM to correct the essay
    const correctionResult = await correctEssay(submission.ocr_text);

    // Save correction record
    const correction = await createCorrection(submission_id, {
      content_score: correctionResult.scores.content,
      communication_score: correctionResult.scores.communication,
      organization_score: correctionResult.scores.organization,
      language_score: correctionResult.scores.language,
      total_score: correctionResult.scores.total,
      error_annotations: correctionResult.error_annotations,
      overall_comment: correctionResult.overall_comment,
      improvement_suggestions: correctionResult.improvement_suggestions,
    });

    // Save highlights to library
    if (correctionResult.highlights.length > 0) {
      await createHighlights(
        user.id,
        correctionResult.highlights.map((h) => ({ text: h.text, type: h.type })),
        submission_id
      );
    }

    // Process error points and get newly flagged ones
    const flagged_errors = await processErrorsFromCorrection(
      user.id,
      submission_id,
      correctionResult.error_summary,
      correctionResult.error_annotations
    );

    // Mark as completed
    await updateSubmissionStatus(submission_id, 'completed');

    return Response.json({ correction, flagged_errors });
  } catch (err) {
    console.error('Correction failed:', err);
    await updateSubmissionStatus(submission_id, 'failed').catch(() => {});
    return Response.json(
      { error: '批改失败，请稍后重试' },
      { status: 500 }
    );
  }
}
