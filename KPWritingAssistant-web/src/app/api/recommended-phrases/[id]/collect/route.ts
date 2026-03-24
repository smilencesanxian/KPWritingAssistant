import { createClient } from '@/lib/supabase/server';
import { collectPhrase, isCollected } from '@/lib/db/recommended-phrases';
import { getRecommendedPhrases } from '@/lib/db/recommended-phrases';
import { NextRequest } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: phraseId } = await params;

  if (!phraseId) {
    return Response.json({ error: 'Phrase ID is required' }, { status: 400 });
  }

  try {
    // Check if phrase exists
    const phrases = await getRecommendedPhrases({});
    const phrase = phrases.find(p => p.id === phraseId);

    if (!phrase) {
      return Response.json({ error: 'Recommended phrase not found' }, { status: 404 });
    }

    // Check if already collected (idempotency)
    const alreadyCollected = await isCollected(user.id, phraseId);

    // Collect the phrase
    const highlight = await collectPhrase({
      userId: user.id,
      phraseId,
      text: phrase.text,
      type: phrase.type,
    });

    // Return 200 if already collected, 201 if newly created
    const status = alreadyCollected ? 200 : 201;
    return Response.json({ highlight }, { status });
  } catch (err) {
    console.error('Failed to collect phrase:', err);
    return Response.json({ error: '收藏失败，请重试' }, { status: 500 });
  }
}
