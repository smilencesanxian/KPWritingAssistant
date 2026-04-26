import { createClient } from '@/lib/supabase/server';
import { getHighlights, addHighlightManually, tryLinkToKnowledgeBase } from '@/lib/db/highlights';
import { NextRequest } from 'next/server';

const VALID_TYPES = ['vocabulary', 'phrase', 'sentence'];
const VALID_ESSAY_TYPES = ['email', 'article', 'story', 'general'];

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') ?? undefined;
  const type = searchParams.get('type') ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));

  try {
    const { highlights, total } = await getHighlights(user.id, { search, type, page, limit });
    return Response.json({ highlights, total });
  } catch (err) {
    console.error('Failed to get highlights:', err);
    return Response.json({ error: '获取亮点列表失败，请重试' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, string | undefined>;
  try {
    body = await request.json() as Record<string, string | undefined>;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { text, type, knowledge_essay_type } = body as Record<string, unknown>;

  // Extract IDs for proper typing
  let recommendedPhraseId: string | undefined;
  let kbMaterialId: string | undefined;

  // Check if kb_material_id was provided (new format)
  if ('kb_material_id' in body && body.kb_material_id) {
    kbMaterialId = body.kb_material_id as string | undefined;
  } else {
    // Check if recommended_phrase_id was provided (old format)
    if ('recommended_phrase_id' in body && body.recommended_phrase_id) {
      recommendedPhraseId = body.recommended_phrase_id as string | undefined;
    }
  }

  // Validate at least one ID is provided
  if (!recommendedPhraseId && !kbMaterialId) {
    return Response.json({ error: '必须提供 recommended_phrase_id 或 kb_material_id' }, { status: 400 });
  }

  if (!text || typeof text !== 'string' || text.trim() === '') {
    return Response.json({ error: '亮点内容不能为空' }, { status: 400 });
  }

  if (!type || typeof type !== 'string' || !VALID_TYPES.includes(type)) {
    return Response.json({ error: '类型必须是 vocabulary、phrase 或 sentence' }, { status: 400 });
  }

  // Validate knowledge_essay_type if provided
  if (knowledge_essay_type !== undefined && knowledge_essay_type !== null) {
    if (typeof knowledge_essay_type !== 'string' || !VALID_ESSAY_TYPES.includes(knowledge_essay_type)) {
      return Response.json(
        { error: `knowledge_essay_type 必须是 ${VALID_ESSAY_TYPES.join('、')} 之一` },
        { status: 400 }
      );
    }
  }

  try {
    // Try to link to knowledge base (pre-link on write)
    const linkResult = await tryLinkToKnowledgeBase(text.trim(), supabase);

    let finalRecommendedPhraseId: string | undefined;
    let finalKbMaterialId: string | undefined;

    if (linkResult) {
      if (linkResult.is_kb_material) {
        finalKbMaterialId = linkResult.id;
      } else {
        finalRecommendedPhraseId = linkResult.id;
      }
    }

    const highlight = await addHighlightManually(user.id, text.trim(), type, {
      knowledge_essay_type: knowledge_essay_type as 'email' | 'article' | 'story' | 'general' | undefined,
      recommended_phrase_id: finalRecommendedPhraseId ?? undefined,
      kb_material_id: finalKbMaterialId ?? undefined,
    });
    return Response.json({ highlight }, { status: 201 });
  } catch (err) {
    console.error('Failed to add highlight:', err);
    return Response.json({ error: '添加亮点失败，请重试' }, { status: 500 });
  }
}
