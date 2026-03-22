import { createClient } from '@/lib/supabase/server';
import { getHighlights, addHighlightManually } from '@/lib/db/highlights';
import { NextRequest } from 'next/server';

const VALID_TYPES = ['vocabulary', 'phrase', 'sentence'];

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { text, type } = body as Record<string, unknown>;

  if (!text || typeof text !== 'string' || text.trim() === '') {
    return Response.json({ error: '亮点内容不能为空' }, { status: 400 });
  }

  if (!type || typeof type !== 'string' || !VALID_TYPES.includes(type)) {
    return Response.json({ error: '类型必须是 vocabulary、phrase 或 sentence' }, { status: 400 });
  }

  try {
    const highlight = await addHighlightManually(user.id, text.trim(), type);
    return Response.json({ highlight }, { status: 201 });
  } catch (err) {
    console.error('Failed to add highlight:', err);
    return Response.json({ error: '添加亮点失败，请重试' }, { status: 500 });
  }
}
