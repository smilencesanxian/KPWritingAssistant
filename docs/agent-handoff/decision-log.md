# 决策记录

## 2026-04-07

- 跨 agent 的共享上下文统一存放在 `docs/agent-handoff/`，并作为跨会话连续开发的仓库级事实来源。
- 当前主生产代码库是 `KPWritingAssistant-web/`。
- `apps/` 和 `packages/` 现阶段不是默认开发目标。
- `task-v1.2.0.json` 不再作为默认的当前任务选择来源，因为其中任务都已完成。
- 每次 agent 会话开始前都要读取 `current-state.md`、`active-task.md`、`decision-log.md`，结束前都要更新。
- 后续新增或更新的交接文档默认使用中文，只有在术语、命令、路径、状态枚举值或外部规范需要时才保留英文。
