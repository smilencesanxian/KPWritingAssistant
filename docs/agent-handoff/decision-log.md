# Decision Log

## 2026-04-07

- Shared agent context must be stored in `docs/agent-handoff/` and treated as repository-level source of truth for cross-session continuity.
- The primary production codebase is `KPWritingAssistant-web/`.
- `apps/` and `packages/` are not the default development target at this time.
- `task-v1.2.0.json` should not be treated as the source of active work selection because all tasks are already marked complete.
- Every agent session should read `current-state.md`, `active-task.md`, and `decision-log.md` before work and update them before ending the session.
