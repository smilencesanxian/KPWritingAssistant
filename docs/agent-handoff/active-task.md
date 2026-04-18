# 当前任务

最后更新：2026-04-18

## 状态

`in_progress`

## 当前负责方

`claude`

## 目标

根据 `KPWritingAssistant-web/docs/sugession&issues/KP作文宝-功能意见-0414.html` 的 6 条用户反馈 + 1 个新增 API 报错，完成系统整改。

## 问题清单

### Bug 1：重新生成范文报错（最高优先级）

**错误信息**：`Could not find a relationship between 'model_essays' and 'essay_submissions' in the schema cache`

**根因**：`src/lib/db/model-essays.ts:73-79` 中 `getUserPreferenceNotes` 的 Supabase 查询语法错误，`essay_submissions` 在顶层而非嵌套在 `corrections` 下。

**修改文件**：`src/lib/db/model-essays.ts`

---

### Bug 2：编辑范文后保存按钮不可点击

**根因**：`src/components/model-essay/EditEssayModal.tsx:140` 保存按钮 `disabled` 条件包含 `!wordCountMetrics.withinHardLimit`，与 Bug 3（字数统计错误）紧密相关。

**处理**：Bug 3 修复后验证，可能自动解决。

---

### Bug 3 + 功能优化 1：范文字数统计错误 + 不分段 + 标题正文多空行 + 上限收紧

**子问题**：
- 字数统计显示 108 但实际 140+ 词
- 范文不分段，可读性差
- 标题与正文间多空行
- 字数上限需从 130 收紧到 120

**修改文件**：`src/lib/model-essay/format.ts`、`src/lib/model-essay/generation.ts`、`src/app/api/model-essays/[id]/route.ts`、`src/components/correction/ModelEssayView.tsx`、`src/lib/pdf/renderer.ts`

---

### 功能优化 2：批改结果页 UI 调整

**需求**：
1. 删除"上传原图"展示区域
2. 保留 Step 6 条目化展示
3. 删除 Step 6 之后的"改进建议"框

**修改文件**：`src/app/corrections/[id]/page.tsx`

---

### 功能优化 3：知识库按主题分类展示 + 过滤基础类

**需求**：
1. 文章类按主题分组（地点描述、困难事物等）
2. 不显示 `level = 'basic'` 的素材

**前置**：先查询线上数据库 `article` 类型数据的 `topic_tags` 填充情况，再决定分组方案。

**修改文件**：`src/lib/db/recommended-phrases.ts`、`src/components/writing-guide/CategorySection.tsx`

## 任务拆解

| # | 任务 | 优先级 | 依赖 |
|---|------|--------|------|
| 2 | Bug 1: 修复 getUserPreferenceNotes Supabase join 语法 | 最高 | 无 |
| 3 | Bug 3 + 优化1: 字数统计修复 + 上限收紧到 120 | 高 | 无 |
| 4 | 优化2: 批改结果页 UI（去原图/改进建议框） | 中 | 无 |
| 5 | Bug 2: 验证编辑保存按钮 | 中 | #3 |
| 6 | 优化3: 知识库分类 + 过滤基础类 | 中 | 无 |

## 当前执行顺序

按任务编号顺序执行，每个任务独立完成并验证。

## 已完成

- 已分析全部 7 个问题的根因
- 已拆解为 5 个可独立执行的任务
- **Bug 1 已修复**：`getUserPreferenceNotes` 的 Supabase join 语法已修正
  - 将 `essay_submissions!inner` 从顶层移入 `corrections` 的嵌套查询
  - `.eq('corrections.essay_submissions.user_id', userId)` 使用正确的嵌套路径
  - 12 个单元测试全部通过
  - lint 0 error，build 成功
  - 已部署到服务器

## 待验证

- Bug 2 是否在 Bug 3 修复后自动解决
- 知识库 article 类型的 topic_tags 数据填充情况
- Bug 1 修复后在线上真实数据下验证重新生成范文功能

## 下一位 agent 应先做什么

1. 继续 Bug 3 + 优化1（字数统计修复 + 上限收紧到 120）
2. 开始前先调用 test-engineer SubAgent 设计测试用例
3. 按 TDD 流程执行：测试设计 → 实现 → 测试验证
