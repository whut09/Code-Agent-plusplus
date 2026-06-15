<!-- generated-by: code-agent-plusplus -->
<!-- generated-file: .agent-context/AGENTS.generated.md -->

# Generated Agent Guide

L0 operating rules. Keep this file loaded by default; load deeper context only when the task requires it.

## Must-Read Rules
- Inspect relevant source files before behavior-changing edits; generated summaries are not a source-of-truth replacement.
- Before finishing, run the relevant detected checks: `npm run build`, `npm run check`, `npm run lint`, `npm run format`, `npm run format:check`, `npm run prepublishOnly`, `npm run test`.
- Do not commit secrets, local config, dependency folders, or generated build output such as `code-agent-plusplus.local.yml`, API keys, `node_modules/`, `dist/`, or coverage artifacts.
- Preserve existing project conventions and command patterns unless the source code clearly requires a change.

## Default Workflow
- Read `AGENTS.md` only before the task is concrete.
- Agent-led handoff: run `code-agent-plusplus run "<task>" .` or inspect `.agent-context/runs/<task-id>/`; this writes context and boundaries but does not execute an agent.
- Harness-led executor flow: run `code-agent-plusplus orchestrate "<task>" . --executor mock|opencode|mimocode --executor-command "<command with {prompt}>" --max-loops 3 --checkpoint git-worktree` when Code Agent++ should own multi-loop gates.
- Do not load the full `.agent-context/` directory unless L1/L2 context is insufficient.
- Prefer source files over generated summaries for behavior, API, and test decisions.

## Project Entrypoints
- Entrypoint: `src/cli/index.ts`
- Entrypoint: `src/mcp/server.ts`
- Anchor: `src/core/freshness.ts` - 9 exports, 57 symbols
- Anchor: `src/outputs/policy-engine.ts` - 9 exports, 47 symbols
- Anchor: `src/outputs/task-harness.ts` - 5 exports, 67 symbols

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
- `.agent-context/loops/` - loop controller decisions when written with `code-agent-plusplus loop "<task>" . --write`
- `.agent-context/traces/` - execution trace records for agent edits, tests, verification, final state, and manual/command/CI evidence
- `.agent-context/hallucination/` - deterministic missing file, command, dependency, config, and symbol findings
- `.agent-context/delta/` - context delta and files the agent should re-read after repository changes

## Before Closing
- Prefer `code-agent-plusplus trace run <trace-id> . --action run-test --command "<test-command>"` over manual test claims when recording verification.
- Run `code-agent-plusplus hallucination . --trace <trace-id> --base main` when the task has an execution trace.
- Prefer `code-agent-plusplus policy . --base main --trace <trace-id> --fail-on required` when a trace exists.
- Run `code-agent-plusplus verify --diff .` and `code-agent-plusplus loop "<task>" . --phase after-edit` before final review.
- Check `code-agent-plusplus freshness .` and `code-agent-plusplus drift .` if generated context may be stale.
