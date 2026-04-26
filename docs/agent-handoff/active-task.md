# 当前任务

最后更新：2026-04-26

## 状态

`completed`

## 当前负责方

`claude`

## 目标

知识库数据模型重建（方案B）已完成：按 HTML v2.0 规范重建知识库，实现三层层级展示（作文类别 → 主题分类 → 素材），解决文章类未按主题分类的问题。

## 已完成的工作

### Phase 1: 数据库迁移 + 种子数据
- ✅ 迁移文件 `013_kb_tables.sql` — kb_categories / kb_sections / kb_materials 三张新表
- ✅ 迁移文件 `014_kb_highlights_kb_material_id.sql` — highlights 扩展列
- ✅ 种子数据文件 `supabase/seed/kb_seed_data.sql` — 4 categories, 19 sections, 141 materials

### Phase 2: 类型定义 + 数据层
- ✅ 类型定义 `src/types/knowledge-base.ts` — KbCategory, KbSection, KbMaterial, KbMaterialWithMeta, KbSectionWithItems, KB_TABS
- ✅ 知识库数据层 `src/lib/db/knowledge-base.ts` — getKnowledgeBaseSections, collectKbMaterial, isKbMaterialCollected, tryLinkToKbMaterial, getKbCategories
- ✅ 修改 highlights.ts — tryLinkToKnowledgeBase 支持 kb_material_id，addHighlightManually 支持 kb_material_id
- ✅ 修改 database.ts — Highlight 接口添加 kb_material_id 字段

### Phase 3: API 层
- ✅ 新建 API `/api/knowledge-base/sections` — GET 查询接口，支持 categorySlug 和 searchQuery 参数
- ✅ 修改收藏 API `/api/recommended-phrases/[id]/collect` — 同时支持 kb_material_id 和 recommended_phrase_id
- ✅ 修改推荐 API `/api/knowledge-base/recommend` — 支持 toolbox 类型

### Phase 4: 前端组件
- ✅ 修改 `KnowledgeItem` 组件 — 使用 KbMaterialWithMeta 类型，显示 meaning_zh、sub_category、可展开 example_sentence
- ✅ 修改 `CategorySection` 组件 — 使用 KbSectionWithItems 类型，显示 description
- ✅ 修改 `KnowledgeBaseContent` 组件 — 切换到新 API，4 个 tabs（+素材库），搜索支持 meaning_zh 和 sub_category

### Phase 5: 验证
- ✅ TypeScript 编译通过
- ✅ npm run build 成功

## 下一步

部署到数据库前需要执行以下命令：
1. 应用数据库迁移：`supabase migration up`（先执行 013，再执行 014）
2. 执行种子数据：`supabase db reset --seed supabase/seed/kb_seed_data.sql`

部署后需要在浏览器中验证：
- 4 个 tabs 正确显示
- 文章类按 7 个主题分组
- 搜索功能正常（英文、中文、子分类）
- 收藏功能正常
- 例句展开功能正常
