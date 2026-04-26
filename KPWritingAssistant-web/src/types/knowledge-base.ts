// ============================================================
// Knowledge Base v2.0 Types
// Three-level hierarchy: categories -> sections -> materials
// ============================================================

export interface KbCategory {
  id: string;
  slug: 'email' | 'article' | 'story' | 'toolbox';
  label_zh: string;
  label_en: string;
  description: string | null;
  icon: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface KbSection {
  id: string;
  category_slug: string;
  slug: string;
  label_zh: string;
  label_en: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface KbMaterial {
  id: string;
  section_id: string;
  text: string;
  type: 'vocabulary' | 'phrase' | 'sentence';
  meaning_zh: string | null;
  sub_category: string | null;
  example_sentence: string | null;
  example_source: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface KbMaterialWithMeta extends KbMaterial {
  is_collected: boolean;
  highlight_id: string | null;
}

export interface KbSectionWithItems extends KbSection {
  materials: KbMaterialWithMeta[];
}

export const KB_TABS = [
  { slug: 'email', label: '邮件', icon: '✉️' },
  { slug: 'article', label: '文章', icon: '📝' },
  { slug: 'story', label: '故事', icon: '📖' },
  { slug: 'toolbox', label: '素材库', icon: '📚' },
] as const;

export type KbTabSlug = typeof KB_TABS[number]['slug'];

export interface GetKnowledgeBaseOptions {
  categorySlug?: KbTabSlug;
  searchQuery?: string;
}

export interface CollectKbMaterialInput {
  userId: string;
  materialId: string;
  text: string;
  type: 'vocabulary' | 'phrase' | 'sentence';
}
