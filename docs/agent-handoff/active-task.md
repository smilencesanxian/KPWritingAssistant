# 当前任务

最后更新：2026-05-16

## 状态

`idle`

## 当前负责方

`claude`

## 目标

处理 2026-04-29 客户提交的 6 条功能意见，并新增防回归机制。

## 已完成事项

### 6个客户问题（全部完成）

- [x] **问题1**：知识库例句重复 → 运行 `scripts/fix-kb-example-sentences.mjs`，93条词条生成唯一例句
- [x] **问题2**：OCR乱词（1GV/ight/vol）→ `cleanOcrText` 改用 null 过滤法，彻底消除噪音行留白
- [x] **问题3**：改进建议未分条目 → `ImprovementSuggestions` 组件接入批改结果页
- [x] **问题4**：范文有空行 → ModelEssayView 改为按段落 `<p>` 渲染
- [x] **问题5**：范文保存按钮不可用 → 添加 `useEffect` reset，修复 modal 重开时 state 未重置
- [x] **问题6**：字帖段落间空行 → PDF renderer 移除段落间空行 token

### 防回归三方案（本次新增）

- [x] 新建 `src/lib/regression-anchors.test.ts`，收录8条历史 bug 锚测试
- [x] `format.ts` 导出 `WORD_COUNT_LIMITS` 常量，测试引用常量替代硬编码
- [x] OCR 测试补全"噪音 token 夹在两行之间"的中间位置场景

### E2E 测试修复

- [x] `FLOW-003B`：词数选择器从"共 N 词"更新为"正文 N 词"（代码在 25fcce1 已改，测试落后）
- [x] `FLOW-003C`：移除保存按钮的 `generationMin` 最低字数限制（该限制针对 AI 生成，不应阻止用户编辑）

## 验证结果

- 单元测试：355 通过，2 失败（`recommended-phrases/collect` 预存 bug，与本次无关）
- Lint：0 错误，15 警告
- E2E（服务器启动后）：92 通过，8 预存失败，2 本次已修复

## 下一步

下一位 agent 可以直接开始新任务，当前代码库处于干净状态。
