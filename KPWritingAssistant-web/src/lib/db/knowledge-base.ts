import { createClient } from '@/lib/supabase/server';
import type { KbCategory, KbSection, KbMaterial, KbMaterialWithMeta, KbSectionWithItems, CollectKbMaterialInput } from '@/types/knowledge-base';
import type { Highlight } from '@/types/database';

export async function getKnowledgeBaseSections(
  categorySlug?: string,
  userId?: string,
  searchQuery?: string
): Promise<KbSectionWithItems[]> {
  const supabase = await createClient();

  let sectionsQuery = supabase
    .from('kb_sections')
    .select('id, slug, label_zh, label_en, description, sort_order, is_active, created_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (categorySlug) {
    sectionsQuery = sectionsQuery.eq('category_slug', categorySlug);
  }

  const { data: sections, error: sectionsError } = await sectionsQuery;

  if (sectionsError) {
    throw new Error(`Failed to get kb sections: ${sectionsError.message}`);
  }

  if (!sections || sections.length === 0) {
    return [];
  }

  const sectionIds = sections.map((s) => s.id);

  let materialsQuery = supabase
    .from('kb_materials')
    .select('id, section_id, text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order, is_active, created_at')
    .in('section_id', sectionIds)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (searchQuery) {
    const searchPattern = `%${searchQuery}%`;
    materialsQuery = materialsQuery.or(
      `text.ilike.${searchPattern},meaning_zh.ilike.${searchPattern},sub_category.ilike.${searchPattern}`
    );
  }

  const { data: materials, error: materialsError } = await materialsQuery;

  if (materialsError) {
    throw new Error(`Failed to get kb materials: ${materialsError.message}`);
  }

  const materialsById = new Map<string, KbMaterialWithMeta[]>();
  for (const material of (materials ?? []) as KbMaterial[]) {
    if (!materialsById.has(material.section_id)) {
      materialsById.set(material.section_id, []);
    }
    materialsById.get(material.section_id)!.push({ ...material, is_collected: false, highlight_id: null });
  }

  if (userId) {
    const { data: highlights, error: highlightsError } = await supabase
      .from('highlights_library')
      .select('id, kb_material_id')
      .eq('user_id', userId)
      .not('kb_material_id', 'is', null);

    if (highlightsError) {
      throw new Error(`Failed to get highlights: ${highlightsError.message}`);
    }

    const highlightByMaterialId = new Map<string, { id: string }>();
    for (const hl of (highlights ?? []) as Array<{ id: string; kb_material_id: string }>) {
      if (hl.kb_material_id) {
        highlightByMaterialId.set(hl.kb_material_id, { id: hl.id });
      }
    }

    for (const section of materialsById.values()) {
      for (const material of section) {
        const highlight = highlightByMaterialId.get(material.id);
        if (highlight) {
          material.is_collected = true;
          material.highlight_id = highlight.id;
        }
      }
    }
  }

  return sections.map((section) => ({
    id: section.id,
    slug: section.slug,
    label_zh: section.label_zh,
    label_en: section.label_en,
    description: section.description,
    sort_order: section.sort_order,
    is_active: section.is_active,
    created_at: section.created_at,
    category_slug: section.category_slug,
    materials: materialsById.get(section.id) ?? [],
  }));
}

export async function collectKbMaterial(input: CollectKbMaterialInput): Promise<Highlight> {
  const supabase = await createClient();

  const { data: existing, error: checkError } = await supabase
    .from('highlights_library')
    .select('*')
    .eq('user_id', input.userId)
    .eq('kb_material_id', input.materialId)
    .maybeSingle();

  if (checkError) {
    throw new Error(`Failed to check existing highlight: ${checkError.message}`);
  }

  if (existing) {
    return existing as Highlight;
  }

  const { data, error } = await supabase
    .from('highlights_library')
    .insert({
      user_id: input.userId,
      text: input.text,
      type: input.type,
      source: 'system',
      kb_material_id: input.materialId,
      source_submission_id: null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to collect kb material: ${error.message}`);
  }

  return data as Highlight;
}

export async function isKbMaterialCollected(
  userId: string,
  materialId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('highlights_library')
    .select('id')
    .eq('user_id', userId)
    .eq('kb_material_id', materialId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check if kb material collected: ${error.message}`);
  }

  return !!data;
}

export async function tryLinkToKbMaterial(
  text: string,
  supabaseClient?: Awaited<ReturnType<typeof createClient>>
): Promise<string | null> {
  const supabase = supabaseClient ?? (await createClient());

  const trimmedText = text.trim();
  if (!trimmedText) return null;

  const { data, error } = await supabase
    .from('kb_materials')
    .select('id')
    .ilike('text', trimmedText)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to link to kb material: ${error.message}`);
  }

  return data?.id ?? null;
}

export async function getKbCategories(): Promise<KbCategory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('kb_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to get kb categories: ${error.message}`);
  }

  return (data ?? []) as KbCategory[];
}
