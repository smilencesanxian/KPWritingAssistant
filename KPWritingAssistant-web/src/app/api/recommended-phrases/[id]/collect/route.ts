import { createClient } from '@/lib/supabase/server';
import { collectPhrase, isCollected, getRecommendedPhrases } from '@/lib/db/recommended-phrases';
import { collectKbMaterial, isKbMaterialCollected, getKnowledgeBaseSections } from '@/lib/db/knowledge-base';
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

  const { id: itemId } = await params;

  if (!itemId) {
    return Response.json({ error: 'Item ID is required' }, { status: 400 });
  }

  try {
    // Try to find in recommended_phrases first (backward compatibility)
    const phrases = await getRecommendedPhrases({});
    const phrase = phrases.find(p => p.id === itemId);

    if (phrase) {
      const alreadyCollected = await isCollected(user.id, itemId);
      const highlight = await collectPhrase({
        userId: user.id,
        phraseId: itemId,
        text: phrase.text,
        type: phrase.type,
      });

      const status = alreadyCollected ? 200 : 201;
      return Response.json({ highlight }, { status });
    }

    // Try to find in kb_materials
    const sections = await getKnowledgeBaseSections(undefined, user.id, undefined);
    let material = null;
    for (const section of sections) {
      const found = section.materials.find(m => m.id === itemId);
      if (found) {
        material = found;
        break;
      }
    }

    if (!material) {
      return Response.json({ error: 'Knowledge material not found' }, { status: 404 });
    }

    const alreadyCollected = await isKbMaterialCollected(user.id, itemId);
    const highlight = await collectKbMaterial({
      userId: user.id,
      materialId: itemId,
      text: material.text,
      type: material.type,
    });

    const status = alreadyCollected ? 200 : 201;
    return Response.json({ highlight }, { status });
  } catch (err) {
    console.error('Failed to collect item:', err);
    return Response.json({ error: '收藏失败，请重试' }, { status: 500 });
  }
}
