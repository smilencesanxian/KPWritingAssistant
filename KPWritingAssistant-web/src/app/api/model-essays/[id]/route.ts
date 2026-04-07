import { createClient } from '@/lib/supabase/server';
import { updateModelEssay } from '@/lib/db/model-essays';
import { type EditHistoryItem } from '@/types/database';
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
        essay_submissions!inner(user_id)
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
    essay_submissions: { user_id: string };
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
    // Get original content for history
    const originalContent = (modelEssayData.content as string) ?? '';

    // Build edit history entry
    const historyEntry: EditHistoryItem = {
      timestamp: new Date().toISOString(),
      original: originalContent,
      edited: user_edited_content,
      note: user_preference_notes,
    };

    // Update the model essay (returns void - no SELECT after UPDATE to avoid RLS issues)
    await updateModelEssay(id, {
      user_edited_content,
      is_user_edited: true,
      edit_history: [historyEntry],
      user_preference_notes,
    });

    // Construct response from already-fetched data merged with the updates
    const updatedEssay = {
      ...modelEssayData,
      user_edited_content,
      is_user_edited: true,
      user_preference_notes: user_preference_notes ?? modelEssayData.user_preference_notes,
    };

    return Response.json({ model_essay: updatedEssay });
  } catch (error) {
    console.error('Failed to update model essay:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : '更新范文失败' },
      { status: 500 }
    );
  }
}
