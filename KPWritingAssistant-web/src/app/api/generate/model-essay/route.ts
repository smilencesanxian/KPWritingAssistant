import { createClient } from '@/lib/supabase/server';
import { getModelEssayByLevel, createModelEssay } from '@/lib/db/corrections';
import { getHighlights, getCollectedSystemPhrases } from '@/lib/db/highlights';
import { generateModelEssay } from '@/lib/ai/llm';
import { checkRateLimit } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

const VALID_LEVELS = ['pass', 'good', 'excellent'] as const;
type TargetLevel = (typeof VALID_LEVELS)[number];

export async function POST(request: NextRequest) {
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

  // Get highlights for this user to inject into the prompt
  const { highlights } = await getHighlights(user.id, { limit: 50 });
  const highlightTexts = highlights.map((h) => h.text);

  // Get user's collected system phrases and user KB phrases, filtered by essay type
  const allPhrases = await getCollectedSystemPhrases(user.id);
  const isEmail = submissionData.exam_part === 'part1';
  const collectedPhrases = allPhrases
    .filter((p) => {
      const et = p.knowledge_essay_type;
      if (!et) return true;
      if (isEmail) return et === 'email' || et === 'general';
      return et === 'article' || et === 'story' || et === 'general';
    })
    .map((p) => p.text);

  // Generate model essay (pass exam_part and question_type for part-specific prompts)
  const content = await generateModelEssay(
    submissionData.ocr_text,
    highlightTexts,
    level,
    collectedPhrases,
    submissionData.exam_part,
    submissionData.question_type
  );

  // Save model essay
  const model_essay = await createModelEssay(correction_id, level, content);

  return Response.json({ model_essay });
}
