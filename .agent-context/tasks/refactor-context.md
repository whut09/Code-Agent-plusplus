# Task Context: refactor code safely

Type: refactor
Budget: 11,985 / 12,000 estimated tokens

## Read First
1. `benchmarks/tasks/refactor-config-loader.json` - lexical match: refactor
2. `src/integrations/codegraph.ts` - lexical match: code, direct dependency of test/codegraph.test.ts; defines CodeIntelligenceBackend
3. `src/retrievers/codegraph.ts` - lexical match: code, direct importer of src/integrations/codegraph.ts; defines CodeGraphContextRetriever
4. `code-agent-plusplus.config.example.yml` - lexical match: code
5. `code-agent-plusplus.local.example.yml` - lexical match: code
6. `assets/agent-context-code-layers.png` - lexical match: code
7. `src/cli/index.ts` - lexical match: code, direct importer of src/integrations/codegraph.ts; defines program
8. `src/mcp/server.ts` - lexical match: code, entrypoint; defines codeAgentPlusplusMcpToolNames

## Then Inspect If Needed
- `test/codegraph.test.ts` - lexical match: code, direct importer of src/integrations/codegraph.ts
- `test/test-selector.test.ts` - lexical match: code, shared API/refactor risk
- `test/impact.test.ts` - lexical match: code, shared API/refactor risk
- `test/retrievers.test.ts` - related test, shared API/refactor risk
- `benchmarks/fixtures/small-ts-app/test/api/login.test.ts` - related test
- `benchmarks/fixtures/monorepo/packages/api/test/config.test.ts` - related test
- `benchmarks/fixtures/fastapi-app/tests/test_users.py` - related test
- `benchmarks/fixtures/small-ts-app/test/auth/session.test.ts` - related test
- `benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts` - related test
- `benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx` - related test
- `benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts` - related test
- `test/context-delta.test.ts` - shared API/refactor risk
- `test/contract-validator.test.ts` - shared API/refactor risk
- `test/execution-trace.test.ts` - shared API/refactor risk
- `test/freshness.test.ts` - shared API/refactor risk
- `test/hallucination-guard.test.ts` - shared API/refactor risk

## Why These Files
| File | Category | Tokens | Why | Summary |
| --- | --- | --- | --- | --- |
| `benchmarks/tasks/refactor-config-loader.json` | direct-source | 38 | lexical match: refactor | benchmarks/tasks/refactor-config-loader.json is a unknown file written as JSON. |
| `src/integrations/codegraph.ts` | direct-source | 294 | lexical match: code, direct dependency of test/codegraph.test.ts, direct dependency of src/retrievers/codegraph.ts, shared API/refactor risk | src/integrations/codegraph.ts contains 59 detected symbols, 5 imports, 11 exports. |
| `src/retrievers/codegraph.ts` | direct-source | 69 | lexical match: code, direct importer of src/integrations/codegraph.ts, shared API/refactor risk | src/retrievers/codegraph.ts contains 3 detected symbols, 6 imports, 1 export. |
| `code-agent-plusplus.config.example.yml` | direct-source | 35 | lexical match: code | code-agent-plusplus.config.example.yml is a unknown file written as YAML. |
| `code-agent-plusplus.local.example.yml` | direct-source | 34 | lexical match: code | code-agent-plusplus.local.example.yml is a unknown file written as YAML. |
| `assets/agent-context-code-layers.png` | direct-source | 38 | lexical match: code | assets/agent-context-code-layers.png is a asset file. |
| `src/cli/index.ts` | entrypoint | 315 | lexical match: code, direct importer of src/integrations/codegraph.ts, entrypoint, shared API/refactor risk | src/cli/index.ts contains 104 detected symbols, 33 imports, 0 exports. |
| `src/mcp/server.ts` | entrypoint | 339 | lexical match: code, entrypoint, shared API/refactor risk | src/mcp/server.ts contains 81 detected symbols, 18 imports, 4 exports. |
| `test/codegraph.test.ts` | test | 62 | lexical match: code, direct importer of src/integrations/codegraph.ts, related test, shared API/refactor risk | test/codegraph.test.ts contains 8 detected symbols, 7 imports, 0 exports. |
| `test/test-selector.test.ts` | test | 89 | lexical match: code, shared API/refactor risk | test/test-selector.test.ts contains 16 detected symbols, 8 imports, 0 exports. |
| `test/impact.test.ts` | test | 62 | lexical match: code, shared API/refactor risk | test/impact.test.ts contains 7 detected symbols, 8 imports, 0 exports. |
| `test/retrievers.test.ts` | test | 88 | related test, shared API/refactor risk | test/retrievers.test.ts contains 19 detected symbols, 7 imports, 0 exports. |
| `benchmarks/fixtures/small-ts-app/test/api/login.test.ts` | test | 63 | related test | benchmarks/fixtures/small-ts-app/test/api/login.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/monorepo/packages/api/test/config.test.ts` | test | 66 | related test | benchmarks/fixtures/monorepo/packages/api/test/config.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/fastapi-app/tests/test_users.py` | test | 72 | related test | benchmarks/fixtures/fastapi-app/tests/test_users.py contains 1 detected Python symbol and 1 import. |
| `benchmarks/fixtures/small-ts-app/test/auth/session.test.ts` | test | 60 | related test | benchmarks/fixtures/small-ts-app/test/auth/session.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts` | test | 61 | related test | benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx` | test | 64 | related test | benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts` | test | 63 | related test | benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `test/context-delta.test.ts` | test | 85 | shared API/refactor risk | test/context-delta.test.ts contains 14 detected symbols, 10 imports, 0 exports. |
| `test/contract-validator.test.ts` | test | 81 | shared API/refactor risk | test/contract-validator.test.ts contains 12 detected symbols, 10 imports, 0 exports. |
| `test/execution-trace.test.ts` | test | 84 | shared API/refactor risk | test/execution-trace.test.ts contains 18 detected symbols, 9 imports, 0 exports. |
| `test/freshness.test.ts` | test | 77 | shared API/refactor risk | test/freshness.test.ts contains 13 detected symbols, 9 imports, 0 exports. |
| `test/hallucination-guard.test.ts` | test | 89 | shared API/refactor risk | test/hallucination-guard.test.ts contains 14 detected symbols, 11 imports, 0 exports. |
| `test/loop-controller.test.ts` | test | 115 | shared API/refactor risk | test/loop-controller.test.ts contains 27 detected symbols, 10 imports, 0 exports. |
| `test/orchestrator.test.ts` | test | 96 | shared API/refactor risk | test/orchestrator.test.ts contains 22 detected symbols, 8 imports, 0 exports. |
| `test/policy-engine.test.ts` | test | 142 | shared API/refactor risk | test/policy-engine.test.ts contains 38 detected symbols, 10 imports, 0 exports. |
| `test/regression-guard.test.ts` | test | 86 | shared API/refactor risk | test/regression-guard.test.ts contains 14 detected symbols, 12 imports, 0 exports. |
| `test/task-harness.test.ts` | test | 84 | shared API/refactor risk | test/task-harness.test.ts contains 18 detected symbols, 9 imports, 0 exports. |
| `test/agents-md.test.ts` | test | 62 | shared API/refactor risk | test/agents-md.test.ts contains 9 detected symbols, 7 imports, 0 exports. |
| `test/config.test.ts` | test | 59 | shared API/refactor risk | test/config.test.ts contains 9 detected symbols, 7 imports, 0 exports. |
| `test/mcp.test.ts` | test | 78 | shared API/refactor risk | test/mcp.test.ts contains 15 detected symbols, 7 imports, 0 exports. |
| `test/writer.test.ts` | test | 99 | shared API/refactor risk | test/writer.test.ts contains 23 detected symbols, 7 imports, 0 exports. |
| `test/analyzers.test.ts` | test | 63 | shared API/refactor risk | test/analyzers.test.ts contains 9 detected symbols, 6 imports, 0 exports. |
| `test/cache.test.ts` | test | 73 | shared API/refactor risk | test/cache.test.ts contains 10 detected symbols, 6 imports, 0 exports. |
| `test/agent-events.test.ts` | test | 60 | shared API/refactor risk | test/agent-events.test.ts contains 7 detected symbols, 6 imports, 0 exports. |
| `test/task-context.test.ts` | test | 59 | shared API/refactor risk | test/task-context.test.ts contains 6 detected symbols, 7 imports, 0 exports. |
| `test/fixtures.test.ts` | test | 60 | shared API/refactor risk | test/fixtures.test.ts contains 8 detected symbols, 4 imports, 0 exports. |
| `test/token-savings.test.ts` | test | 66 | shared API/refactor risk | test/token-savings.test.ts contains 9 detected symbols, 4 imports, 0 exports. |
| `test/readiness.test.ts` | test | 59 | shared API/refactor risk | test/readiness.test.ts contains 7 detected symbols, 4 imports, 0 exports. |
| `test/validator.test.ts` | test | 51 | shared API/refactor risk | test/validator.test.ts contains 3 detected symbols, 8 imports, 0 exports. |
| `test/scanner.test.ts` | test | 47 | shared API/refactor risk | test/scanner.test.ts contains 2 detected symbols, 7 imports, 0 exports. |
| `test/snapshot.test.ts` | test | 51 | shared API/refactor risk | test/snapshot.test.ts contains 3 detected symbols, 4 imports, 0 exports. |
| `test/agent-benchmark.test.ts` | test | 53 | shared API/refactor risk | test/agent-benchmark.test.ts contains 2 detected symbols, 4 imports, 0 exports. |
| `test/benchmark.test.ts` | test | 50 | shared API/refactor risk | test/benchmark.test.ts contains 2 detected symbols, 4 imports, 0 exports. |
| `src/core/types.ts` | dependency-neighbor | 300 | lexical match: code, direct dependency of src/integrations/codegraph.ts, direct dependency of src/retrievers/codegraph.ts, shared API/refactor risk | src/core/types.ts contains 35 detected symbols, 0 imports, 35 exports. |
| `src/outputs/impact.ts` | dependency-neighbor | 260 | lexical match: code, direct importer of src/integrations/codegraph.ts, shared API/refactor risk | src/outputs/impact.ts contains 52 detected symbols, 4 imports, 4 exports. |
| `src/outputs/test-selector.ts` | dependency-neighbor | 249 | lexical match: code, direct importer of src/integrations/codegraph.ts, shared API/refactor risk | src/outputs/test-selector.ts contains 50 detected symbols, 4 imports, 4 exports. |
| `src/outputs/markdown.ts` | dependency-neighbor | 68 | lexical match: code, shared API/refactor risk | src/outputs/markdown.ts contains 8 detected symbols, 0 imports, 5 exports. |
| `src/outputs/agent-events.ts` | dependency-neighbor | 293 | lexical match: code, shared API/refactor risk | src/outputs/agent-events.ts contains 70 detected symbols, 3 imports, 6 exports. |
| `src/retrievers/index.ts` | dependency-neighbor | 100 | lexical match: code, direct importer of src/retrievers/codegraph.ts, shared API/refactor risk | src/retrievers/index.ts contains 5 detected symbols, 8 imports, 6 exports. |
| `src/outputs/execution-trace.ts` | dependency-neighbor | 330 | lexical match: code, shared API/refactor risk | src/outputs/execution-trace.ts contains 49 detected symbols, 6 imports, 19 exports. |
| `src/outputs/orchestrator.ts` | dependency-neighbor | 522 | lexical match: code, shared API/refactor risk | src/outputs/orchestrator.ts contains 112 detected symbols, 18 imports, 11 exports. |
| `src/core/token-estimator.ts` | dependency-neighbor | 132 | lexical match: code, shared API/refactor risk | src/core/token-estimator.ts contains 15 detected symbols, 3 imports, 7 exports. |
| `src/outputs/context-delta.ts` | dependency-neighbor | 304 | lexical match: code, shared API/refactor risk | src/outputs/context-delta.ts contains 66 detected symbols, 5 imports, 9 exports. |
| `src/retrievers/types.ts` | dependency-neighbor | 79 | direct dependency of src/integrations/codegraph.ts, direct dependency of src/retrievers/codegraph.ts, shared API/refactor risk | src/retrievers/types.ts contains 4 detected symbols, 0 imports, 4 exports. |
| `src/core/context-builder.ts` | dependency-neighbor | 106 | direct dependency of test/codegraph.test.ts, shared API/refactor risk | src/core/context-builder.ts contains 15 detected symbols, 11 imports, 2 exports. |
| `src/core/safe-command.ts` | dependency-neighbor | 158 | direct dependency of src/integrations/codegraph.ts, shared API/refactor risk | src/core/safe-command.ts contains 26 detected symbols, 1 import, 5 exports. |
| `src/retrievers/static.ts` | dependency-neighbor | 128 | direct dependency of src/retrievers/codegraph.ts, shared API/refactor risk | src/retrievers/static.ts contains 23 detected symbols, 3 imports, 6 exports. |
| `src/retrievers/ripgrep.ts` | dependency-neighbor | 89 | direct dependency of src/retrievers/codegraph.ts, shared API/refactor risk | src/retrievers/ripgrep.ts contains 14 detected symbols, 5 imports, 1 export. |
| `src/retrievers/hybrid.ts` | dependency-neighbor | 66 | direct dependency of src/retrievers/codegraph.ts | src/retrievers/hybrid.ts contains 4 detected symbols, 2 imports, 1 export. |
| `src/core/freshness.ts` | dependency-neighbor | 290 | shared API/refactor risk | src/core/freshness.ts contains 57 detected symbols, 8 imports, 9 exports. |
| `src/outputs/loop-controller.ts` | dependency-neighbor | 302 | shared API/refactor risk | src/outputs/loop-controller.ts contains 60 detected symbols, 13 imports, 10 exports. |
| `src/outputs/policy-engine.ts` | dependency-neighbor | 271 | shared API/refactor risk | src/outputs/policy-engine.ts contains 48 detected symbols, 11 imports, 9 exports. |
| `src/outputs/task-harness.ts` | dependency-neighbor | 280 | shared API/refactor risk | src/outputs/task-harness.ts contains 68 detected symbols, 8 imports, 5 exports. |
| `src/outputs/regression-guard.ts` | dependency-neighbor | 297 | shared API/refactor risk | src/outputs/regression-guard.ts contains 61 detected symbols, 7 imports, 8 exports. |
| `src/outputs/contract-validator.ts` | dependency-neighbor | 327 | shared API/refactor risk | src/outputs/contract-validator.ts contains 65 detected symbols, 6 imports, 5 exports. |
| `src/outputs/hallucination-guard.ts` | dependency-neighbor | 467 | shared API/refactor risk | src/outputs/hallucination-guard.ts contains 106 detected symbols, 6 imports, 8 exports. |
| `src/outputs/task-run.ts` | dependency-neighbor | 203 | shared API/refactor risk | src/outputs/task-run.ts contains 43 detected symbols, 11 imports, 4 exports. |
| `src/benchmarks/benchmark.ts` | dependency-neighbor | 452 | shared API/refactor risk | src/benchmarks/benchmark.ts contains 90 detected symbols, 7 imports, 11 exports. |
| `src/outputs/writer.ts` | dependency-neighbor | 246 | shared API/refactor risk | src/outputs/writer.ts contains 55 detected symbols, 19 imports, 2 exports. |
| `src/benchmarks/agent-benchmark.ts` | dependency-neighbor | 364 | shared API/refactor risk | src/benchmarks/agent-benchmark.ts contains 71 detected symbols, 17 imports, 9 exports. |
| `src/outputs/task-context.ts` | dependency-neighbor | 260 | shared API/refactor risk | src/outputs/task-context.ts contains 67 detected symbols, 4 imports, 3 exports. |
| `src/outputs/runtime-state.ts` | dependency-neighbor | 228 | shared API/refactor risk | src/outputs/runtime-state.ts contains 41 detected symbols, 5 imports, 10 exports. |
| `src/core/path-utils.ts` | dependency-neighbor | 98 | shared API/refactor risk | src/core/path-utils.ts contains 9 detected symbols, 1 import, 5 exports. |
| `src/outputs/evidence.ts` | dependency-neighbor | 224 | shared API/refactor risk | src/outputs/evidence.ts contains 38 detected symbols, 1 import, 8 exports. |
| `src/outputs/rag.ts` | dependency-neighbor | 113 | shared API/refactor risk | src/outputs/rag.ts contains 15 detected symbols, 3 imports, 4 exports. |
| `src/core/cache.ts` | dependency-neighbor | 188 | shared API/refactor risk | src/core/cache.ts contains 34 detected symbols, 5 imports, 4 exports. |
| `src/core/scanner.ts` | dependency-neighbor | 211 | shared API/refactor risk | src/core/scanner.ts contains 52 detected symbols, 9 imports, 1 export. |
| `code-agent-plusplus.config.yml` | config-doc | 38 | lexical match: code, configuration | code-agent-plusplus.config.yml is a config file written as YAML. |
| `benchmarks/fixtures/monorepo/packages/api/README.md` | config-doc | 48 | owning module documentation | benchmarks/fixtures/monorepo/packages/api/README.md is a docs file written as Markdown. |
| `benchmarks/README.md` | config-doc | 28 | owning module documentation | benchmarks/README.md is a docs file written as Markdown. |
| `package.json` | config-doc | 25 | configuration | package.json is a config file written as JSON. |

## Budget Packing
| Bucket | Tokens | Files |
| --- | --- | --- |
| Directly relevant source files | 508 | `benchmarks/tasks/refactor-config-loader.json`, `src/integrations/codegraph.ts`, `src/retrievers/codegraph.ts`, `code-agent-plusplus.config.example.yml`, `code-agent-plusplus.local.example.yml`, `assets/agent-context-code-layers.png` |
| Tests | 2,679 | `test/codegraph.test.ts`, `test/test-selector.test.ts`, `test/impact.test.ts`, `test/retrievers.test.ts`, `benchmarks/fixtures/small-ts-app/test/api/login.test.ts`, `benchmarks/fixtures/monorepo/packages/api/test/config.test.ts`, `benchmarks/fixtures/fastapi-app/tests/test_users.py`, `benchmarks/fixtures/small-ts-app/test/auth/session.test.ts`, `benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts`, `benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx`, `benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts`, `test/context-delta.test.ts`, `test/contract-validator.test.ts`, `test/execution-trace.test.ts`, `test/freshness.test.ts`, `test/hallucination-guard.test.ts`, `test/loop-controller.test.ts`, `test/orchestrator.test.ts`, `test/policy-engine.test.ts`, `test/regression-guard.test.ts`, `test/task-harness.test.ts`, `test/agents-md.test.ts`, `test/config.test.ts`, `test/mcp.test.ts`, `test/writer.test.ts`, `test/analyzers.test.ts`, `test/cache.test.ts`, `test/agent-events.test.ts`, `test/task-context.test.ts`, `test/fixtures.test.ts`, `test/token-savings.test.ts`, `test/readiness.test.ts`, `test/validator.test.ts`, `test/scanner.test.ts`, `test/snapshot.test.ts`, `test/agent-benchmark.test.ts`, `test/benchmark.test.ts` |
| Dependency neighbors | 8,005 | `src/core/types.ts`, `src/outputs/impact.ts`, `src/outputs/test-selector.ts`, `src/outputs/markdown.ts`, `src/outputs/agent-events.ts`, `src/retrievers/index.ts`, `src/outputs/execution-trace.ts`, `src/outputs/orchestrator.ts`, `src/core/token-estimator.ts`, `src/outputs/context-delta.ts`, `src/retrievers/types.ts`, `src/core/context-builder.ts`, `src/core/safe-command.ts`, `src/retrievers/static.ts`, `src/retrievers/ripgrep.ts`, `src/retrievers/hybrid.ts`, `src/core/freshness.ts`, `src/outputs/loop-controller.ts`, `src/outputs/policy-engine.ts`, `src/outputs/task-harness.ts`, `src/outputs/regression-guard.ts`, `src/outputs/contract-validator.ts`, `src/outputs/hallucination-guard.ts`, `src/outputs/task-run.ts`, `src/benchmarks/benchmark.ts`, `src/outputs/writer.ts`, `src/benchmarks/agent-benchmark.ts`, `src/outputs/task-context.ts`, `src/outputs/runtime-state.ts`, `src/core/path-utils.ts`, `src/outputs/evidence.ts`, `src/outputs/rag.ts`, `src/core/cache.ts`, `src/core/scanner.ts` |
| Config/docs | 139 | `code-agent-plusplus.config.yml`, `benchmarks/fixtures/monorepo/packages/api/README.md`, `benchmarks/README.md`, `package.json` |
| Entrypoints | 654 | `src/cli/index.ts`, `src/mcp/server.ts` |

Remaining budget: 15 estimated tokens

## Suggested Commands
- npm run test -- refactor
- npm run build
- npm run lint

## Anti-Regression Notes
- None detected.

## Required Regression Tests
- None detected.

## Suggested Agent Workflow
- Preserve exported APIs and inspect callers before moving code.
- Read `AGENTS.md` and inspect evidence before editing.
- Open the selected files and dependency neighbors.
- Run detected test/check commands after edits.
