# 测试设计报告：知识库数据层 (knowledge-base.ts)

## 功能概述
知识库数据层实现了三层数据结构的查询和管理功能：
- Categories (顶层) → Sections (中层) → Materials (底层)
- 支持用户收藏功能，将 materials 关联到 highlights_library
- 支持全文搜索（英文、中文、子分类）
- 支持文本匹配，自动关联 kb_material

---

## 测试分层策略
- **单元测试**: 5 个函数，共 18 个测试用例
  - 覆盖正常流程、边界条件、错误处理、用户收藏状态
- **集成测试**: 不需要（所有函数都是直接的 Supabase 调用）
- **E2E 测试**: 不需要（这是纯数据层，无 UI 组件）

---

## 测试用例清单

### 单元测试

| 用例ID | 描述 | 输入 | 预期结果 | 优先级 |
|--------|------|------|---------|--------|
| UT-KB-001 | 获取所有激活的 sections（无过滤） | 无 | 返回所有 is_active=true 的 sections，按 sort_order 排序 | 高 |
| UT-KB-002 | 按类别过滤 sections | categorySlug='email' | 只返回 category_slug='email' 的 sections | 高 |
| UT-KB-003 | 搜索功能 - 英文文本匹配 | searchQuery='regard' | materials 中包含 'regard' 的项 | 高 |
| UT-KB-004 | 搜索功能 - 中文含义匹配 | searchQuery='问候' | materials 中 meaning_zh 包含 '问候' 的项 | 高 |
| UT-KB-005 | 搜索功能 - 子分类匹配 | searchQuery='openings' | materials 中 sub_category 包含 'openings' 的项 | 中 |
| UT-KB-006 | 用户收藏状态标记 | userId='user-123' | materials 中已收藏的 is_collected=true，有 highlight_id | 高 |
| UT-KB-007 | 无用户 ID 时收藏状态为 false | 不传 userId | 所有 materials 的 is_collected=false | 高 |
| UT-KB-008 | 空搜索条件 | searchQuery='' | 返回所有 materials（不触发搜索） | 中 |
| UT-KB-009 | 无效 categorySlug | categorySlug='invalid' | 返回空数组（无匹配的 sections） | 中 |
| UT-KB-010 | 数据库查询失败（sections） | - | 抛出错误 "Failed to get kb sections" | 高 |
| UT-KB-011 | 数据库查询失败（materials） | - | 抛出错误 "Failed to get kb materials" | 高 |
| UT-KB-012 | 数据库查询失败（highlights） | - | 抛出错误 "Failed to get highlights" | 高 |
| UT-KB-013 | 收藏新 material | input={userId, materialId, text, type} | 插入 highlights_library 并返回 Highlight 对象 | 高 |
| UT-KB-014 | 重复收藏同一 material | 已存在 | 返回已存在的 Highlight，不重复插入 | 高 |
| UT-KB-015 | 收藏失败 | DB 错误 | 抛出错误 "Failed to collect kb material" | 高 |
| UT-KB-016 | 检查 material 是否已收藏 | userId, materialId | 返回 boolean，已收藏=true | 高 |
| UT-KB-017 | 文本匹配 kb_material | text='Dear Sir or Madam' | 返回匹配的 material id 或 null | 高 |
| UT-KB-018 | 空文本或无匹配 | text='' 或无匹配 | 返回 null | 中 |
| UT-KB-019 | 获取所有 categories | 无 | 返回所有 is_active=true 的 categories | 高 |
| UT-KB-020 | 获取 categories 失败 | - | 抛出错误 "Failed to get kb categories" | 高 |

---

## 已创建的测试文件
- `/mnt/d/ClaudeCodes/KPWritingAssistant-github/KPWritingAssistant/KPWritingAssistant-web/src/lib/db/knowledge-base.test.ts`（单元测试，20 个用例）

---

## E2E 环境说明
不需要 E2E 测试，这是纯数据层函数。

---

## 给主 Agent 的建议
1. Mock 模式：使用 jest.mock('@/lib/supabase/server')
2. 测试数据结构需与数据库迁移文件中的类型定义保持一致
3. 搜索功能测试需验证 ilike 的模糊匹配（大小写不敏感）
