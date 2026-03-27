# 测试设计报告 — KB-5 底部导航改名 + 范文生成注入用户认可知识

## 功能概述

本任务包含三处相互关联的改动：

1. **BottomNav.tsx**：将第4个导航项 label 从"导览"改为"知识库"，替换图标 SVG
2. **highlights.ts** `getCollectedSystemPhrases()`：追加查询 `source='user' AND knowledge_essay_type IS NOT NULL` 条目，与原 `source='system'` 合并返回
3. **generate/model-essay/route.ts**：在注入 Prompt 前，根据 `submissionData.exam_part`（part1=email, part2=article/story）对合并后的 phrases 做类型过滤，只注入匹配的词句
4. **llm.ts** `generateModelEssay()`：确认 `collectedPhrases` 参数已被正确透传（现有实现已正确，无需修改）

---

## 测试分层策略

| 层次 | 用例数 | 覆盖范围 |
|------|--------|---------|
| 单元测试（Jest） | 13 个 | BottomNav 配置断言、getCollectedSystemPhrases 查询合并逻辑、类型过滤纯函数 |
| 集成测试 | 0 个 | 本次改动无新增 API 接口，route 内的过滤逻辑通过单元测试覆盖 |
| E2E 测试 | 0 个 | UI 改动仅为文字和图标替换，无新交互路径；通过浏览器人工确认即可 |
| 构建/Lint | 必须通过 | `npm run build` + `npm run lint` |

---

## 测试用例清单

### 单元测试 — BottomNav 改名

文件：`src/components/layout/BottomNav.kb5.test.tsx`

| 用例ID | 描述 | 断言 | 优先级 |
|--------|------|------|--------|
| UT-KB5-NAV-001 | 第4项 label 为"知识库" | `expectedNavItems[3].label === '知识库'` | 高 |
| UT-KB5-NAV-002 | 第4项 href 仍为 /writing-guide | `expectedNavItems[3].href === '/writing-guide'` | 高 |
| UT-KB5-NAV-003 | 导航项总数仍为 6 | `length === 6` | 中 |
| UT-KB5-NAV-004 | 其他5项 label 不变 | 逐项断言 | 中 |
| UT-KB5-NAV-005 | 知识库项激活逻辑正确 | `isActive('/writing-guide', '/writing-guide') === true` | 中 |

**注意**：现有 `BottomNav.test.tsx` 中硬编码了 `label: '导览'`，改名后这些用例会失败，需要同步更新。

### 单元测试 — getCollectedSystemPhrases 扩展

文件：`src/lib/db/highlights.kb5.test.ts`

| 用例ID | 描述 | 输入 | 预期结果 | 优先级 |
|--------|------|------|---------|--------|
| UT-KB5-001 | 仍返回 source=system 词句 | systemRows=[2条], userKbRows=[] | 含两条 system 词句 | 高 |
| UT-KB5-002 | 追加 source=user+knowledge_essay_type 非 null | systemRows=[1条], userKbRows=[1条] | 两条都在结果中 | 高 |
| UT-KB5-003 | 合并后长度正确 | systemRows=[2条], userKbRows=[1条] | length===3 | 高 |
| UT-KB5-004 | 两类均为空 | 均[] | 返回 [] | 中 |

### 单元测试 — filterPhrasesByEssayType 类型过滤

文件：`src/lib/db/highlights.kb5.test.ts`（describe 块二）

| 用例ID | 描述 | 输入 | 预期结果 | 优先级 |
|--------|------|------|---------|--------|
| UT-KB5-005 | part1 过滤：保留 email+general，排除 story/article | mixedPhrases, 'part1' | 含 email/general，不含 story/article | 高 |
| UT-KB5-006 | part2 过滤：保留 article/story/general，排除 email | mixedPhrases, 'part2' | 不含 email 类词句 | 高 |
| UT-KB5-007 | examPart=null 不过滤，返回全部 | mixedPhrases, null | length===5 | 中 |
| UT-KB5-008 | 空数组输入 | [], 'part1' | [] | 低 |

---

## 已创建的测试文件

- `src/components/layout/BottomNav.kb5.test.tsx`（单元测试，5 个用例）
- `src/lib/db/highlights.kb5.test.ts`（单元测试，8 个用例）

---

## 现有测试文件需同步更新

以下文件中有硬编码"导览"的断言，改名后会失败，**开发时必须同步修改**：

1. `src/components/layout/BottomNav.test.tsx` — 行 29/46/59/60/65/108 引用了 `label: '导览'`，需改为 `'知识库'`
2. `src/components/layout/BottomNav.integration.test.tsx` — 多处 `getByText('导览')` 和 label 配置，需改为 `'知识库'`

---

## E2E 环境说明

本次改动不涉及新用户交互路径，不需要 E2E 测试。建议在浏览器中人工确认：
- 底部导航第4项文字显示"知识库"
- 图标变为书本/灯泡风格的描边 SVG

---

## 给主 Agent 的建议

1. **同步更新旧测试**：修改 `BottomNav.tsx` 的同时，把 `BottomNav.test.tsx` 和 `BottomNav.integration.test.tsx` 里所有 `'导览'` 改为 `'知识库'`，避免旧用例误报失败
2. **过滤逻辑位置**：`filterPhrasesByEssayType` 建议提取为独立的纯函数放在 `src/lib/utils/` 或直接内联在 route.ts，单元测试中已提供参考实现供对照
3. **getCollectedSystemPhrases 需返回携带 knowledge_essay_type 字段**：route.ts 需要根据该字段做类型过滤，因此函数返回类型建议从 `string[]` 改为 `Array<{ text: string; knowledge_essay_type: string | null }>`，route.ts 过滤后再提取 `.text`
4. **llm.ts 无需修改**：`generateModelEssay()` 已正确使用 `collectedPhrases` 参数透传给 `buildModelEssayPrompt()`
