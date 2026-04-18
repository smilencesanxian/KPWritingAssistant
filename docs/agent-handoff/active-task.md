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
- **Bug 3 + 优化1 已完成主实现**：
  - `model-essay` 词数硬上限已统一收紧到 `120`（目标 `100-110`，允许 `90-120`）
  - Part2 标题识别已收紧，避免把长首句误判成标题造成词数偏低
  - 生成结果新增结构化归一化，超长单段会自动按句子拆段，修复“范文不分段/可读性差”
  - `format/generation` 与相关测试已更新并通过
- **优化2 已完成**：
  - 批改结果页已删除“上传原图”展示区
  - 已删除 Step 6 后单独“改进建议”框，保留 Step 6 承载总结与建议
- **优化3 已完成主实现**：
  - `article` 知识库优先按 `topic_tags` 主题分组展示
  - 系统 `level='basic'` 条目已过滤，不再展示
  - 主题展示顺序对齐 `PET写作知识库-v2.0.md`
- **自动化回归已补齐**：
  - 新增 `src/components/model-essay/EditEssayModal.test.tsx`，覆盖保存按钮在 `<=120` 与 `>120` 词场景的可点击性
  - 新增 `src/app/api/model-essays/[id]/regenerate/route.test.ts`，覆盖重新生成成功链路和“preference notes relationship 报错”回归
  - 新增 `src/lib/db/recommended-phrases.test.ts`，覆盖 article 按 `topic_tags` 分组、`basic` 过滤与分组回退逻辑
  - `src/app/api/model-essays/[id]/route.test.ts` 已同步适配新词数上限
- **真实链路回归已补齐（2026-04-18 晚）**：
  - 浏览器回归阻塞已解除：本机已存在 `/opt/google/chrome/chrome`（`Google Chrome 147.0.7727.101`），Playwright 可正常启动。
  - `writing-guide` E2E：`4/4` 通过（`e2e/writing-guide.spec.ts`）。
  - `knowledge-base` E2E：`8/8` 通过（`e2e/knowledge-base.spec.ts`）。
  - 本地真实接口验证：`POST /api/model-essays/{id}/regenerate` 返回 `200`，未复现 `schema cache relationship` 报错。
  - 页面真实回归：批改页已确认“上传原图”区与独立“改进建议”卡片均不存在，Step 6 保留；编辑弹窗保存按钮可点击。

## 待验证

- 知识库 article 类型线上 `topic_tags` 的真实填充率与映射命中率（本地连真实数据抽样结果显示 `topicSections=[]`，当前素材大多仍走 `category` 回退）
- 是否需要补一轮数据侧 `topic_tags` 回填（SQL/脚本）以提升 article 主题分组命中率

## 本轮执行命令（2026-04-18）

- `npm test -- --runInBand src/lib/model-essay/format.test.ts src/lib/model-essay/generation.test.ts src/app/api/recommended-phrases/route.test.ts src/app/corrections/[id]/components/CorrectionDetails.test.tsx`
- `npm test -- --runInBand src/components/model-essay/EditEssayModal.test.tsx`
- `npx jest --runInBand "src/app/api/model-essays/\\[id\\]/regenerate/route.test.ts"`
- `npx jest --runInBand src/lib/db/recommended-phrases.test.ts`
- `npm test -- --runInBand`（全量，`33/33` suites 通过）
- `npm test -- --runInBand`（全量，`34/34` suites 通过）
- `npm run lint`（0 error，13 warning）
- `npm run build`（通过）
- `curl -H 'Cookie: x-e2e-user-id=00000000-0000-0000-0000-000000000001' 'http://localhost:3000/api/recommended-phrases?essayType=article&grouped=true'`（200）
- `node -e ...`（统计 grouped 响应：`basicCount=0`，`topicSections=[]`）
- `npm run test:e2e -- e2e/writing-guide.spec.ts`（`4 passed`）
- `npm run test:e2e -- e2e/knowledge-base.spec.ts`（`8 passed`）
- `google-chrome --version`（`Google Chrome 147.0.7727.101`）
- `npx playwright --version`（`Version 1.58.2`）

## 下一位 agent 应先做什么

1. 用真实账号在页面回归“编辑范文→保存”“重新生成范文”“知识库文章分组”三条关键路径，补齐 E2E 证据。
2. 评估并执行 `recommended_phrases.topic_tags` 数据回填（优先 article），让主题分组从“代码可用”提升到“数据可见”。
3. 回填后补一条包含真实数据断言的 E2E/API 回归，更新 `current-state.md` 与 `decision-log.md`。

---

## 2026-04-18 并行任务记录（Harness Engineering 规范升级）

### 状态

`completed`

### 负责人

`codex`

### 目标

学习 `https://github.com/deusyu/harness-engineering` 的核心方法，并把可执行规范落地到当前项目文档，确保后续 agent 统一按 Harness Engineering 流程开发。

### 本次改动文件

- `docs/harness-engineering/development-spec.md`（新增）
- `AGENTS.md`
- `CLAUDE.md`
- `KPWritingAssistant-web/AGENTS.md`
- `docs/agent-handoff/current-state.md`
- `docs/agent-handoff/decision-log.md`
- `docs/agent-handoff/active-task.md`

### 本次执行命令（摘要）

- `git status --short --branch`
- `git log --oneline --decorate -n 10`
- `git -C /tmp/harness-engineering pull --ff-only`
- `sed -n ...`（阅读目标仓库 `README.md`、`AGENTS.md`、`concepts/*.md`）
- `git diff -- ...`（文档变更自检）

### 剩余事项

- 将新规范中的“机械门禁”进一步脚本化（例如统一 npm 脚本或 CI workflow），减少人工遗漏。
- 在后续代码任务中验证该规范是否需要补充例外条款。

### 下一位 agent 应先做什么

1. 新任务开始前先阅读 `docs/harness-engineering/development-spec.md`。
2. 继续当前主线整改任务（Bug 3 + 优化1），并按新规范执行验证与交接。
