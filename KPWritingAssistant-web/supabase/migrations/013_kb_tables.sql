-- ============================================================
-- Migration 013: Knowledge Base v2 Tables
-- Three-level hierarchy: categories -> sections -> materials
-- ============================================================

-- Step 1: kb_categories (Layer 1 - Essay types)
CREATE TABLE IF NOT EXISTS kb_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  label_zh TEXT NOT NULL,
  label_en TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '📚',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kb_categories_slug ON kb_categories (slug);
CREATE INDEX IF NOT EXISTS idx_kb_categories_sort_order ON kb_categories (sort_order);

ALTER TABLE kb_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read kb categories" ON kb_categories FOR SELECT USING (true);

-- Step 2: kb_sections (Layer 2 - Topic/Structure categories)
CREATE TABLE IF NOT EXISTS kb_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_slug TEXT NOT NULL REFERENCES kb_categories(slug) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  label_zh TEXT NOT NULL,
  label_en TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(category_slug, slug)
);

CREATE INDEX IF NOT EXISTS idx_kb_sections_category ON kb_sections (category_slug);
CREATE INDEX IF NOT EXISTS idx_kb_sections_sort_order ON kb_sections (sort_order);
CREATE INDEX IF NOT EXISTS idx_kb_sections_slug ON kb_sections (category_slug, slug);

ALTER TABLE kb_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read kb sections" ON kb_sections FOR SELECT USING (true);

-- Step 3: kb_materials (Layer 3 - Individual knowledge items)
CREATE TABLE IF NOT EXISTS kb_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES kb_sections(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('vocabulary', 'phrase', 'sentence')) DEFAULT 'phrase',
  meaning_zh TEXT,
  sub_category TEXT,
  example_sentence TEXT,
  example_source TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kb_materials_section ON kb_materials (section_id);
CREATE INDEX IF NOT EXISTS idx_kb_materials_text ON kb_materials (text);
CREATE INDEX IF NOT EXISTS idx_kb_materials_sort_order ON kb_materials (sort_order);
CREATE INDEX IF NOT EXISTS idx_kb_materials_active ON kb_materials (is_active);

ALTER TABLE kb_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read kb materials" ON kb_materials FOR SELECT USING (true);
