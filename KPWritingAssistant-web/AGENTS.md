## 共享交接

在这个应用内进行实质性修改前，先读取以下仓库级 handoff 文件：

1. `../docs/agent-handoff/current-state.md`
2. `../docs/agent-handoff/active-task.md`
3. `../docs/agent-handoff/decision-log.md`

结束会话前，至少更新 `../docs/agent-handoff/active-task.md`。如果本次改动改变了长期有效的项目背景、开发入口或工作流假设，也要同步更新另外两份文件。

交接文档默认使用中文，只有在命令、路径、状态值、代码标识或外部规范要求时才保留英文。

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
