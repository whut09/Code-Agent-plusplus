# Context Delta

Base: main
Impact: high
Recommended: repo-context evolve . --base main

## What Changed In Repo
| File | Status | Kind | Module |
| --- | --- | --- | --- |
| `README.en.md` | modified | docs | root |
| `README.md` | modified | docs | root |
| `README.zh-CN.md` | modified | docs | root |
| `src/cli/index.ts` | modified | source | cli |
| `src/outputs/context-delta.ts` | added | source | outputs |
| `test/context-delta.test.ts` | added | test | test |

## What Context Must Update
- `.agent-context/AGENTS.generated.md`
- `.agent-context/architecture.md`
- `.agent-context/context-layers.md`
- `.agent-context/contracts/architecture.contract.json`
- `.agent-context/contracts/module-boundaries.json`
- `.agent-context/contracts/test.contract.json`
- `.agent-context/dependency-graph.md`
- `.agent-context/graphs/dependencies.json`
- `.agent-context/graphs/dependencies.mmd`
- `.agent-context/index/chunks.json`
- `.agent-context/index/files.json`
- `.agent-context/index/modules.json`
- `.agent-context/index/symbols.json`
- `.agent-context/key-files.md`
- `.agent-context/manifest.json`
- `.agent-context/module-map.md`
- `.agent-context/onboarding.md`
- `.agent-context/rag/README.md`
- `.agent-context/rag/documents.jsonl`
- `.agent-context/rag/manifest.json`
- `.agent-context/readiness.json`
- `.agent-context/readiness.md`
- `.agent-context/repo-summary.md`
- `.agent-context/tasks/bugfix-context.md`
- `.agent-context/tasks/feature-context.md`
- `.agent-context/tasks/refactor-context.md`
- `.agent-context/token-savings.json`
- `.agent-context/token-savings.md`
- `AGENTS.md`

## Affected Graph Nodes
- `README.en.md`
- `README.md`
- `README.zh-CN.md`
- `src/benchmarks/benchmark.ts`
- `src/cli/index.ts`
- `src/cli/task-args.ts`
- `src/config/starter-config.ts`
- `src/core/context-builder.ts`
- `src/core/freshness.ts`
- `src/core/git.ts`
- `src/core/readiness.ts`
- `src/core/token-estimator.ts`
- `src/core/token-savings.ts`
- `src/core/types.ts`
- `src/core/validator.ts`
- `src/outputs/context-delta.ts`
- `src/outputs/contract-validator.ts`
- `src/outputs/dependency-graph.ts`
- `src/outputs/execution-trace.ts`
- `src/outputs/impact.ts`
- `src/outputs/loop-controller.ts`
- `src/outputs/markdown.ts`
- `src/outputs/policy-engine.ts`
- `src/outputs/rag.ts`
- `src/outputs/task-context.ts`
- `src/outputs/task-harness.ts`
- `src/outputs/task-run.ts`
- `src/outputs/test-selector.ts`
- `src/outputs/writer.ts`
- `src/retrievers/index.ts`
- `test/context-delta.test.ts`

## Affected Modules
- `benchmarks`
- `cli`
- `config`
- `core`
- `outputs`
- `retrievers`
- `root`
- `test`

## What Agent Must Re-read
- `README.en.md`
- `README.md`
- `README.zh-CN.md`
- `src/benchmarks/benchmark.ts`
- `src/cli/index.ts`
- `src/cli/task-args.ts`
- `src/config/starter-config.ts`
- `src/core/context-builder.ts`
- `src/core/freshness.ts`
- `src/core/git.ts`
- `src/core/readiness.ts`
- `src/core/token-estimator.ts`
- `src/core/token-savings.ts`
- `src/core/types.ts`
- `src/core/validator.ts`
- `src/mcp/server.ts`
- `src/outputs/context-delta.ts`
- `src/outputs/contract-validator.ts`
- `src/outputs/dependency-graph.ts`
- `src/outputs/execution-trace.ts`
- `src/outputs/impact.ts`
- `src/outputs/loop-controller.ts`
- `src/outputs/markdown.ts`
- `src/outputs/policy-engine.ts`
- `src/outputs/rag.ts`
- `src/outputs/task-context.ts`
- `src/outputs/task-harness.ts`
- `src/outputs/task-run.ts`
- `src/outputs/test-selector.ts`
- `src/outputs/writer.ts`
- `src/retrievers/index.ts`
- `test/context-delta.test.ts`
- `test/fixtures/monorepo/packages/api/src/index.ts`
- `test/fixtures/monorepo/packages/web/src/index.ts`

## Task Packs To Refresh
- `bugfix`
- `feature`
- `refactor`

## Reasons
- 6 changed file(s) detected from git diff/status.
- 31 graph node(s) are adjacent to changed files.
- 8 module(s) may need refreshed summaries or boundaries.
- 13 context output area(s) are marked stale.
