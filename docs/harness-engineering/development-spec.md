# Harness Engineering 开发规范（KPWritingAssistant）

最后更新：2026-04-18

## 1. 目标与范围

本规范用于把 Harness Engineering 方法落地到当前仓库，确保多 agent 并行开发时，过程可追踪、结果可验证、质量可持续。

适用范围：
- 仓库根目录及 `KPWritingAssistant-web/` 的全部开发任务
- 功能开发、缺陷修复、重构、文档变更

## 2. 六条强制原则

1. 仓库即事实源：任何决策、计划、约束必须写入仓库文件。
2. 地图而非手册：`AGENTS.md` 保持短入口，详细规范放专用文档。
3. 机械门禁优先：用可执行检查（lint/test/build）替代口头约定。
4. 背压优于催促：门禁未通过时禁止宣称完成。
5. 小步高频交付：优先小改动、短反馈回路、快速修复。
6. 持续熵治理：定期清理漂移、重复、过时文档和坏模式。

## 3. 标准执行流程（必须按序执行）

### Step 0：会话启动

先执行并阅读：

```bash
git status --short --branch
```

必读文件顺序：
1. `docs/agent-handoff/current-state.md`
2. `docs/agent-handoff/active-task.md`
3. `docs/agent-handoff/decision-log.md`
4. `CLAUDE.md`
5. `KPWritingAssistant-web/AGENTS.md`（当任务涉及 web 目录）

### Step 1：任务建档（Repo as System of Record）

开始实质编码前，必须在 `docs/agent-handoff/active-task.md` 体现：
- 当前目标（Goal）
- 负责人（Owner）
- 范围边界（In scope / Out of scope）
- 验证计划（Verification）
- 下一位 agent 的首步动作（Next Agent First Step）

禁止只在聊天中描述计划而不入库。

### Step 2：先验证、后实现（Feedback Loop）

任务执行遵循最小闭环：

1. 写/更新测试（单元、集成、E2E 按任务需要选择）
2. 实现最小改动使测试通过
3. 执行验证门禁（见 Step 3）
4. 若失败则立刻修复并重跑

### Step 3：机械门禁（Backpressure）

除纯文档任务外，提交前至少执行：

```bash
# 在实际开发目录执行（通常为 KPWritingAssistant-web/）
npm run lint
npm test
npm run build
```

门禁规则：
- 任一命令失败 => 任务状态不得标记为完成
- 可接受的 skip 必须有明确原因（例如测试数据缺失）
- 仅“状态码不报错”不算通过，必须断言业务结果

### Step 4：收尾与交接

结束会话前，必须更新：
- `docs/agent-handoff/active-task.md`（本次改动、验证结果、遗留问题、下一步）
- `docs/agent-handoff/decision-log.md`（仅记录长期有效决策）
- `docs/agent-handoff/current-state.md`（若基线事实变化）

## 4. 文档分层（Map, Not Manual）

- 根 `AGENTS.md`：只保留入口、顺序、硬约束（短文档）
- `CLAUDE.md`：详细工作流与质量规则
- `docs/harness-engineering/development-spec.md`（本文件）：Harness 的统一执行标准
- `docs/agent-handoff/*.md`：运行中事实与决策日志

任何新增规范应优先补充到本文件，再在 `AGENTS.md` 增加链接，而不是把入口文档无限加长。

## 5. 熵治理（Garbage Collection）

每周至少一次执行轻量治理任务（可由任意 agent 发起）：

1. 扫描重复实现与过期约定（代码、脚本、文档）
2. 统一规则并删除坏样例来源
3. 补充可执行约束（测试、lint 规则、检查脚本）
4. 在 `decision-log.md` 记录长期决策

判断标准：
- 是否降低后续 agent 的误判概率
- 是否提升“首次修改成功率”
- 是否减少跨文件上下文依赖

## 6. 本项目当前执行约束（2026-04-18 生效）

- 主开发入口仍为 `KPWritingAssistant-web/`
- `apps/` 与 `packages/` 默认视为迁移/实验区
- `task-v1.2.0.json` 默认不作为当前任务源
- 所有跨 agent 共享上下文必须落库到 `docs/agent-handoff/`

