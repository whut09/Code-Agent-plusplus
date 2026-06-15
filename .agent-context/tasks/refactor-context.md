# Task Context: refactor code safely

Type: refactor
Budget: 11,987 / 12,000 estimated tokens

## Read First
1. `benchmarks/tasks/refactor-config-loader.json` - lexical match: refactor
2. `code-agent-plusplus.config.example.yml` - lexical match: code
3. `code-agent-plusplus.local.example.yml` - lexical match: code
4. `assets/agent-context-code-layers.png` - lexical match: code
5. `src/core/types.ts` - lexical match: code, shared API/refactor risk; defines AgentTarget
6. `src/outputs/agent-events.ts` - lexical match: code, shared API/refactor risk; defines AgentEvent
7. `src/mcp/server.ts` - lexical match: code, entrypoint; defines codeAgentPlusplusMcpToolNames
8. `src/cli/index.ts` - direct importer of src/core/types.ts, entrypoint; defines program

## Then Inspect If Needed
- `test/mcp.test.ts` - direct importer of src/mcp/server.ts, related test
- `test/agent-events.test.ts` - direct importer of src/outputs/agent-events.ts, related test
- `test/analyzers.test.ts` - direct importer of src/core/types.ts, shared API/refactor risk
- `test/token-savings.test.ts` - direct importer of src/core/types.ts, shared API/refactor risk
- `test/readiness.test.ts` - direct importer of src/core/types.ts, shared API/refactor risk
- `benchmarks/fixtures/small-ts-app/test/api/login.test.ts` - related test
- `benchmarks/fixtures/monorepo/packages/api/test/config.test.ts` - related test
- `benchmarks/fixtures/fastapi-app/tests/test_users.py` - related test
- `benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts` - related test
- `benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx` - related test
- `benchmarks/fixtures/small-ts-app/test/auth/session.test.ts` - related test
- `benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts` - related test
- `test/context-delta.test.ts` - shared API/refactor risk
- `test/contract-validator.test.ts` - shared API/refactor risk
- `test/execution-trace.test.ts` - shared API/refactor risk
- `test/freshness.test.ts` - shared API/refactor risk

## Why These Files
| File | Category | Tokens | Why | Summary |
| --- | --- | --- | --- | --- |
| `benchmarks/tasks/refactor-config-loader.json` | direct-source | 38 | lexical match: refactor | benchmarks/tasks/refactor-config-loader.json is a unknown file written as JSON. |
| `code-agent-plusplus.config.example.yml` | direct-source | 35 | lexical match: code | code-agent-plusplus.config.example.yml is a unknown file written as YAML. |
| `code-agent-plusplus.local.example.yml` | direct-source | 34 | lexical match: code | code-agent-plusplus.local.example.yml is a unknown file written as YAML. |
| `assets/agent-context-code-layers.png` | direct-source | 38 | lexical match: code | assets/agent-context-code-layers.png is a asset file. |
| `src/core/types.ts` | direct-source | 300 | lexical match: code, shared API/refactor risk | src/core/types.ts contains 35 detected symbols, 0 imports, 35 exports. |
| `src/outputs/agent-events.ts` | direct-source | 293 | lexical match: code, shared API/refactor risk | src/outputs/agent-events.ts contains 70 detected symbols, 3 imports, 6 exports. |
| `src/mcp/server.ts` | entrypoint | 339 | lexical match: code, entrypoint, shared API/refactor risk | src/mcp/server.ts contains 81 detected symbols, 18 imports, 4 exports. |
| `src/cli/index.ts` | entrypoint | 295 | direct importer of src/core/types.ts, entrypoint, shared API/refactor risk | src/cli/index.ts contains 96 detected symbols, 29 imports, 0 exports. |
| `test/mcp.test.ts` | test | 78 | direct importer of src/mcp/server.ts, related test, shared API/refactor risk | test/mcp.test.ts contains 15 detected symbols, 7 imports, 0 exports. |
| `test/agent-events.test.ts` | test | 60 | direct importer of src/outputs/agent-events.ts, related test, shared API/refactor risk | test/agent-events.test.ts contains 7 detected symbols, 6 imports, 0 exports. |
| `test/analyzers.test.ts` | test | 63 | direct importer of src/core/types.ts, shared API/refactor risk | test/analyzers.test.ts contains 9 detected symbols, 6 imports, 0 exports. |
| `test/token-savings.test.ts` | test | 66 | direct importer of src/core/types.ts, shared API/refactor risk | test/token-savings.test.ts contains 9 detected symbols, 4 imports, 0 exports. |
| `test/readiness.test.ts` | test | 59 | direct importer of src/core/types.ts, shared API/refactor risk | test/readiness.test.ts contains 7 detected symbols, 4 imports, 0 exports. |
| `benchmarks/fixtures/small-ts-app/test/api/login.test.ts` | test | 63 | related test | benchmarks/fixtures/small-ts-app/test/api/login.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/monorepo/packages/api/test/config.test.ts` | test | 66 | related test | benchmarks/fixtures/monorepo/packages/api/test/config.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/fastapi-app/tests/test_users.py` | test | 72 | related test | benchmarks/fixtures/fastapi-app/tests/test_users.py contains 1 detected Python symbol and 1 import. |
| `benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts` | test | 61 | related test | benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx` | test | 64 | related test | benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/small-ts-app/test/auth/session.test.ts` | test | 60 | related test | benchmarks/fixtures/small-ts-app/test/auth/session.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts` | test | 63 | related test | benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `test/context-delta.test.ts` | test | 85 | shared API/refactor risk | test/context-delta.test.ts contains 14 detected symbols, 10 imports, 0 exports. |
| `test/contract-validator.test.ts` | test | 81 | shared API/refactor risk | test/contract-validator.test.ts contains 12 detected symbols, 10 imports, 0 exports. |
| `test/execution-trace.test.ts` | test | 84 | shared API/refactor risk | test/execution-trace.test.ts contains 18 detected symbols, 9 imports, 0 exports. |
| `test/freshness.test.ts` | test | 77 | shared API/refactor risk | test/freshness.test.ts contains 13 detected symbols, 9 imports, 0 exports. |
| `test/loop-controller.test.ts` | test | 115 | shared API/refactor risk | test/loop-controller.test.ts contains 27 detected symbols, 10 imports, 0 exports. |
| `test/orchestrator.test.ts` | test | 96 | shared API/refactor risk | test/orchestrator.test.ts contains 22 detected symbols, 8 imports, 0 exports. |
| `test/policy-engine.test.ts` | test | 142 | shared API/refactor risk | test/policy-engine.test.ts contains 38 detected symbols, 10 imports, 0 exports. |
| `test/task-harness.test.ts` | test | 84 | shared API/refactor risk | test/task-harness.test.ts contains 18 detected symbols, 9 imports, 0 exports. |
| `test/test-selector.test.ts` | test | 84 | shared API/refactor risk | test/test-selector.test.ts contains 15 detected symbols, 8 imports, 0 exports. |
| `test/agents-md.test.ts` | test | 62 | shared API/refactor risk | test/agents-md.test.ts contains 9 detected symbols, 7 imports, 0 exports. |
| `test/config.test.ts` | test | 59 | shared API/refactor risk | test/config.test.ts contains 9 detected symbols, 7 imports, 0 exports. |
| `test/retrievers.test.ts` | test | 78 | shared API/refactor risk | test/retrievers.test.ts contains 14 detected symbols, 7 imports, 0 exports. |
| `test/writer.test.ts` | test | 99 | shared API/refactor risk | test/writer.test.ts contains 23 detected symbols, 7 imports, 0 exports. |
| `test/cache.test.ts` | test | 73 | shared API/refactor risk | test/cache.test.ts contains 10 detected symbols, 6 imports, 0 exports. |
| `test/impact.test.ts` | test | 58 | shared API/refactor risk | test/impact.test.ts contains 6 detected symbols, 8 imports, 0 exports. |
| `test/task-context.test.ts` | test | 59 | shared API/refactor risk | test/task-context.test.ts contains 6 detected symbols, 7 imports, 0 exports. |
| `test/fixtures.test.ts` | test | 60 | shared API/refactor risk | test/fixtures.test.ts contains 8 detected symbols, 4 imports, 0 exports. |
| `test/validator.test.ts` | test | 51 | shared API/refactor risk | test/validator.test.ts contains 3 detected symbols, 8 imports, 0 exports. |
| `test/scanner.test.ts` | test | 47 | shared API/refactor risk | test/scanner.test.ts contains 2 detected symbols, 7 imports, 0 exports. |
| `test/snapshot.test.ts` | test | 51 | shared API/refactor risk | test/snapshot.test.ts contains 3 detected symbols, 4 imports, 0 exports. |
| `test/benchmark.test.ts` | test | 50 | shared API/refactor risk | test/benchmark.test.ts contains 2 detected symbols, 4 imports, 0 exports. |
| `src/outputs/orchestrator.ts` | dependency-neighbor | 515 | lexical match: code, direct dependency of src/outputs/agent-events.ts, direct importer of src/core/types.ts, direct importer of src/outputs/agent-events.ts, shared API/refactor risk | src/outputs/orchestrator.ts contains 110 detected symbols, 16 imports, 11 exports. |
| `src/outputs/context-delta.ts` | dependency-neighbor | 304 | lexical match: code, direct dependency of src/mcp/server.ts, direct importer of src/core/types.ts, shared API/refactor risk | src/outputs/context-delta.ts contains 66 detected symbols, 5 imports, 9 exports. |
| `src/core/token-estimator.ts` | dependency-neighbor | 132 | lexical match: code, direct importer of src/core/types.ts, shared API/refactor risk | src/core/token-estimator.ts contains 15 detected symbols, 3 imports, 7 exports. |
| `src/outputs/execution-trace.ts` | dependency-neighbor | 330 | lexical match: code, direct dependency of src/mcp/server.ts, shared API/refactor risk | src/outputs/execution-trace.ts contains 49 detected symbols, 6 imports, 19 exports. |
| `src/outputs/markdown.ts` | dependency-neighbor | 68 | lexical match: code, shared API/refactor risk | src/outputs/markdown.ts contains 8 detected symbols, 0 imports, 5 exports. |
| `src/outputs/task-harness.ts` | dependency-neighbor | 277 | direct dependency of src/mcp/server.ts, direct importer of src/core/types.ts, shared API/refactor risk | src/outputs/task-harness.ts contains 67 detected symbols, 7 imports, 5 exports. |
| `src/outputs/task-run.ts` | dependency-neighbor | 200 | direct dependency of src/mcp/server.ts, direct importer of src/core/types.ts, shared API/refactor risk | src/outputs/task-run.ts contains 42 detected symbols, 10 imports, 4 exports. |
| `src/outputs/loop-controller.ts` | dependency-neighbor | 302 | direct dependency of src/mcp/server.ts, direct importer of src/core/types.ts, shared API/refactor risk | src/outputs/loop-controller.ts contains 60 detected symbols, 13 imports, 10 exports. |
| `src/outputs/policy-engine.ts` | dependency-neighbor | 255 | direct dependency of src/mcp/server.ts, direct importer of src/core/types.ts, shared API/refactor risk | src/outputs/policy-engine.ts contains 45 detected symbols, 9 imports, 9 exports. |
| `src/core/context-builder.ts` | dependency-neighbor | 106 | direct importer of src/core/types.ts, direct dependency of src/mcp/server.ts, shared API/refactor risk | src/core/context-builder.ts contains 15 detected symbols, 11 imports, 2 exports. |
| `src/outputs/writer.ts` | dependency-neighbor | 246 | direct dependency of src/mcp/server.ts, direct importer of src/core/types.ts, shared API/refactor risk | src/outputs/writer.ts contains 55 detected symbols, 18 imports, 2 exports. |
| `src/outputs/impact.ts` | dependency-neighbor | 230 | direct dependency of src/mcp/server.ts, direct importer of src/core/types.ts, shared API/refactor risk | src/outputs/impact.ts contains 46 detected symbols, 3 imports, 4 exports. |
| `src/outputs/test-selector.ts` | dependency-neighbor | 226 | direct dependency of src/mcp/server.ts, direct importer of src/core/types.ts, shared API/refactor risk | src/outputs/test-selector.ts contains 44 detected symbols, 3 imports, 4 exports. |
| `src/retrievers/index.ts` | dependency-neighbor | 88 | direct dependency of src/mcp/server.ts, direct importer of src/core/types.ts, shared API/refactor risk | src/retrievers/index.ts contains 2 detected symbols, 7 imports, 6 exports. |
| `src/outputs/task-context.ts` | dependency-neighbor | 252 | direct dependency of src/mcp/server.ts, direct importer of src/core/types.ts | src/outputs/task-context.ts contains 64 detected symbols, 3 imports, 3 exports. |
| `src/core/freshness.ts` | dependency-neighbor | 290 | direct importer of src/core/types.ts, shared API/refactor risk | src/core/freshness.ts contains 57 detected symbols, 8 imports, 9 exports. |
| `src/outputs/contract-validator.ts` | dependency-neighbor | 327 | direct importer of src/core/types.ts, shared API/refactor risk | src/outputs/contract-validator.ts contains 65 detected symbols, 6 imports, 5 exports. |
| `src/benchmarks/benchmark.ts` | dependency-neighbor | 452 | direct importer of src/core/types.ts, shared API/refactor risk | src/benchmarks/benchmark.ts contains 90 detected symbols, 7 imports, 11 exports. |
| `src/retrievers/static.ts` | dependency-neighbor | 128 | direct importer of src/core/types.ts, shared API/refactor risk | src/retrievers/static.ts contains 23 detected symbols, 3 imports, 6 exports. |
| `src/outputs/runtime-state.ts` | dependency-neighbor | 228 | direct importer of src/core/types.ts, shared API/refactor risk | src/outputs/runtime-state.ts contains 41 detected symbols, 5 imports, 10 exports. |
| `src/outputs/rag.ts` | dependency-neighbor | 113 | direct importer of src/core/types.ts, shared API/refactor risk | src/outputs/rag.ts contains 15 detected symbols, 3 imports, 4 exports. |
| `src/core/cache.ts` | dependency-neighbor | 188 | direct importer of src/core/types.ts, shared API/refactor risk | src/core/cache.ts contains 34 detected symbols, 5 imports, 4 exports. |
| `src/core/scanner.ts` | dependency-neighbor | 211 | direct importer of src/core/types.ts, shared API/refactor risk | src/core/scanner.ts contains 52 detected symbols, 9 imports, 1 export. |
| `src/config/load-config.ts` | dependency-neighbor | 160 | direct importer of src/core/types.ts, shared API/refactor risk | src/config/load-config.ts contains 30 detected symbols, 5 imports, 2 exports. |
| `src/core/indexer.ts` | dependency-neighbor | 225 | direct importer of src/core/types.ts, shared API/refactor risk | src/core/indexer.ts contains 54 detected symbols, 10 imports, 2 exports. |
| `src/analyzers/python.ts` | dependency-neighbor | 159 | direct importer of src/core/types.ts, shared API/refactor risk | src/analyzers/python.ts contains 36 detected symbols, 5 imports, 1 export. |
| `src/analyzers/javascript.ts` | dependency-neighbor | 260 | direct importer of src/core/types.ts, shared API/refactor risk | src/analyzers/javascript.ts contains 66 detected symbols, 4 imports, 1 export. |
| `src/retrievers/ripgrep.ts` | dependency-neighbor | 89 | direct importer of src/core/types.ts, shared API/refactor risk | src/retrievers/ripgrep.ts contains 14 detected symbols, 5 imports, 1 export. |
| `src/retrievers/types.ts` | dependency-neighbor | 79 | direct dependency of src/mcp/server.ts, shared API/refactor risk | src/retrievers/types.ts contains 4 detected symbols, 0 imports, 4 exports. |
| `src/core/token-savings.ts` | dependency-neighbor | 198 | direct importer of src/core/types.ts | src/core/token-savings.ts contains 30 detected symbols, 2 imports, 3 exports. |
| `src/core/readiness.ts` | dependency-neighbor | 288 | direct importer of src/core/types.ts | src/core/readiness.ts contains 71 detected symbols, 1 import, 3 exports. |
| `src/core/validator.ts` | dependency-neighbor | 101 | direct importer of src/core/types.ts | src/core/validator.ts contains 11 detected symbols, 3 imports, 3 exports. |
| `src/analyzers/types.ts` | dependency-neighbor | 72 | direct importer of src/core/types.ts | src/analyzers/types.ts contains 3 detected symbols, 1 import, 3 exports. |
| `src/outputs/contracts.ts` | dependency-neighbor | 193 | direct importer of src/core/types.ts | src/outputs/contracts.ts contains 41 detected symbols, 1 import, 2 exports. |
| `src/core/file-classifier.ts` | dependency-neighbor | 88 | direct importer of src/core/types.ts | src/core/file-classifier.ts contains 8 detected symbols, 3 imports, 3 exports. |
| `src/analyzers/tree-sitter.ts` | dependency-neighbor | 117 | direct importer of src/core/types.ts | src/analyzers/tree-sitter.ts contains 12 detected symbols, 2 imports, 2 exports. |
| `src/outputs/architecture.ts` | dependency-neighbor | 70 | direct importer of src/core/types.ts | src/outputs/architecture.ts contains 3 detected symbols, 2 imports, 1 export. |
| `src/outputs/dependency-graph.ts` | dependency-neighbor | 85 | direct importer of src/core/types.ts | src/outputs/dependency-graph.ts contains 7 detected symbols, 2 imports, 2 exports. |
| `src/outputs/agents-md.ts` | dependency-neighbor | 159 | direct importer of src/core/types.ts | src/outputs/agents-md.ts contains 31 detected symbols, 3 imports, 1 export. |
| `src/llm/provider.ts` | dependency-neighbor | 82 | direct importer of src/core/types.ts | src/llm/provider.ts contains 9 detected symbols, 1 import, 2 exports. |
| `src/core/summarizer.ts` | dependency-neighbor | 97 | direct importer of src/core/types.ts | src/core/summarizer.ts contains 13 detected symbols, 2 imports, 1 export. |
| `src/core/graph.ts` | dependency-neighbor | 70 | direct importer of src/core/types.ts | src/core/graph.ts contains 8 detected symbols, 1 import, 1 export. |
| `src/core/ranker.ts` | dependency-neighbor | 121 | direct importer of src/core/types.ts | src/core/ranker.ts contains 20 detected symbols, 1 import, 1 export. |
| `src/config/defaults.ts` | dependency-neighbor | 64 | direct importer of src/core/types.ts | src/config/defaults.ts contains 2 detected symbols, 1 import, 2 exports. |

## Budget Packing
| Bucket | Tokens | Files |
| --- | --- | --- |
| Directly relevant source files | 738 | `benchmarks/tasks/refactor-config-loader.json`, `code-agent-plusplus.config.example.yml`, `code-agent-plusplus.local.example.yml`, `assets/agent-context-code-layers.png`, `src/core/types.ts`, `src/outputs/agent-events.ts` |
| Tests | 2,370 | `test/mcp.test.ts`, `test/agent-events.test.ts`, `test/analyzers.test.ts`, `test/token-savings.test.ts`, `test/readiness.test.ts`, `benchmarks/fixtures/small-ts-app/test/api/login.test.ts`, `benchmarks/fixtures/monorepo/packages/api/test/config.test.ts`, `benchmarks/fixtures/fastapi-app/tests/test_users.py`, `benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts`, `benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx`, `benchmarks/fixtures/small-ts-app/test/auth/session.test.ts`, `benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts`, `test/context-delta.test.ts`, `test/contract-validator.test.ts`, `test/execution-trace.test.ts`, `test/freshness.test.ts`, `test/loop-controller.test.ts`, `test/orchestrator.test.ts`, `test/policy-engine.test.ts`, `test/task-harness.test.ts`, `test/test-selector.test.ts`, `test/agents-md.test.ts`, `test/config.test.ts`, `test/retrievers.test.ts`, `test/writer.test.ts`, `test/cache.test.ts`, `test/impact.test.ts`, `test/task-context.test.ts`, `test/fixtures.test.ts`, `test/validator.test.ts`, `test/scanner.test.ts`, `test/snapshot.test.ts`, `test/benchmark.test.ts` |
| Dependency neighbors | 8,245 | `src/outputs/orchestrator.ts`, `src/outputs/context-delta.ts`, `src/core/token-estimator.ts`, `src/outputs/execution-trace.ts`, `src/outputs/markdown.ts`, `src/outputs/task-harness.ts`, `src/outputs/task-run.ts`, `src/outputs/loop-controller.ts`, `src/outputs/policy-engine.ts`, `src/core/context-builder.ts`, `src/outputs/writer.ts`, `src/outputs/impact.ts`, `src/outputs/test-selector.ts`, `src/retrievers/index.ts`, `src/outputs/task-context.ts`, `src/core/freshness.ts`, `src/outputs/contract-validator.ts`, `src/benchmarks/benchmark.ts`, `src/retrievers/static.ts`, `src/outputs/runtime-state.ts`, `src/outputs/rag.ts`, `src/core/cache.ts`, `src/core/scanner.ts`, `src/config/load-config.ts`, `src/core/indexer.ts`, `src/analyzers/python.ts`, `src/analyzers/javascript.ts`, `src/retrievers/ripgrep.ts`, `src/retrievers/types.ts`, `src/core/token-savings.ts`, `src/core/readiness.ts`, `src/core/validator.ts`, `src/analyzers/types.ts`, `src/outputs/contracts.ts`, `src/core/file-classifier.ts`, `src/analyzers/tree-sitter.ts`, `src/outputs/architecture.ts`, `src/outputs/dependency-graph.ts`, `src/outputs/agents-md.ts`, `src/llm/provider.ts`, `src/core/summarizer.ts`, `src/core/graph.ts`, `src/core/ranker.ts`, `src/config/defaults.ts` |
| Config/docs | 0 | none |
| Entrypoints | 634 | `src/mcp/server.ts`, `src/cli/index.ts` |

Remaining budget: 13 estimated tokens

## Suggested Commands
- npm run test -- refactor
- npm run build
- npm run lint

## Suggested Agent Workflow
- Preserve exported APIs and inspect callers before moving code.
- Read `AGENTS.md` and inspect evidence before editing.
- Open the selected files and dependency neighbors.
- Run detected test/check commands after edits.
