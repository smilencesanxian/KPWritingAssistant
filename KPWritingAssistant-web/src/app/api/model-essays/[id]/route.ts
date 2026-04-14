import { createClient } from '@/lib/supabase/server';
import { updateModelEssay } from '@/lib/db/model-essays';
import { type EditHistoryItem } from '@/types/database';
import { getModelEssayWordCount, getModelEssayWordCountLimits } from '@/lib/model-essay/format';
import { NextRequest } from 'next/server';

export async function PUT(
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

  // Verify ownership - check that the model essay belongs to the user
  // through the correction -> submission chain
  const { data: modelEssayData, error: modelEssayError } = await supabase
    .from('model_essays')
    .select(`
      *,
      corrections!inner(
        submission_id,
        essay_submissions!inner(user_id, exam_part, question_type)
      )
    `)
    .eq('id', id)
    .single();

  if (modelEssayError || !modelEssayData) {
    return Response.json({ error: '范文不存在' }, { status: 404 });
  }

  // Verify ownership via submission
  const correctionData = modelEssayData.corrections as {
    submission_id: string;
    essay_submissions: {
      user_id: string;
      exam_part: 'part1' | 'part2' | null;
      question_type: 'q1' | 'q2' | null;
    };
  };
  if (correctionData.essay_submissions.user_id !== user.id) {
    return Response.json({ error: '无权访问此范文' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { user_edited_content, user_preference_notes } = body as {
    user_edited_content?: string;
    user_preference_notes?: string;
  };

  if (user_edited_content === undefined) {
    return Response.json({ error: 'user_edited_content is required' }, { status: 400 });
  }

  try {
    const wordCount = getModelEssayWordCount(
      user_edited_content,
      modelEssayData.corrections?.essay_submissions?.exam_part ?? null,
      modelEssayData.corrections?.essay_submissions?.question_type ?? null
    );
    const limits = getModelEssayWordCountLimits();

    if (!wordCount.withinHardLimit || wordCount.wordCount < 90) {
      return Response.json(
        {
          error: `正文词数需控制在 90-${limits.hardMax} 词之间，当前为 ${wordCount.wordCount} 词`,
        },
        { status: 400 }
      );
    }

    // Record the previously effective essay text, not always the first AI draft.
    const originalContent = (modelEssayData.user_edited_content ?? modelEssayData.content ?? '') as string;

    // Build edit history entry
    const historyEntry: EditHistoryItem = {
      timestamp: new Date().toISOString(),
      original: originalContent,
      edited: user_edited_content,
      note: user_preference_notes,
    };

    // Update the model essay (returns void - no SELECT after UPDATE to avoid RLS issues)
    const updatedEssay = await updateModelEssay(id, {
      user_edited_content,
      is_user_edited: true,
      edit_history: [historyEntry],
      user_preference_notes,
      source_spans: null,
    });

    return Response.json({ model_essay: updatedEssay });
  } catch (error) {
    console.error('Failed to update model essay:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : '更新范文失败' },
      { status: 500 }
    );
  }
}
