import { createClient } from '@/lib/supabase/server';
import { updateModelEssay, getUserPreferenceNotes } from '@/lib/db/model-essays';
import { regenerateModelEssay } from '@/lib/ai/llm';
import { checkRateLimit } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit check
  if (!checkRateLimit(`${user.id}:regenerate-model-essay`)) {
    return Response.json({ error: '操作太频繁，请稍后再试' }, { status: 429 });
  }

  // Get request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { preference_notes } = body as { preference_notes?: string };

  // Verify ownership and get model essay data
  const { data: modelEssayData, error: modelEssayError } = await supabase
    .from('model_essays')
    .select(`
      *,
      corrections!inner(
        submission_id,
        essay_submissions!inner(user_id, ocr_text, exam_part, question_type)
      )
    `)
    .eq('id', id)
    .single();

  if (modelEssayError || !modelEssayData) {
    return Response.json({ error: '范文不存在' }, { status: 404 });
  }

  // Verify ownership
  const correctionData = modelEssayData.corrections as {
    submission_id: string;
    essay_submissions: {
      user_id: string;
      ocr_text: string;
      exam_part: string | null;
      question_type: string | null;
    };
  };
  if (correctionData.essay_submissions.user_id !== user.id) {
    return Response.json({ error: '无权访问此范文' }, { status: 403 });
  }

  try {
    // Get user's highlights for this submission
    const { data: highlightsData } = await supabase
      .from('highlights_library')
      .select('text')
      .eq('user_id', user.id)
      .eq('source_submission_id', correctionData.submission_id);

    const highlightTexts = (highlightsData ?? []).map((h) => h.text as string);

    // Get user's recent preference notes
    const historyNotes = await getUserPreferenceNotes(user.id, 5);

    // Get original text
    const originalText = correctionData.essay_submissions.ocr_text ?? '';

    // Regenerate model essay (pass exam_part and question_type for part-specific prompts)
    const newContent = await regenerateModelEssay(
      originalText,
      highlightTexts,
      preference_notes ?? '',
      historyNotes,
      correctionData.essay_submissions.exam_part,
      correctionData.essay_submissions.question_type
    );

    // Update the model essay with new content
    const updatedEssay = await updateModelEssay(id, {
      user_edited_content: newContent,
      is_user_edited: true,
      user_preference_notes: preference_notes,
    });

    return Response.json({ model_essay: updatedEssay });
  } catch (error) {
    console.error('Failed to regenerate model essay:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : '重新生成范文失败' },
      { status: 500 }
    );
  }
}
