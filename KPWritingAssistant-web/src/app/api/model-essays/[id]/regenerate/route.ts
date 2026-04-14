import { createClient } from '@/lib/supabase/server';
import { updateModelEssay, getUserPreferenceNotes } from '@/lib/db/model-essays';
import { getCollectedSystemPhrases } from '@/lib/db/highlights';
import { getRecommendedPhrases } from '@/lib/db/recommended-phrases';
import { regenerateModelEssay } from '@/lib/ai/llm';
import { generateValidatedModelEssay } from '@/lib/model-essay/generation';
import { buildModelEssaySourceSpans } from '@/lib/model-essay/source-spans';
import {
  buildModelEssaySourceBuckets,
  dedupeSourceInputs,
  filterPhrasesByKnowledgeEssayType,
  getKnowledgeEssayType,
} from '@/lib/model-essay/sources';
import { checkRateLimit } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

const MIN_HISTORICAL_HIGHLIGHTS = 3;

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
    // Get user's historical highlights
    const { data: highlightsData, error: highlightsError } = await supabase
      .from('highlights_library')
      .select('id, text, source, source_submission_id, knowledge_essay_type')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (highlightsError) {
      throw new Error(`Failed to get highlight sources: ${highlightsError.message}`);
    }

    const historicalHighlights = dedupeSourceInputs(
      (highlightsData ?? [])
        .filter((row) => row.source_submission_id !== null || (row.source === 'user' && row.knowledge_essay_type === null))
        .map((row) => ({
          id: row.id as string,
          text: row.text as string,
        }))
    );

    const knowledgeEssayType = getKnowledgeEssayType(
      correctionData.essay_submissions.exam_part,
      correctionData.essay_submissions.question_type
    );
    const collectedRows = await getCollectedSystemPhrases(user.id);
    let collectedPhrases = dedupeSourceInputs(
      filterPhrasesByKnowledgeEssayType(collectedRows, knowledgeEssayType).map((row) => ({
        id: row.id,
        text: row.text,
      }))
    );

    if (historicalHighlights.length < MIN_HISTORICAL_HIGHLIGHTS) {
      const fallbackPhrases = await getRecommendedPhrases({
        essayType: knowledgeEssayType,
        limit: 12,
      });
      collectedPhrases = dedupeSourceInputs([
        ...collectedPhrases,
        ...fallbackPhrases.map((phrase) => ({
          id: phrase.id,
          text: phrase.text,
        })),
      ]);
    }

    const historicalKeys = new Set(historicalHighlights.map((item) => item.text.trim().toLowerCase()));
    collectedPhrases = collectedPhrases.filter(
      (item) => !historicalKeys.has(item.text.trim().toLowerCase())
    );
    const sourceBuckets = buildModelEssaySourceBuckets({
      historicalHighlights,
      knowledgeBasePhrases: collectedPhrases,
    });

    // Get user's recent preference notes
    const historyNotes = await getUserPreferenceNotes(user.id, 5);

    // Get original text
    const originalText = correctionData.essay_submissions.ocr_text ?? '';

    // Regenerate model essay (pass exam_part and question_type for part-specific prompts)
    const newContent = await generateValidatedModelEssay(
      (additionalRequirements) => regenerateModelEssay(
        originalText,
        historicalHighlights.map((item) => item.text),
        collectedPhrases.map((item) => item.text),
        `${preference_notes ?? ''}${additionalRequirements ? `\n${additionalRequirements}` : ''}`.trim(),
        historyNotes,
        correctionData.essay_submissions.exam_part,
        correctionData.essay_submissions.question_type
      ),
      correctionData.essay_submissions.exam_part as 'part1' | 'part2' | null,
      correctionData.essay_submissions.question_type as 'q1' | 'q2' | null
    );
    const sourceSpans = buildModelEssaySourceSpans(newContent, sourceBuckets);

    // Update the model essay with new content
    const updatedEssay = await updateModelEssay(id, {
      user_edited_content: newContent,
      is_user_edited: true,
      user_preference_notes: preference_notes,
      source_spans: sourceSpans,
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
