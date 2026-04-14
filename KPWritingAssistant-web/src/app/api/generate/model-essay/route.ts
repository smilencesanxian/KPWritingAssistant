import { createClient } from '@/lib/supabase/server';
import { getModelEssayByLevel, createModelEssay } from '@/lib/db/corrections';
import { getCollectedSystemPhrases, incrementHighlightUsageCount } from '@/lib/db/highlights';
import { getRecommendedPhrases } from '@/lib/db/recommended-phrases';
import { generateModelEssay } from '@/lib/ai/llm';
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

const VALID_LEVELS = ['pass', 'good', 'excellent'] as const;
type TargetLevel = (typeof VALID_LEVELS)[number];
const MIN_HISTORICAL_HIGHLIGHTS = 3;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkRateLimit(`${user.id}:model-essay`)) {
      return Response.json({ error: '操作太频繁，请稍后再试' }, { status: 429 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { correction_id, target_level } = body as Record<string, unknown>;

    if (!correction_id || typeof correction_id !== 'string') {
      return Response.json({ error: 'correction_id is required' }, { status: 400 });
    }

    if (!target_level || !VALID_LEVELS.includes(target_level as TargetLevel)) {
      return Response.json(
        { error: 'target_level must be one of: pass, good, excellent' },
        { status: 400 }
      );
    }

    const level = target_level as TargetLevel;

    // Query correction and verify ownership chain via submission
    const { data: correctionData, error: correctionError } = await supabase
      .from('corrections')
      .select('*, essay_submissions!inner(user_id, ocr_text, exam_part, question_type)')
      .eq('id', correction_id)
      .single();

    if (correctionError || !correctionData) {
      return Response.json({ error: '批改记录不存在' }, { status: 404 });
    }

    // Verify ownership via submission
    const submissionData = correctionData.essay_submissions as {
      user_id: string;
      ocr_text: string;
      exam_part: string | null;
      question_type: string | null;
    };
    if (submissionData.user_id !== user.id) {
      return Response.json({ error: '无权访问此批改记录' }, { status: 403 });
    }

    // Check cache: if model essay already exists at this level, return it
    const existing = await getModelEssayByLevel(correction_id, level);
    if (existing) {
      return Response.json({ model_essay: existing });
    }

    const { data: highlightRows, error: highlightRowsError } = await supabase
      .from('highlights_library')
      .select('id, text, source, source_submission_id, knowledge_essay_type')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (highlightRowsError) {
      throw new Error(`Failed to get highlight sources: ${highlightRowsError.message}`);
    }

    const historicalHighlights = dedupeSourceInputs(
      (highlightRows ?? [])
        .filter((row) => row.source_submission_id !== null || (row.source === 'user' && row.knowledge_essay_type === null))
        .map((row) => ({
          id: row.id as string,
          text: row.text as string,
        }))
    );

    // Get user's collected system phrases and user KB phrases, filtered by essay type
    const allPhrases = await getCollectedSystemPhrases(user.id);
    const knowledgeEssayType = getKnowledgeEssayType(
      submissionData.exam_part,
      submissionData.question_type
    );
    const injectedPhrases = dedupeSourceInputs(
      filterPhrasesByKnowledgeEssayType(allPhrases, knowledgeEssayType).map((phrase) => ({
        id: phrase.id,
        text: phrase.text,
      }))
    );
    const injectedIds = injectedPhrases.map((phrase) => phrase.id);
    let knowledgeBasePhrases = injectedPhrases;

    if (historicalHighlights.length < MIN_HISTORICAL_HIGHLIGHTS) {
      const fallbackPhrases = await getRecommendedPhrases({
        essayType: knowledgeEssayType,
        limit: 12,
      });
      knowledgeBasePhrases = dedupeSourceInputs([
        ...knowledgeBasePhrases,
        ...fallbackPhrases.map((phrase) => ({
          id: phrase.id,
          text: phrase.text,
        })),
      ]);
    }

    const historicalKeys = new Set(historicalHighlights.map((item) => item.text.trim().toLowerCase()));
    const collectedPhrases = knowledgeBasePhrases.filter(
      (item) => !historicalKeys.has(item.text.trim().toLowerCase())
    );
    const sourceBuckets = buildModelEssaySourceBuckets({
      historicalHighlights,
      knowledgeBasePhrases: collectedPhrases,
    });

    // Generate model essay (pass exam_part and question_type for part-specific prompts)
    const content = await generateValidatedModelEssay(
      (additionalRequirements) => generateModelEssay(
        submissionData.ocr_text,
        historicalHighlights.map((item) => item.text),
        level,
        collectedPhrases.map((item) => item.text),
        submissionData.exam_part,
        submissionData.question_type,
        additionalRequirements
      ),
      submissionData.exam_part as 'part1' | 'part2' | null,
      submissionData.question_type as 'q1' | 'q2' | null
    );
    const sourceSpans = buildModelEssaySourceSpans(content, sourceBuckets);

    // Save model essay
    const model_essay = await createModelEssay(correction_id, level, content, sourceSpans);

    // Increment usage count for injected knowledge phrases (non-blocking)
    if (injectedIds.length > 0) {
      incrementHighlightUsageCount(injectedIds).catch(() => {});
    }

    return Response.json({ model_essay });
  } catch (err) {
    console.error('[model-essay] Unhandled error:', err);
    return Response.json(
      { error: err instanceof Error ? err.message : '生成范文失败，请重试' },
      { status: 500 }
    );
  }
}
