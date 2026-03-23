import { renderCopybookPDF } from './renderer';
import { getTemplate, DEFAULT_TEMPLATE_ID } from './templates';
import type { CopybookMode } from '@/types/pdf';

export async function generateCopybookPDF(
  essayText: string,
  templateId: string = DEFAULT_TEMPLATE_ID,
  mode: CopybookMode = 'tracing',
  fontStyle: string = 'hengshui',
  tracingOpacity: number = 30,
  fontSize?: number
): Promise<Buffer> {
  const template = getTemplate(templateId);
  return renderCopybookPDF(essayText, template, mode, fontStyle, tracingOpacity, fontSize);
}
