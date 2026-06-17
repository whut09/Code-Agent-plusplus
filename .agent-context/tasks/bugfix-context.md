# Task Context: fix a bug or regression

Type: bugfix
Budget: 10,223 / 12,000 estimated tokens

## Read First
1. `src/outputs/regression-guard.ts` - lexical match: regression, direct dependency of test/regression-guard.test.ts; defines RegressionMemoryEntry
2. `src/outputs/policy-engine.ts` - lexical match: regression, direct dependency of test/regression-guard.test.ts; defines PolicyKind
3. `src/outputs/orchestrator.ts` - lexical match: regression, direct dependency of src/benchmarks/agent-benchmark.ts; defines AgentExecutorName
4. `src/benchmarks/agent-benchmark.ts` - lexical match: regression, direct importer of src/outputs/policy-engine.ts; defines AgentBenchmarkFinalDecision
5. `src/outputs/task-context.ts` - lexical match: regression, direct dependency of test/regression-guard.test.ts; defines TaskContextOptions
6. `src/outputs/guard-gates.ts` - lexical match: regression, direct importer of src/outputs/policy-engine.ts; defines GuardGateName
7. `src/integrations/codegraph.ts` - lexical match: regression; defines CodeIntelligenceBackend
8. `src/cli/index.ts` - direct importer of src/outputs/task-context.ts, direct importer of src/benchmarks/agent-benchmark.ts; defines program

## Then Inspect If Needed
- `test/regression-guard.test.ts` - lexical match: regression, direct importer of src/outputs/policy-engine.ts
- `test/orchestrator.test.ts` - direct importer of src/outputs/orchestrator.ts, related test
- `test/policy-engine.test.ts` - direct importer of src/outputs/policy-engine.ts, related test
- `test/codegraph.test.ts` - direct importer of src/integrations/codegraph.ts, related test
- `test/task-context.test.ts` - direct importer of src/outputs/task-context.ts, related test
- `test/agent-benchmark.test.ts` - direct importer of src/benchmarks/agent-benchmark.ts, related test
- `benchmarks/fixtures/small-ts-app/test/api/login.test.ts` - related test
- `benchmarks/fixtures/monorepo/packages/api/test/config.test.ts` - related test
- `benchmarks/fixtures/fastapi-app/tests/test_users.py` - related test
- `benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts` - related test
- `benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx` - related test
- `benchmarks/fixtures/small-ts-app/test/auth/session.test.ts` - related test
- `benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts` - related test
- `test/hallucination-guard.test.ts` - direct importer of src/outputs/policy-engine.ts
- `src/outputs/task-run.ts` - lexical match: regression, direct dependency of test/regression-guard.test.ts
- `src/outputs/writer.ts` - lexical match: regression, direct dependency of test/regression-guard.test.ts

## Why These Files
| File | Category | Tokens | Why | Summary |
| --- | --- | --- | --- | --- |
| `src/outputs/regression-guard.ts` | direct-source | 297 | lexical match: regression, direct dependency of test/regression-guard.test.ts, direct dependency of src/benchmarks/agent-benchmark.ts, direct dependency of src/outputs/orchestrator.ts, direct dependency of src/outputs/policy-engine.ts, direct dependency of src/outputs/task-context.ts | src/outputs/regression-guard.ts contains 61 detected symbols, 7 imports, 8 exports. |
| `src/outputs/policy-engine.ts` | direct-source | 271 | lexical match: regression, direct dependency of test/regression-guard.test.ts, direct dependency of src/benchmarks/agent-benchmark.ts, direct dependency of src/outputs/guard-gates.ts, direct dependency of src/outputs/orchestrator.ts, direct importer of src/outputs/regression-guard.ts | src/outputs/policy-engine.ts contains 48 detected symbols, 11 imports, 9 exports. |
| `src/outputs/orchestrator.ts` | direct-source | 626 | lexical match: regression, direct dependency of src/benchmarks/agent-benchmark.ts, direct importer of src/outputs/regression-guard.ts, direct importer of src/outputs/policy-engine.ts, direct importer of src/outputs/guard-gates.ts | src/outputs/orchestrator.ts contains 136 detected symbols, 23 imports, 12 exports. |
| `src/benchmarks/agent-benchmark.ts` | direct-source | 364 | lexical match: regression, direct importer of src/outputs/policy-engine.ts, direct importer of src/outputs/regression-guard.ts, direct importer of src/outputs/orchestrator.ts | src/benchmarks/agent-benchmark.ts contains 71 detected symbols, 17 imports, 9 exports. |
| `src/outputs/task-context.ts` | direct-source | 260 | lexical match: regression, direct dependency of test/regression-guard.test.ts, direct importer of src/outputs/regression-guard.ts | src/outputs/task-context.ts contains 67 detected symbols, 4 imports, 3 exports. |
| `src/outputs/guard-gates.ts` | direct-source | 194 | lexical match: regression, direct importer of src/outputs/policy-engine.ts, direct dependency of src/outputs/orchestrator.ts | src/outputs/guard-gates.ts contains 34 detected symbols, 4 imports, 6 exports. |
| `src/integrations/codegraph.ts` | direct-source | 294 | lexical match: regression | src/integrations/codegraph.ts contains 59 detected symbols, 5 imports, 11 exports. |
| `src/cli/index.ts` | entrypoint | 315 | direct importer of src/outputs/task-context.ts, direct importer of src/benchmarks/agent-benchmark.ts, direct importer of src/outputs/orchestrator.ts, direct importer of src/outputs/policy-engine.ts, direct importer of src/outputs/regression-guard.ts, direct importer of src/integrations/codegraph.ts, entrypoint | src/cli/index.ts contains 104 detected symbols, 33 imports, 0 exports. |
| `src/mcp/server.ts` | entrypoint | 405 | direct importer of src/outputs/policy-engine.ts, direct importer of src/outputs/task-context.ts, entrypoint | src/mcp/server.ts contains 102 detected symbols, 19 imports, 4 exports. |
| `test/regression-guard.test.ts` | test | 86 | lexical match: regression, direct importer of src/outputs/policy-engine.ts, direct importer of src/outputs/regression-guard.ts, direct importer of src/outputs/task-context.ts, related test | test/regression-guard.test.ts contains 14 detected symbols, 12 imports, 0 exports. |
| `test/orchestrator.test.ts` | test | 116 | direct importer of src/outputs/orchestrator.ts, related test | test/orchestrator.test.ts contains 27 detected symbols, 8 imports, 0 exports. |
| `test/policy-engine.test.ts` | test | 142 | direct importer of src/outputs/policy-engine.ts, related test | test/policy-engine.test.ts contains 38 detected symbols, 10 imports, 0 exports. |
| `test/codegraph.test.ts` | test | 62 | direct importer of src/integrations/codegraph.ts, related test | test/codegraph.test.ts contains 8 detected symbols, 7 imports, 0 exports. |
| `test/task-context.test.ts` | test | 59 | direct importer of src/outputs/task-context.ts, related test | test/task-context.test.ts contains 6 detected symbols, 7 imports, 0 exports. |
| `test/agent-benchmark.test.ts` | test | 53 | direct importer of src/benchmarks/agent-benchmark.ts, related test | test/agent-benchmark.test.ts contains 2 detected symbols, 4 imports, 0 exports. |
| `benchmarks/fixtures/small-ts-app/test/api/login.test.ts` | test | 63 | related test | benchmarks/fixtures/small-ts-app/test/api/login.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/monorepo/packages/api/test/config.test.ts` | test | 66 | related test | benchmarks/fixtures/monorepo/packages/api/test/config.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/fastapi-app/tests/test_users.py` | test | 72 | related test | benchmarks/fixtures/fastapi-app/tests/test_users.py contains 1 detected Python symbol and 1 import. |
| `benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts` | test | 61 | related test | benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx` | test | 64 | related test | benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/small-ts-app/test/auth/session.test.ts` | test | 60 | related test | benchmarks/fixtures/small-ts-app/test/auth/session.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts` | test | 63 | related test | benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `test/hallucination-guard.test.ts` | test | 89 | direct importer of src/outputs/policy-engine.ts | test/hallucination-guard.test.ts contains 14 detected symbols, 11 imports, 0 exports. |
| `src/outputs/task-run.ts` | dependency-neighbor | 203 | lexical match: regression, direct dependency of test/regression-guard.test.ts, direct dependency of src/benchmarks/agent-benchmark.ts, direct dependency of src/outputs/orchestrator.ts, direct importer of src/outputs/task-context.ts, direct importer of src/outputs/regression-guard.ts | src/outputs/task-run.ts contains 43 detected symbols, 11 imports, 4 exports. |
| `src/outputs/writer.ts` | dependency-neighbor | 265 | lexical match: regression, direct dependency of test/regression-guard.test.ts, direct dependency of src/benchmarks/agent-benchmark.ts, direct dependency of src/outputs/orchestrator.ts, direct importer of src/outputs/regression-guard.ts, direct importer of src/outputs/task-context.ts | src/outputs/writer.ts contains 61 detected symbols, 19 imports, 2 exports. |
| `src/outputs/task-harness.ts` | dependency-neighbor | 280 | lexical match: regression, direct dependency of src/outputs/orchestrator.ts, direct importer of src/outputs/task-context.ts, direct importer of src/outputs/regression-guard.ts | src/outputs/task-harness.ts contains 68 detected symbols, 8 imports, 5 exports. |
| `src/outputs/guard-finding.ts` | dependency-neighbor | 126 | lexical match: regression, direct importer of src/outputs/policy-engine.ts, direct importer of src/outputs/regression-guard.ts, direct dependency of src/outputs/guard-gates.ts, direct dependency of src/outputs/orchestrator.ts | src/outputs/guard-finding.ts contains 8 detected symbols, 3 imports, 7 exports. |
| `src/outputs/test-selector.ts` | dependency-neighbor | 249 | lexical match: regression, direct dependency of src/outputs/policy-engine.ts, direct importer of src/integrations/codegraph.ts | src/outputs/test-selector.ts contains 50 detected symbols, 4 imports, 4 exports. |
| `src/outputs/execution-trace.ts` | dependency-neighbor | 330 | direct dependency of src/benchmarks/agent-benchmark.ts, direct dependency of src/outputs/guard-gates.ts, direct dependency of src/outputs/orchestrator.ts, direct dependency of src/outputs/policy-engine.ts, direct dependency of src/outputs/regression-guard.ts | src/outputs/execution-trace.ts contains 49 detected symbols, 6 imports, 19 exports. |
| `src/outputs/markdown.ts` | dependency-neighbor | 68 | direct dependency of src/benchmarks/agent-benchmark.ts, direct dependency of src/outputs/orchestrator.ts, direct dependency of src/outputs/policy-engine.ts, direct dependency of src/outputs/regression-guard.ts, direct dependency of src/outputs/task-context.ts | src/outputs/markdown.ts contains 8 detected symbols, 0 imports, 5 exports. |
| `src/core/types.ts` | dependency-neighbor | 300 | direct dependency of src/integrations/codegraph.ts, direct dependency of src/outputs/orchestrator.ts, direct dependency of src/outputs/policy-engine.ts, direct dependency of src/outputs/regression-guard.ts, direct dependency of src/outputs/task-context.ts | src/core/types.ts contains 35 detected symbols, 0 imports, 35 exports. |
| `src/core/git.ts` | dependency-neighbor | 78 | direct dependency of test/regression-guard.test.ts, direct dependency of src/benchmarks/agent-benchmark.ts, direct dependency of src/outputs/orchestrator.ts, direct dependency of src/outputs/policy-engine.ts, direct dependency of src/outputs/regression-guard.ts | src/core/git.ts contains 8 detected symbols, 1 import, 2 exports. |
| `src/outputs/loop-controller.ts` | dependency-neighbor | 302 | direct dependency of src/benchmarks/agent-benchmark.ts, direct dependency of src/outputs/guard-gates.ts, direct importer of src/outputs/task-context.ts, direct dependency of src/outputs/orchestrator.ts | src/outputs/loop-controller.ts contains 60 detected symbols, 13 imports, 10 exports. |
| `src/outputs/impact.ts` | dependency-neighbor | 260 | direct importer of src/integrations/codegraph.ts, direct dependency of src/outputs/orchestrator.ts, direct dependency of src/outputs/policy-engine.ts | src/outputs/impact.ts contains 52 detected symbols, 4 imports, 4 exports. |
| `src/outputs/agent-events.ts` | dependency-neighbor | 293 | direct dependency of src/benchmarks/agent-benchmark.ts, direct importer of src/outputs/orchestrator.ts, direct dependency of src/outputs/orchestrator.ts | src/outputs/agent-events.ts contains 70 detected symbols, 3 imports, 6 exports. |
| `src/outputs/hallucination-guard.ts` | dependency-neighbor | 467 | direct dependency of src/benchmarks/agent-benchmark.ts, direct dependency of src/outputs/orchestrator.ts, direct dependency of src/outputs/policy-engine.ts | src/outputs/hallucination-guard.ts contains 106 detected symbols, 6 imports, 8 exports. |
| `src/core/context-builder.ts` | dependency-neighbor | 106 | direct dependency of test/regression-guard.test.ts, direct dependency of src/benchmarks/agent-benchmark.ts, direct dependency of src/outputs/orchestrator.ts | src/core/context-builder.ts contains 15 detected symbols, 11 imports, 2 exports. |
| `src/core/safe-command.ts` | dependency-neighbor | 158 | direct dependency of src/benchmarks/agent-benchmark.ts, direct dependency of src/integrations/codegraph.ts, direct dependency of src/outputs/orchestrator.ts | src/core/safe-command.ts contains 26 detected symbols, 1 import, 5 exports. |
| `src/core/freshness.ts` | dependency-neighbor | 290 | direct importer of src/outputs/task-context.ts, direct dependency of src/outputs/policy-engine.ts | src/core/freshness.ts contains 57 detected symbols, 8 imports, 9 exports. |
| `src/benchmarks/benchmark.ts` | dependency-neighbor | 452 | direct dependency of src/benchmarks/agent-benchmark.ts, direct importer of src/outputs/task-context.ts | src/benchmarks/benchmark.ts contains 90 detected symbols, 7 imports, 11 exports. |
| `src/outputs/evidence.ts` | dependency-neighbor | 224 | direct dependency of src/outputs/policy-engine.ts, direct dependency of src/outputs/regression-guard.ts | src/outputs/evidence.ts contains 38 detected symbols, 1 import, 8 exports. |
| `src/retrievers/codegraph.ts` | dependency-neighbor | 69 | direct importer of src/integrations/codegraph.ts | src/retrievers/codegraph.ts contains 3 detected symbols, 6 imports, 1 export. |
| `src/outputs/contract-validator.ts` | dependency-neighbor | 327 | direct dependency of src/outputs/policy-engine.ts | src/outputs/contract-validator.ts contains 65 detected symbols, 6 imports, 5 exports. |
| `src/core/token-estimator.ts` | dependency-neighbor | 132 | direct dependency of src/outputs/task-context.ts | src/core/token-estimator.ts contains 15 detected symbols, 3 imports, 7 exports. |
| `src/retrievers/types.ts` | dependency-neighbor | 79 | direct dependency of src/integrations/codegraph.ts | src/retrievers/types.ts contains 4 detected symbols, 0 imports, 4 exports. |
| `src/sandbox/git-worktree-sandbox.ts` | dependency-neighbor | 115 | direct dependency of src/outputs/orchestrator.ts | src/sandbox/git-worktree-sandbox.ts contains 19 detected symbols, 6 imports, 1 export. |
| `src/sandbox/sandbox-adapter.ts` | dependency-neighbor | 67 | direct dependency of src/outputs/orchestrator.ts | src/sandbox/sandbox-adapter.ts contains 3 detected symbols, 0 imports, 3 exports. |
| `src/sandbox/host-sandbox.ts` | dependency-neighbor | 68 | direct dependency of src/outputs/orchestrator.ts | src/sandbox/host-sandbox.ts contains 6 detected symbols, 3 imports, 1 export. |
| `benchmarks/fixtures/monorepo/packages/api/README.md` | config-doc | 48 | owning module documentation | benchmarks/fixtures/monorepo/packages/api/README.md is a docs file written as Markdown. |
| `benchmarks/README.md` | config-doc | 28 | owning module documentation | benchmarks/README.md is a docs file written as Markdown. |
| `benchmarks/fixtures/monorepo/packages/config/README.md` | config-doc | 45 | owning module documentation | benchmarks/fixtures/monorepo/packages/config/README.md is a docs file written as Markdown. |
| `benchmarks/fixtures/monorepo/packages/web/README.md` | config-doc | 44 | owning module documentation | benchmarks/fixtures/monorepo/packages/web/README.md is a docs file written as Markdown. |
| `docs/integrations/claude-code-mcp.md` | config-doc | 40 | owning module documentation | docs/integrations/claude-code-mcp.md is a docs file written as Markdown. |
| `docs/integrations/codex-mcp.md` | config-doc | 37 | owning module documentation | docs/integrations/codex-mcp.md is a docs file written as Markdown. |
| `docs/integrations/cursor-mcp.md` | config-doc | 38 | owning module documentation | docs/integrations/cursor-mcp.md is a docs file written as Markdown. |
| `docs/integrations/opencode-mcp.md` | config-doc | 39 | owning module documentation | docs/integrations/opencode-mcp.md is a docs file written as Markdown. |
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
| Directly relevant source files | 2,306 | `src/outputs/regression-guard.ts`, `src/outputs/policy-engine.ts`, `src/outputs/orchestrator.ts`, `src/benchmarks/agent-benchmark.ts`, `src/outputs/task-context.ts`, `src/outputs/guard-gates.ts`, `src/integrations/codegraph.ts` |
| Tests | 1,056 | `test/regression-guard.test.ts`, `test/orchestrator.test.ts`, `test/policy-engine.test.ts`, `test/codegraph.test.ts`, `test/task-context.test.ts`, `test/agent-benchmark.test.ts`, `benchmarks/fixtures/small-ts-app/test/api/login.test.ts`, `benchmarks/fixtures/monorepo/packages/api/test/config.test.ts`, `benchmarks/fixtures/fastapi-app/tests/test_users.py`, `benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts`, `benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx`, `benchmarks/fixtures/small-ts-app/test/auth/session.test.ts`, `benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts`, `test/hallucination-guard.test.ts` |
| Dependency neighbors | 5,308 | `src/outputs/task-run.ts`, `src/outputs/writer.ts`, `src/outputs/task-harness.ts`, `src/outputs/guard-finding.ts`, `src/outputs/test-selector.ts`, `src/outputs/execution-trace.ts`, `src/outputs/markdown.ts`, `src/core/types.ts`, `src/core/git.ts`, `src/outputs/loop-controller.ts`, `src/outputs/impact.ts`, `src/outputs/agent-events.ts`, `src/outputs/hallucination-guard.ts`, `src/core/context-builder.ts`, `src/core/safe-command.ts`, `src/core/freshness.ts`, `src/benchmarks/benchmark.ts`, `src/outputs/evidence.ts`, `src/retrievers/codegraph.ts`, `src/outputs/contract-validator.ts`, `src/core/token-estimator.ts`, `src/retrievers/types.ts`, `src/sandbox/git-worktree-sandbox.ts`, `src/sandbox/sandbox-adapter.ts`, `src/sandbox/host-sandbox.ts` |
| Config/docs | 833 | `benchmarks/fixtures/monorepo/packages/api/README.md`, `benchmarks/README.md`, `benchmarks/fixtures/monorepo/packages/config/README.md`, `benchmarks/fixtures/monorepo/packages/web/README.md`, `docs/integrations/claude-code-mcp.md`, `docs/integrations/codex-mcp.md`, `docs/integrations/cursor-mcp.md`, `docs/integrations/opencode-mcp.md`, `benchmarks/fixtures/monorepo/packages/api/package.json`, `package.json`, `benchmarks/fixtures/fastapi-app/pyproject.toml`, `benchmarks/fixtures/monorepo/package.json`, `benchmarks/fixtures/react-app/package.json`, `benchmarks/fixtures/small-ts-app/package.json`, `benchmarks/fixtures/monorepo/packages/config/package.json`, `benchmarks/fixtures/monorepo/packages/shared/package.json`, `benchmarks/fixtures/monorepo/packages/web/package.json`, `.env.example`, `code-agent-plusplus.config.yml`, `tsconfig.json`, `.github/workflows/ci.yml` |
| Entrypoints | 720 | `src/cli/index.ts`, `src/mcp/server.ts` |

Remaining budget: 1,777 estimated tokens

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
