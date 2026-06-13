<!-- generated-by: repo-to-agent-context -->
<!-- generated-file: .agent-context/AGENTS.generated.md -->

# Generated Agent Guide

L0 operating rules. Keep this file loaded by default; load deeper context only when the task requires it.

## Must-Read Rules
- Inspect relevant source files before behavior-changing edits; generated summaries are not a source-of-truth replacement.
- Before finishing, run the relevant detected checks: `npm run build`, `npm run check`, `npm run lint`, `npm run format`, `npm run format:check`, `npm run prepublishOnly`, `npm run test`.
- Do not commit secrets, local config, dependency folders, or generated build output such as `repo-context.local.yml`, API keys, `node_modules/`, `dist/`, or coverage artifacts.
- Preserve existing project conventions and command patterns unless the source code clearly requires a change.

## Default Workflow
- Read `AGENTS.md` only before the task is concrete.
- For a concrete task, run `repo-context run "<task>" .` or inspect `.agent-context/runs/<task-id>/` when a task run exists.
- Do not load the full `.agent-context/` directory unless L1/L2 context is insufficient.
- Prefer source files over generated summaries for behavior, API, and test decisions.

## Project Entrypoints
- Entrypoint: `src/cli/index.ts`
- Entrypoint: `src/mcp/server.ts`
- Anchor: `src/core/freshness.ts` - 9 exports, 57 symbols
- Anchor: `src/outputs/task-harness.ts` - 5 exports, 67 symbols
- Anchor: `src/outputs/contract-validator.ts` - 5 exports, 65 symbols

## Commands
- Run: `npm run dev`
- Typecheck: `npm run build`
- Typecheck: `npm run check`
- Lint: `npm run lint`
- Lint: `npm run format`
- Lint: `npm run format:check`
- Lint: `npm run prepublishOnly`
- Test: `npm run test`

## Context Layers
- `L0 AGENTS.md` - always-loaded operating rules only
- `L1 .agent-context/repo-summary.md` - compact repository overview for task start
- `L1 .agent-context/onboarding.md` - first-read workflow and commands
- `L1 .agent-context/context-layers.md` - layer map for all generated outputs
- `L2 .agent-context/runs/` - complete task runs generated for concrete work
- `L2 .agent-context/tasks/` - standalone task packs generated or prebuilt for concrete work
- `L3 .agent-context/key-files.md` - ranked evidence index; load only when needed
- `L3 .agent-context/index/` - symbols, files, modules, and chunks for targeted lookup
- `L3 .agent-context/evidence/` - analyzer evidence for deeper inspection
- `L3 .agent-context/module-map.md` - module responsibilities after task scope is known
- `L3 .agent-context/architecture.md` - architecture notes and evidence
- `L3 .agent-context/dependency-graph.md` - file and module dependency graph
- `L3 .agent-context/graphs/` - Mermaid and JSON graph artifacts
- `L3 .agent-context/readiness.md` - agent-readiness gaps and evidence
- `L3 .agent-context/rag/` - RAG-ready export documents

## Harness Runtime Files
- `.agent-context/contracts/` - machine-checkable edit, command, test, and safety boundaries
- `.agent-context/runs/` - complete task run contexts with plan, pack, tests, impact, verify, and prompts
- `.agent-context/loops/` - loop controller decisions when written with `repo-context loop "<task>" . --write`
- `.agent-context/traces/` - execution trace records for agent edits, tests, verification, final state, and manual/command/CI evidence
- `.agent-context/delta/` - context delta and files the agent should re-read after repository changes

## Before Closing
- Prefer `repo-context trace run <trace-id> . --action run-test --command "<test-command>"` over manual test claims when recording verification.
- Prefer `repo-context policy . --base main --trace <trace-id>` when a trace exists.
- Run `repo-context verify --diff .` and `repo-context loop "<task>" . --phase after-edit` before final review.
- Check `repo-context freshness .` and `repo-context drift .` if generated context may be stale.
