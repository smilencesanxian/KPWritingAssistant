# KPWritingAssistang - Project Instructions

## Project Context

一款面向PET备考家庭的“AI写作教练+智能字帖生成器+个性化错题本”，通过批改-积累-练习的闭环，帮助孩子提升写作能力和卷面分。

> Note: Detailed project requirements will be added to task.json as they are defined.

---

## MANDATORY: Agent Workflow

每个新的 agent 会话都必须遵循以下流程：

### Step 0: 先读取共享交接信息

在执行任何操作前，按顺序读取以下文件：

1. `docs/agent-handoff/current-state.md`
2. `docs/agent-handoff/active-task.md`
3. `docs/agent-handoff/decision-log.md`
4. `AGENTS.md`

如果工作发生在 `KPWritingAssistant-web/` 内，还要读取 `KPWritingAssistant-web/AGENTS.md`。

会话结束前，必须更新 handoff 文件。

交接文档、状态记录、决策记录默认使用中文；只有在命令、路径、状态枚举值、代码标识或外部规范要求时才保留英文。

### Step 1: Initialize Environment

```bash
./init.sh
```

This will:
- Install all dependencies
- Start the development server at http://localhost:3000

**DO NOT skip this step.** Ensure the server is running before proceeding.

### Step 2: 选择或确认当前任务

读取 `docs/agent-handoff/active-task.md`，然后执行以下之一：

1. 如果已有进行中的任务，就继续该任务。
2. 如果状态是 `idle`，就先把你接手的明确任务写进去，再开始实质性修改。

`task-v1.2.0.json` 现在主要是历史记录。截止 2026-04-07，其中所有条目都已完成，除非人工明确要求沿用旧流程，否则不要再把它当作默认任务来源。


## 测试驱动开发工作流（TDD - Test Driven Development）

**重要：本项目强制使用测试 SubAgent 保证代码质量。所有开发任务必须遵循以下TDD流程：**

### 标准开发流程

#### 第一步：任务开始前（测试设计）- 强制
在开始任何开发任务前，**必须**先调用测试 Agent 设计测试用例：

```
调用 test-engineer SubAgent，提示内容：
"即将开始开发任务：[任务描述]
请根据以下需求设计测试用例：
[详细需求描述，包括功能点、输入输出、边界条件等]"
```

**要求：**
- 使用 `Agent` 工具，设置 `subagent_type: "test-engineer"`
- 等待测试 Agent 返回测试用例设计报告后，再开始编码
- 测试用例设计报告应包括：测试范围、测试场景、边界情况、预期结果
- **测试设计报告文件必须保存到 `test-design-reports/` 目录**，命名格式：`test-design-reports/test-design-report-task-[任务ID].md`

#### 第二步：功能实现
根据测试用例的要求实现功能：
- 确保代码能满足所有测试场景
- 遵循代码规范和项目结构
- 编写可测试的代码

#### 第三步：任务完成后（测试执行）- 强制
功能实现完成后，**必须**调用测试 Agent 执行测试：

```
调用 test-engineer SubAgent，提示内容：
"开发任务已完成，请执行所有相关测试并报告结果。
涉及的文件：[修改的文件列表]
功能描述：[简要说明实现的功能]"
```

#### 第四步：问题修复循环
如果测试 Agent 报告有失败的测试：
1. 根据报告中的具体问题进行修复
2. 再次调用测试 Agent 重新执行测试
3. 重复直到所有测试通过

#### 第五步：任务完成判定
**只有当测试 Agent 返回 `[PASS]` 结论时，任务才算真正完成。**

---

### 测试执行方式

根据项目情况，测试 SubAgent 可能执行以下测试类型：

1. **单元测试**：使用 Jest/Vitest 测试函数和组件
2. **集成测试**：测试多个模块协作
3. **E2E测试**：使用 Playwright 进行浏览器自动化测试
4. **构建测试**：运行 `npm run build` 验证构建成功
5. **Lint测试**：运行 `npm run lint` 检查代码规范

**项目测试命令：**
```bash
# 运行单元测试
npm test

# 运行特定测试文件
npx jest src/xxx.test.ts

# 生产构建验证
npm run build

# 代码规范检查
npm run lint
```

---

### E2E 测试质量强制标准

**E2E 测试的目的是验证真实业务结果，而不是验证代码不崩溃。**

#### 必须做到

1. **必须断言业务输出，不能只断言 HTTP 状态码**
   - ❌ 错误：`expect(status).not.toBe(500)` → 只要不崩溃就算过
   - ✅ 正确：`expect(wordCount).toBeLessThanOrEqual(150)` → 验证输出符合业务要求

2. **核心功能必须用登录态测试**
   - 使用 `x-e2e-user-id` cookie 模拟登录：`{ name: 'x-e2e-user-id', value: 'user-uuid', domain: 'localhost', path: '/' }`
   - 未登录状态只能用于验证"鉴权拦截"本身是否正确

3. **每次功能变更必须同步更新 E2E 测试**
   - 导航项改变 → 更新 `bottom-nav.spec.ts`
   - 范文字数要求变化 → 更新 `full-flow-real.spec.ts` 中的字数断言
   - 新增核心功能 → 新增对应的业务结果断言

4. **关键业务流程必须有端到端的结果断言**

   | 功能 | 必须断言的内容 |
   |------|--------------|
   | 范文生成 | 词数在合理范围（60-150词） |
   | 保存范文 | API 返回 2xx，无错误提示显示 |
   | 字帖生成 | 返回有效 copybook 对象（有 id 字段） |
   | 底部导航 | 导航项数量与实际项目一致，不含已删除项 |
   | 批改流程 | correction ID 有效，评分/范文区域可见 |

5. **禁止 skip 掉失败的测试来"通过"**
   - 如果功能变更导致测试失败，必须更新测试用例使其与新行为对齐
   - 用 `test.skip()` 只能用于"当前环境缺少测试数据"的条件跳过

#### 测试文件与功能的对应关系

| 文件 | 覆盖的业务功能 |
|------|--------------|
| `full-flow-real.spec.ts` | 完整批改流程 + 范文字数 + 保存范文 |
| `copybook.spec.ts` | 字帖生成结果验证 |
| `bottom-nav.spec.ts` | 导航项数量/路由/高亮（与实际代码保持同步） |
| `knowledge-base.spec.ts` | 知识库功能 |

---

### 人工测试要求（UI相关修改）

对于大幅度页面修改（新建页面、重写组件、修改核心交互），除了SubAgent测试外：
- **必须在浏览器中测试！** 使用 MCP Playwright 工具
- 验证页面能正确加载和渲染
- 验证表单提交、按钮点击等交互功能
- 截图确认 UI 正确显示

---

### TDD检查清单

- [ ] 任务开始前调用 test-engineer SubAgent 设计测试用例
- [ ] 根据测试用例要求实现功能
- [ ] 实现完成后调用 test-engineer SubAgent 执行测试
- [ ] 所有测试通过（获得 `[PASS]` 结论）
- [ ] UI修改在浏览器中验证通过（如适用）
- [ ] `npm run lint` 无错误
- [ ] `npm run build` 构建成功
- [ ] 更新 `docs/agent-handoff/active-task.md`
- [ ] 如需记录长期背景，更新 `docs/agent-handoff/current-state.md` 或 `docs/agent-handoff/decision-log.md`
- [ ] 所有更改在同一个 commit 中提交

### Step 3: Implement the Task

根据测试用例要求实现功能：
- 阅读任务描述和步骤
- 确保代码满足所有测试场景
- 遵循现有代码模式和规范

### Step 4: Execute Tests via SubAgent

**功能实现完成后，必须调用 test-engineer SubAgent 执行测试：**

```
调用 test-engineer SubAgent：
"开发任务已完成，请执行所有相关测试并报告结果。
涉及的文件：[文件列表]
功能描述：[功能说明]"
```

**测试验证清单：**
- [ ] 测试 Agent 返回 `[PASS]` 结论
- [ ] `npm run lint` 无错误
- [ ] `npm run build` 构建成功

### Step 5: Manual Testing (UI Changes)

对于大幅度页面修改（新建页面、重写组件、修改核心交互）：
- **必须在浏览器中测试！** 使用 MCP Playwright 工具
- 验证页面能正确加载和渲染
- 验证表单提交、按钮点击等交互功能
- 截图确认 UI 正确显示

### Step 6: Update Shared Handoff

Before ending the session, update `docs/agent-handoff/active-task.md` with:

- 当前状态
- 改动的文件
- 已执行的命令和结果
- 阻塞项
- 下一位接手 agent 的第一步

If you changed important project context, also update:

- `docs/agent-handoff/current-state.md`
- `docs/agent-handoff/decision-log.md`

`KPWritingAssistant-web/progress.txt` can still be updated when it adds useful project history, but it is no longer enough on its own for cross-agent handoff.

Recommended handoff structure:

```
Status / Owner / Goal / Files In Progress / Verification / Blockers / Next Agent First Step
```

### Step 7: Commit Changes

**IMPORTANT: 所有更改必须在同一个 commit 中提交，并且 handoff 文件要和代码一起更新。**

流程：
1. 更新 handoff 文件
2. 如有必要，更新 `progress.txt` 记录较长的项目历史
3. 一次性提交所有更改：

```bash
git add .
git commit -m "[task description] - completed"
```

**规则:**
- 只有在所有步骤都验证通过后才提交
- handoff 记录必须和代码状态一致
- 只有在明确维护旧任务系统时才更新 `task-v1.2.0.json`
- **同一项工作的代码和 handoff 更新必须在同一个 commit 中提交**

---

## ⚠️ 阻塞处理（Blocking Issues）

**如果任务无法完成测试或需要人工介入，必须遵循以下规则：**

### 需要停止任务并请求人工帮助的情况：

1. **缺少环境配置**：
   - .env.local 需要填写真实的 API 密钥
   - Supabase 项目需要创建和配置
   - 外部服务需要开通账号

2. **外部依赖不可用**：
   - 第三方 API 服务宕机
   - 需要人工授权的 OAuth 流程
   - 需要付费升级的服务

3. **测试无法进行**：
   - 登录/注册功能需要真实用户账号
   - 功能依赖外部系统尚未部署
   - 需要特定硬件环境

### 阻塞时的正确操作：

**DO NOT（禁止）：**
- ❌ 提交 git commit
- ❌ 将 handoff 标记为“已完成”但实际仍阻塞
- ❌ 假装任务已完成

**DO（必须）：**
- ✅ 在 handoff 文件中记录当前进度和阻塞原因
- ✅ 如有需要，再补充到 progress.txt
- ✅ 输出清晰的阻塞信息，说明需要人工做什么
- ✅ 停止任务，等待人工介入

### 阻塞信息格式：

```
🚫 任务阻塞 - 需要人工介入

**当前任务**: [任务名称]

**已完成的工作**:
- [已完成的代码/配置]

**阻塞原因**:
- [具体说明为什么无法继续]

**需要人工帮助**:
1. [具体的步骤 1]
2. [具体的步骤 2]
...

**解除阻塞后**:
- 运行 [命令] 继续任务
```

---

## Project Structure

```
/
├── CLAUDE.md               # This file - workflow instructions
├── task-v1.2.0.json        # Task definitions (source of truth) for v1.2.0
├── progress.txt            # Progress log from each session
├── init.sh                 # Initialization script
├── test-design-reports/    # Test design reports generated by test-engineer SubAgent
└── KPWritingAssistant-web/           # Next.js application
    ├── src/app/            # App Router pages
    ├── src/components/
    └── ...
```

## Commands

```bash
# In hello-nextjs/
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run linter
```

## Coding Conventions

- TypeScript strict mode
- Functional components with hooks
- Tailwind CSS for styling
- Write tests for new features

---

## Key Rules

1. **One task per session** - Focus on completing one task well
2. **Test before marking complete** - All steps must pass
3. **Browser testing for UI changes** - 新建或大幅修改页面必须在浏览器测试
4. **Document in progress.txt** - Help future agents understand your work
5. **One commit per task** - 所有更改（代码、progress.txt、task.json）必须在同一个 commit 中提交
6. **Never remove tasks** - Only flip `passes: false` to `true`
7. **Stop if blocked** - 需要人工介入时，不要提交，输出阻塞信息并停止
8. **处理的问题需要记录** - 处理过的问题需要统一记录到issues.md中，用户提的优化点也可以算作问题，处理新问题时需要先看issues.md中是否已经处理过，如果处理过了，再次出现，则需要举一反三分析原因并给出彻底解决的方案并且落地
