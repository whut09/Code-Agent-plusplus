# Task Context: fix a bug or regression

Type: bugfix
Budget: 8,734 / 12,000 estimated tokens

## Read First
1. `src/outputs/regression-guard.ts` - lexical match: regression, direct dependency of test/regression-guard.test.ts; defines RegressionMemoryEntry
2. `src/outputs/task-run.ts` - lexical match: regression, direct dependency of test/regression-guard.test.ts; defines TaskRunOptions
3. `src/outputs/orchestrator.ts` - lexical match: regression, direct importer of src/outputs/regression-guard.ts; defines AgentExecutorName
4. `src/outputs/task-harness.ts` - lexical match: regression, direct dependency of src/outputs/orchestrator.ts; defines TaskPackWriteResult
5. `src/outputs/task-context.ts` - lexical match: regression, direct dependency of test/regression-guard.test.ts; defines TaskContextOptions
6. `src/outputs/policy-engine.ts` - lexical match: regression, direct dependency of test/regression-guard.test.ts; defines PolicyKind
7. `src/integrations/codegraph.ts` - lexical match: regression; defines CodeIntelligenceBackend
8. `src/cli/index.ts` - direct importer of src/outputs/task-context.ts, direct importer of src/outputs/task-harness.ts; defines program

## Then Inspect If Needed
- `test/regression-guard.test.ts` - lexical match: regression, direct importer of src/outputs/policy-engine.ts
- `test/task-harness.test.ts` - direct importer of src/outputs/task-harness.ts, direct importer of src/outputs/task-run.ts
- `test/orchestrator.test.ts` - direct importer of src/outputs/orchestrator.ts, related test
- `test/policy-engine.test.ts` - direct importer of src/outputs/policy-engine.ts, related test
- `test/codegraph.test.ts` - direct importer of src/integrations/codegraph.ts, related test
- `test/task-context.test.ts` - direct importer of src/outputs/task-context.ts, related test
- `test/contract-validator.test.ts` - direct importer of src/outputs/task-harness.ts
- `test/execution-trace.test.ts` - direct importer of src/outputs/task-run.ts
- `test/hallucination-guard.test.ts` - direct importer of src/outputs/policy-engine.ts
- `src/outputs/test-selector.ts` - lexical match: regression, direct dependency of src/outputs/policy-engine.ts
- `src/outputs/writer.ts` - lexical match: regression, direct dependency of test/regression-guard.test.ts
- `src/core/types.ts` - direct dependency of src/integrations/codegraph.ts, direct dependency of src/outputs/orchestrator.ts
- `src/outputs/markdown.ts` - direct dependency of src/outputs/orchestrator.ts, direct dependency of src/outputs/policy-engine.ts
- `src/core/git.ts` - direct dependency of test/regression-guard.test.ts, direct dependency of src/outputs/orchestrator.ts
- `src/outputs/impact.ts` - direct importer of src/integrations/codegraph.ts, direct dependency of src/outputs/orchestrator.ts
- `src/outputs/execution-trace.ts` - direct dependency of src/outputs/orchestrator.ts, direct dependency of src/outputs/policy-engine.ts

## Why These Files
| File | Category | Tokens | Why | Summary |
| --- | --- | --- | --- | --- |
| `src/outputs/regression-guard.ts` | direct-source | 297 | lexical match: regression, direct dependency of test/regression-guard.test.ts, direct dependency of src/outputs/orchestrator.ts, direct dependency of src/outputs/policy-engine.ts, direct dependency of src/outputs/task-context.ts, direct dependency of src/outputs/task-harness.ts, direct dependency of src/outputs/task-run.ts | src/outputs/regression-guard.ts contains 61 detected symbols, 7 imports, 8 exports. |
| `src/outputs/task-run.ts` | direct-source | 203 | lexical match: regression, direct dependency of test/regression-guard.test.ts, direct dependency of src/outputs/orchestrator.ts, direct importer of src/outputs/task-context.ts, direct importer of src/outputs/task-harness.ts, direct importer of src/outputs/regression-guard.ts | src/outputs/task-run.ts contains 43 detected symbols, 11 imports, 4 exports. |
| `src/outputs/orchestrator.ts` | direct-source | 522 | lexical match: regression, direct importer of src/outputs/regression-guard.ts, direct importer of src/outputs/policy-engine.ts, direct importer of src/outputs/task-harness.ts, direct importer of src/outputs/task-run.ts | src/outputs/orchestrator.ts contains 112 detected symbols, 18 imports, 11 exports. |
| `src/outputs/task-harness.ts` | direct-source | 280 | lexical match: regression, direct dependency of src/outputs/orchestrator.ts, direct importer of src/outputs/task-context.ts, direct importer of src/outputs/regression-guard.ts, direct dependency of src/outputs/task-run.ts | src/outputs/task-harness.ts contains 68 detected symbols, 8 imports, 5 exports. |
| `src/outputs/task-context.ts` | direct-source | 260 | lexical match: regression, direct dependency of test/regression-guard.test.ts, direct importer of src/outputs/regression-guard.ts, direct dependency of src/outputs/task-harness.ts, direct dependency of src/outputs/task-run.ts | src/outputs/task-context.ts contains 67 detected symbols, 4 imports, 3 exports. |
| `src/outputs/policy-engine.ts` | direct-source | 271 | lexical match: regression, direct dependency of test/regression-guard.test.ts, direct dependency of src/outputs/orchestrator.ts, direct importer of src/outputs/regression-guard.ts | src/outputs/policy-engine.ts contains 48 detected symbols, 11 imports, 9 exports. |
| `src/integrations/codegraph.ts` | direct-source | 294 | lexical match: regression | src/integrations/codegraph.ts contains 59 detected symbols, 5 imports, 11 exports. |
| `src/cli/index.ts` | entrypoint | 313 | direct importer of src/outputs/task-context.ts, direct importer of src/outputs/task-harness.ts, direct importer of src/outputs/task-run.ts, direct importer of src/outputs/orchestrator.ts, direct importer of src/outputs/policy-engine.ts, direct importer of src/outputs/regression-guard.ts, direct importer of src/integrations/codegraph.ts, entrypoint | src/cli/index.ts contains 103 detected symbols, 32 imports, 0 exports. |
| `src/mcp/server.ts` | entrypoint | 339 | direct importer of src/outputs/policy-engine.ts, direct importer of src/outputs/task-harness.ts, direct importer of src/outputs/task-context.ts, direct importer of src/outputs/task-run.ts, entrypoint | src/mcp/server.ts contains 81 detected symbols, 18 imports, 4 exports. |
| `test/regression-guard.test.ts` | test | 86 | lexical match: regression, direct importer of src/outputs/policy-engine.ts, direct importer of src/outputs/regression-guard.ts, direct importer of src/outputs/task-context.ts, direct importer of src/outputs/task-run.ts, related test | test/regression-guard.test.ts contains 14 detected symbols, 12 imports, 0 exports. |
| `test/task-harness.test.ts` | test | 84 | direct importer of src/outputs/task-harness.ts, direct importer of src/outputs/task-run.ts, related test | test/task-harness.test.ts contains 18 detected symbols, 9 imports, 0 exports. |
| `test/orchestrator.test.ts` | test | 96 | direct importer of src/outputs/orchestrator.ts, related test | test/orchestrator.test.ts contains 22 detected symbols, 8 imports, 0 exports. |
| `test/policy-engine.test.ts` | test | 142 | direct importer of src/outputs/policy-engine.ts, related test | test/policy-engine.test.ts contains 38 detected symbols, 10 imports, 0 exports. |
| `test/codegraph.test.ts` | test | 62 | direct importer of src/integrations/codegraph.ts, related test | test/codegraph.test.ts contains 8 detected symbols, 7 imports, 0 exports. |
| `test/task-context.test.ts` | test | 59 | direct importer of src/outputs/task-context.ts, related test | test/task-context.test.ts contains 6 detected symbols, 7 imports, 0 exports. |
| `test/contract-validator.test.ts` | test | 81 | direct importer of src/outputs/task-harness.ts | test/contract-validator.test.ts contains 12 detected symbols, 10 imports, 0 exports. |
| `test/execution-trace.test.ts` | test | 84 | direct importer of src/outputs/task-run.ts | test/execution-trace.test.ts contains 18 detected symbols, 9 imports, 0 exports. |
| `test/hallucination-guard.test.ts` | test | 89 | direct importer of src/outputs/policy-engine.ts | test/hallucination-guard.test.ts contains 14 detected symbols, 11 imports, 0 exports. |
| `src/outputs/test-selector.ts` | dependency-neighbor | 249 | lexical match: regression, direct dependency of src/outputs/policy-engine.ts, direct dependency of src/outputs/task-run.ts, direct importer of src/integrations/codegraph.ts | src/outputs/test-selector.ts contains 50 detected symbols, 4 imports, 4 exports. |
| `src/outputs/writer.ts` | dependency-neighbor | 246 | lexical match: regression, direct dependency of test/regression-guard.test.ts, direct dependency of src/outputs/orchestrator.ts, direct importer of src/outputs/regression-guard.ts, direct importer of src/outputs/task-context.ts | src/outputs/writer.ts contains 55 detected symbols, 19 imports, 2 exports. |
| `src/core/types.ts` | dependency-neighbor | 300 | direct dependency of src/integrations/codegraph.ts, direct dependency of src/outputs/orchestrator.ts, direct dependency of src/outputs/policy-engine.ts, direct dependency of src/outputs/regression-guard.ts, direct dependency of src/outputs/task-context.ts, direct dependency of src/outputs/task-harness.ts, direct dependency of src/outputs/task-run.ts | src/core/types.ts contains 35 detected symbols, 0 imports, 35 exports. |
| `src/outputs/markdown.ts` | dependency-neighbor | 68 | direct dependency of src/outputs/orchestrator.ts, direct dependency of src/outputs/policy-engine.ts, direct dependency of src/outputs/regression-guard.ts, direct dependency of src/outputs/task-context.ts, direct dependency of src/outputs/task-harness.ts, direct dependency of src/outputs/task-run.ts | src/outputs/markdown.ts contains 8 detected symbols, 0 imports, 5 exports. |
| `src/core/git.ts` | dependency-neighbor | 78 | direct dependency of test/regression-guard.test.ts, direct dependency of src/outputs/orchestrator.ts, direct dependency of src/outputs/policy-engine.ts, direct dependency of src/outputs/regression-guard.ts, direct dependency of src/outputs/task-harness.ts | src/core/git.ts contains 8 detected symbols, 1 import, 2 exports. |
| `src/outputs/impact.ts` | dependency-neighbor | 260 | direct importer of src/integrations/codegraph.ts, direct dependency of src/outputs/orchestrator.ts, direct dependency of src/outputs/policy-engine.ts, direct dependency of src/outputs/task-run.ts | src/outputs/impact.ts contains 52 detected symbols, 4 imports, 4 exports. |
| `src/outputs/execution-trace.ts` | dependency-neighbor | 330 | direct dependency of src/outputs/orchestrator.ts, direct dependency of src/outputs/policy-engine.ts, direct dependency of src/outputs/regression-guard.ts, direct dependency of src/outputs/task-run.ts | src/outputs/execution-trace.ts contains 49 detected symbols, 6 imports, 19 exports. |
| `src/core/freshness.ts` | dependency-neighbor | 290 | direct importer of src/outputs/task-context.ts, direct dependency of src/outputs/policy-engine.ts | src/core/freshness.ts contains 57 detected symbols, 8 imports, 9 exports. |
| `src/outputs/loop-controller.ts` | dependency-neighbor | 302 | direct importer of src/outputs/task-context.ts, direct dependency of src/outputs/orchestrator.ts | src/outputs/loop-controller.ts contains 60 detected symbols, 13 imports, 10 exports. |
| `src/outputs/agent-events.ts` | dependency-neighbor | 293 | direct importer of src/outputs/orchestrator.ts, direct dependency of src/outputs/orchestrator.ts | src/outputs/agent-events.ts contains 70 detected symbols, 3 imports, 6 exports. |
| `src/outputs/contract-validator.ts` | dependency-neighbor | 327 | direct dependency of src/outputs/policy-engine.ts, direct dependency of src/outputs/task-harness.ts | src/outputs/contract-validator.ts contains 65 detected symbols, 6 imports, 5 exports. |
| `src/outputs/hallucination-guard.ts` | dependency-neighbor | 467 | direct dependency of src/outputs/orchestrator.ts, direct dependency of src/outputs/policy-engine.ts | src/outputs/hallucination-guard.ts contains 106 detected symbols, 6 imports, 8 exports. |
| `src/core/context-builder.ts` | dependency-neighbor | 106 | direct dependency of test/regression-guard.test.ts, direct dependency of src/outputs/orchestrator.ts | src/core/context-builder.ts contains 15 detected symbols, 11 imports, 2 exports. |
| `src/core/safe-command.ts` | dependency-neighbor | 158 | direct dependency of src/integrations/codegraph.ts, direct dependency of src/outputs/orchestrator.ts | src/core/safe-command.ts contains 26 detected symbols, 1 import, 5 exports. |
| `src/outputs/evidence.ts` | dependency-neighbor | 224 | direct dependency of src/outputs/policy-engine.ts, direct dependency of src/outputs/regression-guard.ts | src/outputs/evidence.ts contains 38 detected symbols, 1 import, 8 exports. |
| `src/benchmarks/benchmark.ts` | dependency-neighbor | 452 | direct importer of src/outputs/task-context.ts | src/benchmarks/benchmark.ts contains 90 detected symbols, 7 imports, 11 exports. |
| `src/retrievers/codegraph.ts` | dependency-neighbor | 69 | direct importer of src/integrations/codegraph.ts | src/retrievers/codegraph.ts contains 3 detected symbols, 6 imports, 1 export. |
| `src/core/token-estimator.ts` | dependency-neighbor | 132 | direct dependency of src/outputs/task-context.ts | src/core/token-estimator.ts contains 15 detected symbols, 3 imports, 7 exports. |
| `src/outputs/runtime-state.ts` | dependency-neighbor | 228 | direct dependency of src/outputs/task-run.ts | src/outputs/runtime-state.ts contains 41 detected symbols, 5 imports, 10 exports. |
| `src/retrievers/types.ts` | dependency-neighbor | 79 | direct dependency of src/integrations/codegraph.ts | src/retrievers/types.ts contains 4 detected symbols, 0 imports, 4 exports. |
| `benchmarks/fixtures/monorepo/packages/api/package.json` | config-doc | 51 | configuration | benchmarks/fixtures/monorepo/packages/api/package.json is a config file written as JSON. |
| `package.json` | config-doc | 25 | configuration | package.json is a config file written as JSON. |
| `benchmarks/fixtures/fastapi-app/pyproject.toml` | config-doc | 42 | configuration | benchmarks/fixtures/fastapi-app/pyproject.toml is a config file written as TOML. |
| `benchmarks/fixtures/monorepo/package.json` | config-doc | 40 | configuration | benchmarks/fixtures/monorepo/package.json is a config file written as JSON. |
| `benchmarks/fixtures/react-app/package.json` | config-doc | 40 | configuration | benchmarks/fixtures/react-app/package.json is a config file written as JSON. |
| `benchmarks/fixtures/small-ts-app/package.json` | config-doc | 42 | configuration | benchmarks/fixtures/small-ts-app/package.json is a config file written as JSON. |
| `benchmarks/fixtures/monorepo/packages/config/package.json` | config-doc | 48 | configuration | benchmarks/fixtures/monorepo/packages/config/package.json is a config file written as JSON. |
| `benchmarks/fixtures/monorepo/packages/shared/package.json` | config-doc | 48 | configuration | benchmarks/fixtures/monorepo/packages/shared/package.json is a config file written as JSON. |
| `benchmarks/fixtures/monorepo/packages/web/package.json` | config-doc | 46 | configuration | benchmarks/fixtures/monorepo/packages/web/package.json is a config file written as JSON. |
| `.env.example` | config-doc | 25 | configuration | .env.example is a config file. |
| `code-agent-plusplus.config.yml` | config-doc | 38 | configuration | code-agent-plusplus.config.yml is a config file written as YAML. |
| `tsconfig.json` | config-doc | 34 | configuration | tsconfig.json is a config file written as JSON. |
| `.github/workflows/ci.yml` | config-doc | 35 | configuration | .github/workflows/ci.yml is a config file written as YAML. |

## Budget Packing
| Bucket | Tokens | Files |
| --- | --- | --- |
| Directly relevant source files | 2,127 | `src/outputs/regression-guard.ts`, `src/outputs/task-run.ts`, `src/outputs/orchestrator.ts`, `src/outputs/task-harness.ts`, `src/outputs/task-context.ts`, `src/outputs/policy-engine.ts`, `src/integrations/codegraph.ts` |
| Tests | 783 | `test/regression-guard.test.ts`, `test/task-harness.test.ts`, `test/orchestrator.test.ts`, `test/policy-engine.test.ts`, `test/codegraph.test.ts`, `test/task-context.test.ts`, `test/contract-validator.test.ts`, `test/execution-trace.test.ts`, `test/hallucination-guard.test.ts` |
| Dependency neighbors | 4,658 | `src/outputs/test-selector.ts`, `src/outputs/writer.ts`, `src/core/types.ts`, `src/outputs/markdown.ts`, `src/core/git.ts`, `src/outputs/impact.ts`, `src/outputs/execution-trace.ts`, `src/core/freshness.ts`, `src/outputs/loop-controller.ts`, `src/outputs/agent-events.ts`, `src/outputs/contract-validator.ts`, `src/outputs/hallucination-guard.ts`, `src/core/context-builder.ts`, `src/core/safe-command.ts`, `src/outputs/evidence.ts`, `src/benchmarks/benchmark.ts`, `src/retrievers/codegraph.ts`, `src/core/token-estimator.ts`, `src/outputs/runtime-state.ts`, `src/retrievers/types.ts` |
| Config/docs | 514 | `benchmarks/fixtures/monorepo/packages/api/package.json`, `package.json`, `benchmarks/fixtures/fastapi-app/pyproject.toml`, `benchmarks/fixtures/monorepo/package.json`, `benchmarks/fixtures/react-app/package.json`, `benchmarks/fixtures/small-ts-app/package.json`, `benchmarks/fixtures/monorepo/packages/config/package.json`, `benchmarks/fixtures/monorepo/packages/shared/package.json`, `benchmarks/fixtures/monorepo/packages/web/package.json`, `.env.example`, `code-agent-plusplus.config.yml`, `tsconfig.json`, `.github/workflows/ci.yml` |
| Entrypoints | 652 | `src/cli/index.ts`, `src/mcp/server.ts` |

Remaining budget: 3,266 estimated tokens

## Suggested Commands
- npm run test -- regression

## Anti-Regression Notes
- None detected.

## Required Regression Tests
- None detected.

## Suggested Agent Workflow
- Reproduce the failure and inspect related tests first.
- Read `AGENTS.md` and inspect evidence before editing.
- Open the selected files and dependency neighbors.
- Run detected test/check commands after edits.
