import { createClient } from '@/lib/supabase/server';
import { getCopybookByModelEssayId, createCopybook } from '@/lib/db/copybooks';
import { generateCopybookPDF } from '@/lib/pdf/copybook';
import { uploadCopybookPDF } from '@/lib/storage/upload';
import { getAllTemplates } from '@/lib/pdf/templates';
import { DEFAULT_TEMPLATE_ID } from '@/lib/pdf/templates';
import { NextRequest } from 'next/server';
import type { CopybookMode } from '@/types/pdf';

const VALID_MODES: CopybookMode[] = ['tracing', 'dictation'];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    model_essay_id,
    template_id = DEFAULT_TEMPLATE_ID,
    mode = 'tracing',
    font_style = 'gochi-hand',
    tracing_opacity = 30,
    font_size,
  } = body as Record<string, unknown>;

  if (!model_essay_id || typeof model_essay_id !== 'string') {
    return Response.json({ error: 'model_essay_id is required' }, { status: 400 });
  }

  const templateId = typeof template_id === 'string' ? template_id : DEFAULT_TEMPLATE_ID;
  const copybookMode: CopybookMode = VALID_MODES.includes(mode as CopybookMode)
    ? (mode as CopybookMode)
    : 'tracing';
  const fontStyle = typeof font_style === 'string' ? font_style : 'gochi-hand';
  const tracingOpacity = typeof tracing_opacity === 'number'
    ? Math.max(0, Math.min(100, Math.round(tracing_opacity)))
    : 30;
  // Parse font size if provided
  const fontSize = typeof font_size === 'number'
    ? Math.max(10, Math.min(30, Math.round(font_size)))
    : undefined;

  // Validate template_id against registered templates
  const validTemplateIds = getAllTemplates().map((t) => t.id);
  if (!validTemplateIds.includes(templateId)) {
    return Response.json({ error: `未知模板: ${templateId}` }, { status: 400 });
  }

  // Verify ownership chain: model_essay → correction → submission → user_id
  const { data: modelEssayData, error: modelEssayError } = await supabase
    .from('model_essays')
    .select('*, corrections!inner(id, essay_submissions!inner(user_id))')
    .eq('id', model_essay_id)
    .single();

  if (modelEssayError || !modelEssayData) {
    return Response.json({ error: '范文记录不存在' }, { status: 404 });
  }

  const correction = modelEssayData.corrections as { id: string; essay_submissions: { user_id: string } };
  if (correction.essay_submissions.user_id !== user.id) {
    return Response.json({ error: '无权访问此范文记录' }, { status: 403 });
  }

  // Encode opacity into cache key (appended to fontStyle) so different opacities don't share cache
  const cacheKey = copybookMode === 'tracing' ? `${fontStyle}@${tracingOpacity}` : fontStyle;

  // Cache check: (model_essay_id, template_id, mode, cacheKey)
  const existing = await getCopybookByModelEssayId(model_essay_id, user.id, templateId, copybookMode, cacheKey);
  if (existing) {
    return Response.json({ copybook: existing });
  }

  // Generate PDF buffer
  const essayContent = (modelEssayData as { content: string }).content;
  const pdfBuffer = await generateCopybookPDF(essayContent, templateId, copybookMode, fontStyle, tracingOpacity, fontSize);

  // Upload PDF
  const tempId = crypto.randomUUID();
  const { path: pdfStoragePath, url: pdfUrl } = await uploadCopybookPDF(user.id, tempId, pdfBuffer);

  // Save copybook record
  const copybook = await createCopybook(
    user.id,
    model_essay_id,
    pdfStoragePath,
    pdfUrl,
    cacheKey,
    templateId,
    copybookMode
  );

  return Response.json({ copybook });
}
