# Agent Handoff Rules

This repository is developed by multiple coding agents. Shared context must live in repository files, not only in session memory.

## Mandatory Handoff Workflow

Before starting any task, read these files in order:

1. `docs/agent-handoff/current-state.md`
2. `docs/agent-handoff/active-task.md`
3. `docs/agent-handoff/decision-log.md`
4. `CLAUDE.md`

If you work inside `KPWritingAssistant-web/`, also read `KPWritingAssistant-web/AGENTS.md`.

## Source Of Truth

- The primary tracked application is `KPWritingAssistant-web/`.
- `apps/` and `packages/` currently contain migration or experiment artifacts unless handoff docs explicitly say otherwise.
- Do not assume `task-v1.2.0.json` drives active work. As of 2026-04-07, all tasks in that file are already marked complete.

## Session Start Requirements

- Confirm the current branch and worktree state with `git status --short --branch`.
- Read `docs/agent-handoff/active-task.md` and either continue that task or explicitly replace it with the new active task before substantial edits.
- If handoff docs do not match the codebase, update the handoff docs first.

## Session End Requirements

Before ending a session, update the handoff docs with:

- What changed
- Which files were touched
- Which commands or tests were run
- What remains
- What the next agent should do first

Record durable architectural or workflow decisions in `docs/agent-handoff/decision-log.md`.
