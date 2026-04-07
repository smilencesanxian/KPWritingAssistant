# 交接规则

本仓库会由多个编码代理协作开发。共享上下文必须写入仓库文件，不能只依赖会话记忆。

## 强制交接流程

开始任何任务前，按顺序阅读以下文件：

1. `docs/agent-handoff/current-state.md`
2. `docs/agent-handoff/active-task.md`
3. `docs/agent-handoff/decision-log.md`
4. `CLAUDE.md`

如果工作发生在 `KPWritingAssistant-web/` 内，还要读取 `KPWritingAssistant-web/AGENTS.md`。

## 事实来源

- 当前主开发入口是 `KPWritingAssistant-web/`。
- `apps/` 和 `packages/` 目前默认视为迁移中或实验性产物，除非 handoff 文档明确说明已转正。
- 不要默认把 `task-v1.2.0.json` 当作当前工作的驱动来源。截止 2026-04-07，该文件中的任务都已完成。

## 文档语言

- 交接文档、决策记录、状态说明、实施说明默认使用中文。
- 只有在必须保留原始术语、命令、路径、状态枚举值或外部规范时，才使用英文。

## 会话开始要求

- 先用 `git status --short --branch` 确认当前分支与工作区状态。
- 先读 `docs/agent-handoff/active-task.md`，如果已有进行中的任务就继续；如果没有，就先把你接手的任务写进去，再开始大改。
- 如果 handoff 文档和代码现状不一致，先修正文档，再继续开发。

## 会话结束要求

结束前必须更新 handoff 文档，至少包括：

- 本次改了什么
- 改动了哪些文件
- 跑了哪些命令或测试
- 还剩什么
- 下一位 agent 应该先做什么

长期有效的架构、流程、约束决策，统一记录到 `docs/agent-handoff/decision-log.md`。
