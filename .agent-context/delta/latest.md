# Context Delta

Base: main
Impact: high
Recommended: opencode-plusplus evolve . --base main

## What Changed In Repo
| File | Status | Kind | Module |
| --- | --- | --- | --- |
| `README.en.md` | modified | docs | root |
| `README.md` | modified | docs | root |
| `docs/architecture.md` | modified | docs | docs |
| `docs/loop-engineering.md` | modified | docs | docs |
| `docs/loop-engineering.zh-CN.md` | modified | docs | docs |
| `src/cli/index.ts` | modified | source | cli |
| `src/core/cache.ts` | modified | source | core |
| `src/core/context-builder.ts` | modified | source | core |
| `src/core/types.ts` | modified | source | core |
| `test/cache.test.ts` | modified | test | test |

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
- `docs/architecture.md`
- `docs/loop-engineering.md`
- `docs/loop-engineering.zh-CN.md`
- `src/analyzers/javascript.ts`
- `src/analyzers/python.ts`
- `src/analyzers/tree-sitter.ts`
- `src/analyzers/types.ts`
- `src/benchmarks/benchmark.ts`
- `src/cli/index.ts`
- `src/cli/task-args.ts`
- `src/config/defaults.ts`
- `src/config/load-config.ts`
- `src/config/starter-config.ts`
- `src/core/cache.ts`
- `src/core/context-builder.ts`
- `src/core/file-classifier.ts`
- `src/core/freshness.ts`
- `src/core/git.ts`
- `src/core/graph.ts`
- `src/core/indexer.ts`
- `src/core/ranker.ts`
- `src/core/readiness.ts`
- `src/core/scanner.ts`
- `src/core/summarizer.ts`
- `src/core/token-estimator.ts`
- `src/core/token-savings.ts`
- `src/core/types.ts`
- `src/core/validator.ts`
- `src/llm/provider.ts`
- `src/mcp/server.ts`
- `src/outputs/agents-md.ts`
- `src/outputs/architecture.ts`
- `src/outputs/context-delta.ts`
- `src/outputs/context-layers.ts`
- `src/outputs/contract-validator.ts`
- `src/outputs/contracts.ts`
- `src/outputs/dependency-graph.ts`
- `src/outputs/execution-trace.ts`
- `src/outputs/impact.ts`
- `src/outputs/key-files.ts`
- `src/outputs/loop-controller.ts`
- `src/outputs/module-map.ts`
- `src/outputs/onboarding.ts`
- `src/outputs/policy-engine.ts`
- `src/outputs/rag.ts`
- `src/outputs/readiness.ts`
- `src/outputs/repo-summary.ts`
- `src/outputs/task-context.ts`
- `src/outputs/task-harness.ts`
- `src/outputs/task-run.ts`
- `src/outputs/test-selector.ts`
- `src/outputs/token-savings.ts`
- `src/outputs/writer.ts`
- `src/retrievers/index.ts`
- `src/retrievers/ripgrep.ts`
- `src/retrievers/static.ts`
- `test/agents-md.test.ts`
- `test/analyzers.test.ts`
- `test/cache.test.ts`
- `test/context-delta.test.ts`
- `test/contract-validator.test.ts`
- `test/execution-trace.test.ts`
- `test/fixtures.test.ts`
- `test/freshness.test.ts`
- `test/impact.test.ts`
- `test/loop-controller.test.ts`
- `test/policy-engine.test.ts`
- `test/readiness.test.ts`
- `test/retrievers.test.ts`
- `test/snapshot.test.ts`
- `test/task-context.test.ts`
- `test/task-harness.test.ts`
- `test/test-selector.test.ts`
- `test/token-savings.test.ts`
- `test/validator.test.ts`
- `test/writer.test.ts`

## Affected Modules
- `analyzers`
- `benchmarks`
- `cli`
- `config`
- `core`
- `docs`
- `llm`
- `mcp`
- `outputs`
- `retrievers`
- `root`
- `test`

## What Agent Must Re-read
- `README.en.md`
- `README.md`
- `docs/architecture.md`
- `docs/loop-engineering.md`
- `docs/loop-engineering.zh-CN.md`
- `src/analyzers/javascript.ts`
- `src/analyzers/python.ts`
- `src/analyzers/tree-sitter.ts`
- `src/analyzers/types.ts`
- `src/benchmarks/benchmark.ts`
- `src/cli/index.ts`
- `src/cli/task-args.ts`
- `src/config/defaults.ts`
- `src/config/load-config.ts`
- `src/config/starter-config.ts`
- `src/core/cache.ts`
- `src/core/context-builder.ts`
- `src/core/file-classifier.ts`
- `src/core/freshness.ts`
- `src/core/git.ts`
- `src/core/graph.ts`
- `src/core/indexer.ts`
- `src/core/ranker.ts`
- `src/core/readiness.ts`
- `src/core/scanner.ts`
- `src/core/summarizer.ts`
- `src/core/token-estimator.ts`
- `src/core/token-savings.ts`
- `src/core/types.ts`
- `src/core/validator.ts`
- `src/llm/provider.ts`
- `src/mcp/server.ts`
- `src/outputs/agents-md.ts`
- `src/outputs/architecture.ts`
- `src/outputs/context-delta.ts`
- `src/outputs/context-layers.ts`
- `src/outputs/contract-validator.ts`
- `src/outputs/contracts.ts`
- `src/outputs/dependency-graph.ts`
- `src/outputs/execution-trace.ts`
- `src/outputs/impact.ts`
- `src/outputs/key-files.ts`
- `src/outputs/loop-controller.ts`
- `src/outputs/module-map.ts`
- `src/outputs/onboarding.ts`
- `src/outputs/policy-engine.ts`
- `src/outputs/rag.ts`
- `src/outputs/readiness.ts`
- `src/outputs/repo-summary.ts`
- `src/outputs/task-context.ts`
- `src/outputs/task-harness.ts`
- `src/outputs/task-run.ts`
- `src/outputs/test-selector.ts`
- `src/outputs/token-savings.ts`
- `src/outputs/writer.ts`
- `src/retrievers/index.ts`
- `src/retrievers/ripgrep.ts`
- `src/retrievers/static.ts`
- `test/agents-md.test.ts`
- `test/analyzers.test.ts`
- `test/cache.test.ts`
- `test/context-delta.test.ts`
- `test/contract-validator.test.ts`
- `test/execution-trace.test.ts`
- `test/fixtures.test.ts`
- `test/fixtures/monorepo/packages/api/src/index.ts`
- `test/fixtures/monorepo/packages/web/src/index.ts`
- `test/freshness.test.ts`
- `test/impact.test.ts`
- `test/loop-controller.test.ts`
- `test/policy-engine.test.ts`
- `test/readiness.test.ts`
- `test/retrievers.test.ts`
- `test/snapshot.test.ts`
- `test/task-context.test.ts`
- `test/task-harness.test.ts`
- `test/test-selector.test.ts`
- `test/token-savings.test.ts`
- `test/validator.test.ts`
- `test/writer.test.ts`

## Task Packs To Refresh
- `bugfix`
- `feature`
- `refactor`

## Reasons
- 10 changed file(s) detected from git diff/status.
- 78 graph node(s) are adjacent to changed files.
- 12 module(s) may need refreshed summaries or boundaries.
- 13 context output area(s) are marked stale.
