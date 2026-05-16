# 当前任务

最后更新：2026-05-17

## 状态

`idle`

## 当前负责方

`claude`

## 目标

处理用户 2026-05-17 反馈的3类问题：Part1/Part2 效果差异、编辑范文保存体验、AI 批改超时。

## 已完成事项

### 当前批次（2026-05-17）

- [x] **问题1a** Part2 总评（step6）没分条目 → `prompts.json` 的 `part2ExtraGuidance` 末尾追加 `【step6 总评格式要求（必须严格遵守）】`，强制要求 • 分条展示
- [x] **问题1b** Part2 范文字数超标 → `part2SystemPrompt` 加入"必须数词"自查指令，`part2UserPromptTemplate` 字数要求改为"字数硬性要求（不可违反）"
- [x] **问题1c** Part1 字帖有空行 → 移除 `renderer.ts` `wrapTextWithFontMetrics` 中称呼后和落款前的空行 token；同步更新 `renderer.test.ts` 中两个相关测试的断言
- [x] **问题2** 编辑范文保存按钮字数超限时不可点、无提示 → `EditEssayModal.tsx` 移除字数超限对按钮的 `disabled` 条件；字数超限时显示 `⚠️ 字数超过120词上限，建议精简后再保存` 警告；同步更新测试
- [x] **问题3** AI 批改超时 → `llm.ts` 调整技术参数：`max_tokens: 4096→2800`、重试 sleep `3000ms→500ms`、每次 LLM 调用新增 15 秒 AbortSignal 超时控制

### 历史已完成（2026-04-29 批次）

- [x] 知识库例句重复、OCR 乱词、改进建议未分条目、范文有空行、范文保存按钮不可用、字帖段落间空行（6条）
- [x] 防回归测试机制（regression-anchors.test.ts、WORD_COUNT_LIMITS 常量）

## 验证结果

- 单元测试：357 通过，2 失败（`recommended-phrases/collect` 预存 bug，与本次无关）
- Lint：0 错误，15 警告（均为预存 warning）
- Build：成功

## 修改的文件

- `src/config/prompts.json`
- `src/lib/ai/llm.ts`
- `src/lib/pdf/renderer.ts`
- `src/lib/pdf/renderer.test.ts`（更新2个测试断言）
- `src/components/model-essay/EditEssayModal.tsx`
- `src/components/model-essay/EditEssayModal.test.tsx`（更新1个测试断言，新增1个测试）
- `src/lib/ai/prompts.test.ts`（新增2个测试）

## 下一步

下一位 agent 可以直接开始新任务，当前代码库处于干净状态。
