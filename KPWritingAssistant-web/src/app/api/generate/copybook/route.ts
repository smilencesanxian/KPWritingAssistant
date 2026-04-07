import { createClient } from '@/lib/supabase/server';
import { getCopybookByModelEssayId, createCopybook } from '@/lib/db/copybooks';
import { getHighlights } from '@/lib/db/highlights';
import { generateCopybookPDF } from '@/lib/pdf/copybook';
import { getGapFillWords } from '@/lib/pdf/gap-fill';
import { uploadCopybookPDF } from '@/lib/storage/upload';
import { getAllTemplates, getTemplateByExamPart } from '@/lib/pdf/templates';
import { NextRequest } from 'next/server';
import type { CopybookMode } from '@/types/pdf';
import { generateCopybookFileName } from '@/lib/utils/copybook';
import type { ErrorAnnotation } from '@/types/ai';

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
    template_id,
    mode = 'tracing',
    font_style = 'gochi-hand',
    tracing_opacity = 30,
    font_size,
  } = body as Record<string, unknown>;

  if (!model_essay_id || typeof model_essay_id !== 'string') {
    return Response.json({ error: 'model_essay_id is required' }, { status: 400 });
  }

  // template_id from request is optional; auto-selection based on exam_part happens after DB query
  const requestedTemplateId = typeof template_id === 'string' ? template_id : null;
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

  // Validate requestedTemplateId early if explicitly provided
  const validTemplateIds = getAllTemplates().map((t) => t.id);
  if (requestedTemplateId && !validTemplateIds.includes(requestedTemplateId)) {
    return Response.json({ error: `未知模板: ${requestedTemplateId}` }, { status: 400 });
  }

  // Verify ownership chain: model_essay → correction → submission → user_id
  // Also get exam_part and essay_topic for template auto-selection and filename generation
  const { data: modelEssayData, error: modelEssayError } = await supabase
    .from('model_essays')
    .select('*, corrections!inner(id, essay_submissions!inner(user_id, exam_part, essay_topic))')
    .eq('id', model_essay_id)
    .single();

  if (modelEssayError || !modelEssayData) {
    return Response.json({ error: '范文记录不存在' }, { status: 404 });
  }

  const correction = modelEssayData.corrections as {
    id: string;
    essay_submissions: {
      user_id: string;
      exam_part: string | null;
      essay_topic: string | null;
    };
  };
  if (correction.essay_submissions.user_id !== user.id) {
    return Response.json({ error: '无权访问此范文记录' }, { status: 403 });
  }

  // Auto-select template based on exam_part if not explicitly requested
  const templateId = requestedTemplateId ?? getTemplateByExamPart(correction.essay_submissions.exam_part);

  // Encode opacity into cache key (appended to fontStyle) so different opacities don't share cache
  // v3: bumped to invalidate old PDFs when template auto-selection was introduced
  const cacheKey = copybookMode === 'tracing' ? `v4_${fontStyle}@${tracingOpacity}` : `v4_${fontStyle}`;

  // Cache check: (model_essay_id, template_id, mode, cacheKey)
  const existing = await getCopybookByModelEssayId(model_essay_id, user.id, templateId, copybookMode, cacheKey);
  if (existing) {
    return Response.json({ copybook: existing });
  }

  let pdfBuffer: Buffer;
  try {
    const essayContent = (modelEssayData as { content: string }).content;

    // For dictation mode, fetch highlights and error words to create gap-fill
    let gapFillWords: string[] | undefined;
    if (copybookMode === 'dictation') {
      // Fetch user highlights (vocabulary type)
      const { highlights } = await getHighlights(user.id);

      // Fetch error words from correction
      const { data: correctionData } = await supabase
        .from('corrections')
        .select('error_annotations, correction_steps')
        .eq('id', correction.id)
        .single();

      const errorWords: string[] = [];
      if (correctionData) {
        // Extract error words from error_annotations (legacy format)
        if (correctionData.error_annotations) {
          const annotations = correctionData.error_annotations as ErrorAnnotation[];
          for (const annotation of annotations) {
            if (annotation.original) {
              errorWords.push(annotation.original);
            }
          }
        }
        // Extract error words from correction_steps.step4 (new structured format)
        if (correctionData.correction_steps?.step4) {
          for (const error of correctionData.correction_steps.step4) {
            if (error.original) {
              errorWords.push(error.original);
            }
          }
        }
      }

      // Get gap fill words combining highlights, error words, and high-frequency words
      gapFillWords = getGapFillWords(highlights, errorWords, essayContent);
    }

    pdfBuffer = await generateCopybookPDF(
      essayContent,
      templateId,
      copybookMode,
      fontStyle,
      tracingOpacity,
      fontSize,
      gapFillWords
    );
  } catch (err) {
    console.error('[copybook] PDF generation failed:', err);
    return Response.json({ error: `PDF生成失败: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }

  let pdfStoragePath: string;
  let pdfUrl: string;
  try {
    const tempId = crypto.randomUUID();
    const result = await uploadCopybookPDF(user.id, tempId, pdfBuffer);
    pdfStoragePath = result.path;
    pdfUrl = result.url;
  } catch (err) {
    console.error('[copybook] PDF upload failed:', err);
    return Response.json({ error: `PDF上传失败: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }

  // Generate download filename based on exam_part and essay_topic
  const downloadFileName = generateCopybookFileName(
    correction.essay_submissions.exam_part,
    correction.essay_submissions.essay_topic
  );

  let copybook;
  try {
    copybook = await createCopybook(
      user.id,
      model_essay_id,
      pdfStoragePath,
      pdfUrl,
      cacheKey,
      templateId,
      copybookMode,
      downloadFileName
    );
  } catch (err) {
    console.error('[copybook] DB insert failed:', err);
    return Response.json({ error: `保存字帖记录失败: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }

  return Response.json({ copybook });
}
