# 测试设计报告 - 知识库数据层 (knowledge-base.ts)

## 功能概述

开发知识库数据层 `src/lib/db/knowledge-base.ts`，提供四个核心函数：

1. **getKnowledgeBaseSections** - 获取带用户收藏状态的 sections，支持类别过滤和搜索
2. **collectKbMaterial** - 将 kb_material 收藏到 highlights_library
3. **isKbMaterialCollected** - 检查用户是否已收藏某个 kb_material
4. **tryLinkToKbMaterial** - 通过文本匹配查找对应的 kb_material

---

## 测试分层策略

- **单元测试**：8 个用例 - 覆盖核心函数的业务逻辑、边界条件和错误处理
- **集成测试**：0 个用例 - 数据层函数直接操作数据库，单元测试已覆盖
- **E2E 测试**：0 个用例 - 本任务为纯数据层实现，无 UI 交互

**理由**：
- 数据层函数属于工具性质，无 UI 交互
- 单元测试配合 Supabase Mock 可以完整验证功能
- 相关的 E2E 测试已在 `e2e/knowledge-base.spec.ts` 中覆盖

---

## 测试用例清单

### 单元测试

| 用例ID | 描述 | 输入 | 预期结果 | 优先级 |
|--------|------|------|---------|--------|
| UT-KB-DL-001 | 获取指定 category 的 sections | categorySlug='email', userId='user-001' | 返回 email 类别下的 sections，每个 material 带 is_collected 状态 | 高 |
| UT-KB-DL-002 | 不指定 category 返回全部 sections | categorySlug=undefined, userId='user-001' | 返回所有类别的 sections | 高 |
| UT-KB-DL-003 | 搜索功能匹配 text 字段 | searchQuery='hello', userId='user-001' | 返回包含 'hello' 的 materials（text 字段） | 高 |
| UT-KB-DL-004 | 搜索功能匹配 meaning_zh 字段 | searchQuery='你好', userId='user-001' | 返回中文含义包含 '你好' 的 materials | 高 |
| UT-KB-DL-005 | 搜索功能匹配 sub_category 字段 | searchQuery='opening', userId='user-001' | 返回 sub_category 包含 'opening' 的 materials | 中 |
| UT-KB-DL-006 | 收藏新 kb_material | userId='user-001', materialId='mat-001' | 插入 highlights_library，设置 kb_material_id | 高 |
| UT-KB-DL-007 | 重复收藏检查 | userId='user-001', materialId='mat-001'（已收藏） | 不插入新记录，避免重复 | 高 |
| UT-KB-DL-008 | 文本匹配 kb_material | text='Hello, how are you?' | 返回匹配的 material 对象，否则返回 null | 高 |

### 集成测试

**无需额外的集成测试**，理由：
- 数据层函数直接操作 Supabase
- 单元测试配合 Mock 已可验证 SQL 逻辑
- E2E 测试在 `e2e/knowledge-base.spec.ts` 中已覆盖完整流程

### E2E 测试

**无需 E2E 测试**，理由：
- 本任务为纯数据层实现，无 UI 交互
- 现有 `e2e/knowledge-base.spec.ts` 已覆盖知识库的端到端流程
- 新增数据层函数将在后续功能中使用时通过 E2E 测试验证

---

## 测试实现细节

### Mock 工厂函数

参考项目现有的 Mock 模式（`highlights.kb5.test.ts`），创建 Supabase Mock 工厂：

```typescript
function buildMockSupabase(sections: any[], materials: any[], collected: any[]) {
  let callCount = 0;
  return {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn(() => {
      callCount++;
      // 根据调用顺序返回不同数据
      if (callCount === 1) return Promise.resolve({ data: sections, error: null });
      if (callCount === 2) return Promise.resolve({ data: materials, error: null });
      return Promise.resolve({ data: collected, error: null });
    }),
  };
}
```

### 测试文件结构

```typescript
/**
 * KB Data Layer 单元测试
 *
 * 测试范围：
 * - UT-KB-DL-001: 获取指定 category 的 sections
 * - UT-KB-DL-002: 不指定 category 返回全部 sections
 * - UT-KB-DL-003: 搜索功能匹配 text 字段
 * - UT-KB-DL-004: 搜索功能匹配 meaning_zh 字段
 * - UT-KB-DL-005: 搜索功能匹配 sub_category 字段
 * - UT-KB-DL-006: 收藏新 kb_material
 * - UT-KB-DL-007: 重复收藏检查
 * - UT-KB-DL-008: 文本匹配 kb_material
 */

import { createClient } from '@/lib/supabase/server';
import {
  getKnowledgeBaseSections,
  collectKbMaterial,
  isKbMaterialCollected,
  tryLinkToKbMaterial,
} from './knowledge-base';

jest.mock('@/lib/supabase/server');

// ... 测试用例实现
```

---

## E2E 环境说明

- **无 E2E 测试** - 本任务为纯数据层实现
- **单元测试环境** - 需要 Node.js 环境，Jest 30.2.0 已安装
- **测试依赖** - Mock Supabase 客户端，无需真实数据库连接

---

## 给主 Agent 的建议

### 1. 数据库 schema 依赖

确保以下表已创建（`supabase/migrations/013_kb_tables.sql`）：
- `kb_categories` - 知识库类别表
- `kb_sections` - 知识库章节表
- `kb_materials` - 知识库素材表

### 2. 收藏表依赖

确保 `highlights_library` 表已有 `kb_material_id` 字段（`supabase/migrations/014_kb_highlights_kb_material_id.sql`）。

### 3. Mock 模式一致性

遵循项目现有的 Mock 模式（参考 `highlights.kb5.test.ts`）：
- Mock `@/lib/supabase/server` 而非直接 Mock `supabase-js`
- 使用工厂函数构建 Mock 链
- 通过调用顺序区分多次查询

### 4. 错误处理

确保所有函数都有错误处理：
- 数据库查询失败时抛出明确的错误信息
- `tryLinkToKbMaterial` 找不到匹配时返回 `null` 而非抛出错误

### 5. TypeScript 类型定义

导出以下接口供测试使用：
```typescript
export interface KbSection {
  id: string;
  category_slug: string;
  slug: string;
  label_zh: string;
  label_en: string;
  materials: KbMaterial[];
}

export interface KbMaterial {
  id: string;
  text: string;
  type: 'vocabulary' | 'phrase' | 'sentence';
  meaning_zh?: string;
  sub_category?: string;
  example_sentence?: string;
  is_collected: boolean;
}
```

---

## 测试覆盖率目标

- **最低覆盖率**：80%
- **关键函数**：100%（getKnowledgeBaseSections, collectKbMaterial, isKbMaterialCollected, tryLinkToKbMaterial）

---

## 执行命令

```bash
# 运行单元测试
npm test -- src/lib/db/knowledge-base.test.ts

# 运行测试并查看覆盖率
npm test -- --coverage --collectCoverageFrom='src/lib/db/knowledge-base.ts'
```
