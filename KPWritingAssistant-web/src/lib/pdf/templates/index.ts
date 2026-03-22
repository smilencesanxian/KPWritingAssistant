import type { CopybookTemplate } from '@/types/pdf';
import { petTemplate } from './pet';

const TEMPLATE_REGISTRY: Record<string, CopybookTemplate> = {
  pet: petTemplate,
};

export const DEFAULT_TEMPLATE_ID = 'pet';

export function getTemplate(id: string): CopybookTemplate {
  return TEMPLATE_REGISTRY[id] ?? TEMPLATE_REGISTRY[DEFAULT_TEMPLATE_ID];
}

export function getAllTemplates(): CopybookTemplate[] {
  return Object.values(TEMPLATE_REGISTRY);
}
