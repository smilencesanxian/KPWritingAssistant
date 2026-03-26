import type { CopybookTemplate } from '@/types/pdf';
import { petTemplate, petPart2Template } from './pet';

const TEMPLATE_REGISTRY: Record<string, CopybookTemplate> = {
  pet: petTemplate,
  'pet-part2': petPart2Template,
};

export const DEFAULT_TEMPLATE_ID = 'pet';

export function getTemplate(id: string): CopybookTemplate {
  return TEMPLATE_REGISTRY[id] ?? TEMPLATE_REGISTRY[DEFAULT_TEMPLATE_ID];
}

export function getAllTemplates(): CopybookTemplate[] {
  return Object.values(TEMPLATE_REGISTRY);
}

/** Auto-select the correct template based on exam_part */
export function getTemplateByExamPart(examPart: string | null | undefined): string {
  if (examPart === 'part2') return 'pet-part2';
  return DEFAULT_TEMPLATE_ID;
}
