# Agent Onboarding

L1 startup context. Use this after `AGENTS.md` when a new task begins; keep L3 evidence files closed until the task boundary is clear.

## First Reads
- `AGENTS.md`
- `.agent-context/repo-summary.md`
- `.agent-context/context-layers.md`

## Suggested Workflow
- Start from `AGENTS.md`, then read this file and `repo-summary.md` for the repository shape.
- For a concrete task, run `opencode-plusplus plan "<task>" .` or inspect `.agent-context/tasks/<task>/task.md` when a task pack exists.
- Open `key-files.md`, `index/`, `evidence/`, `graphs/`, or `rag/` only for targeted deep analysis.
- Prefer relevant source files and nearby tests over generated summaries before editing.
- Run the detected test/check command after edits when available.

## Detected Commands
- Run: `npm run dev`
- Test: `npm run test`
