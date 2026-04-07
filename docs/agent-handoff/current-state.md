# Current State

Last updated: 2026-04-07

## Project Snapshot

- Repository root: `/mnt/d/ClaudeCodes/KPWritingAssistant-github/KPWritingAssistant`
- Primary tracked application: `KPWritingAssistant-web/`
- Main stack: Next.js 16.2.0, React 19, TypeScript, Supabase, Jest, Playwright, pdfkit
- Backup checkpoint before handoff setup:
  - Commit: `f3df323`
  - Tag: `backup-before-handoff-20260407-195102`

## Current Reality

- `KPWritingAssistant-web/` is the real production codebase and the default place to continue development.
- `apps/web`, `apps/miniapp`, `packages/api-client`, and `packages/types` should be treated as migration or experiment artifacts unless a future handoff explicitly promotes them.
- `task-v1.2.0.json` is historical tracking only. As of 2026-04-07, all 41 tasks in that file are already marked `passes: true`.

## Verified Baseline

These commands were verified in `KPWritingAssistant-web/` on 2026-04-07:

```bash
npm test -- --runInBand
npm run lint
npm run build
```

Results at that point:

- `npm test -- --runInBand`: 20 suites, 274 tests passed
- `npm run build`: passed
- `npm run lint`: passed with 0 errors and 14 warnings

## Known Risks

- `run-automation.sh` contains a hardcoded API key and should be cleaned up and rotated before the script is relied on.
- Lint is not clean yet; current warnings are mostly unused-variable warnings in tests and a few source files.
- `KPWritingAssistant-web/progress.txt` is useful history, but recent git commits are a more accurate source for the latest implemented changes.

## Start Session Checklist

1. Read this file, `active-task.md`, and `decision-log.md`.
2. Run `git status --short --branch`.
3. Check recent history with `git log --oneline --decorate -n 10`.
4. If developing in the web app, work under `KPWritingAssistant-web/` unless handoff says otherwise.

## End Session Checklist

1. Update `active-task.md`.
2. Update this file if baseline, entry point, or major risks changed.
3. Append durable decisions to `decision-log.md`.
