import { renderCopybookPDF } from './renderer';
import { getTemplate, DEFAULT_TEMPLATE_ID } from './templates';
import type { CopybookMode } from '@/types/pdf';

export async function generateCopybookPDF(
  essayText: string,
  templateId: string = DEFAULT_TEMPLATE_ID,
  mode: CopybookMode = 'tracing',
  fontStyle: string = 'hengshui',
  tracingOpacity: number = 30,
  fontSize?: number,
  gapFillWords?: string[],
  examPart?: 'part1' | 'part2' | null,
  questionType?: 'q1' | 'q2' | null
): Promise<Buffer> {
  const template = getTemplate(templateId);
  return renderCopybookPDF(
    essayText,
    template,
    mode,
    fontStyle,
    tracingOpacity,
    fontSize,
    gapFillWords,
    examPart,
    questionType
  );
}
