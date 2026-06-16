# Task Context: add a feature or new behavior

Type: feature
Budget: 6,974 / 12,000 estimated tokens

## Read First
1. `src/benchmarks/agent-benchmark.ts` - lexical match: behavior, direct importer of src/benchmarks/benchmark.ts; defines AgentBenchmarkFinalDecision
2. `src/benchmarks/benchmark.ts` - lexical match: behavior, direct dependency of src/benchmarks/agent-benchmark.ts; defines BenchmarkTaskDefinition
3. `src/cli/index.ts` - direct importer of src/benchmarks/benchmark.ts, direct importer of src/benchmarks/agent-benchmark.ts; defines program
4. `src/mcp/server.ts` - entrypoint; defines codeAgentPlusplusMcpToolNames

## Then Inspect If Needed
- `test/agent-benchmark.test.ts` - direct importer of src/benchmarks/agent-benchmark.ts, related test
- `test/benchmark.test.ts` - direct importer of src/benchmarks/benchmark.ts, related test
- `benchmarks/fixtures/small-ts-app/test/api/login.test.ts` - related test
- `benchmarks/fixtures/monorepo/packages/api/test/config.test.ts` - related test
- `benchmarks/fixtures/fastapi-app/tests/test_users.py` - related test
- `benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts` - related test
- `benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx` - related test
- `benchmarks/fixtures/small-ts-app/test/auth/session.test.ts` - related test
- `benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts` - related test
- `src/core/context-builder.ts` - direct dependency of src/benchmarks/agent-benchmark.ts, direct dependency of src/benchmarks/benchmark.ts
- `src/outputs/markdown.ts` - direct dependency of src/benchmarks/agent-benchmark.ts, direct dependency of src/benchmarks/benchmark.ts
- `src/outputs/loop-controller.ts` - direct dependency of src/benchmarks/agent-benchmark.ts
- `src/outputs/policy-engine.ts` - direct dependency of src/benchmarks/agent-benchmark.ts
- `src/outputs/regression-guard.ts` - direct dependency of src/benchmarks/agent-benchmark.ts
- `src/outputs/execution-trace.ts` - direct dependency of src/benchmarks/agent-benchmark.ts
- `src/outputs/hallucination-guard.ts` - direct dependency of src/benchmarks/agent-benchmark.ts

## Why These Files
| File | Category | Tokens | Why | Summary |
| --- | --- | --- | --- | --- |
| `src/benchmarks/agent-benchmark.ts` | direct-source | 364 | lexical match: behavior, direct importer of src/benchmarks/benchmark.ts | src/benchmarks/agent-benchmark.ts contains 71 detected symbols, 17 imports, 9 exports. |
| `src/benchmarks/benchmark.ts` | direct-source | 452 | lexical match: behavior, direct dependency of src/benchmarks/agent-benchmark.ts | src/benchmarks/benchmark.ts contains 90 detected symbols, 7 imports, 11 exports. |
| `src/cli/index.ts` | entrypoint | 315 | direct importer of src/benchmarks/benchmark.ts, direct importer of src/benchmarks/agent-benchmark.ts, entrypoint | src/cli/index.ts contains 104 detected symbols, 33 imports, 0 exports. |
| `src/mcp/server.ts` | entrypoint | 339 | entrypoint | src/mcp/server.ts contains 81 detected symbols, 18 imports, 4 exports. |
| `test/agent-benchmark.test.ts` | test | 53 | direct importer of src/benchmarks/agent-benchmark.ts, related test | test/agent-benchmark.test.ts contains 2 detected symbols, 4 imports, 0 exports. |
| `test/benchmark.test.ts` | test | 50 | direct importer of src/benchmarks/benchmark.ts, related test | test/benchmark.test.ts contains 2 detected symbols, 4 imports, 0 exports. |
| `benchmarks/fixtures/small-ts-app/test/api/login.test.ts` | test | 63 | related test | benchmarks/fixtures/small-ts-app/test/api/login.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/monorepo/packages/api/test/config.test.ts` | test | 66 | related test | benchmarks/fixtures/monorepo/packages/api/test/config.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/fastapi-app/tests/test_users.py` | test | 72 | related test | benchmarks/fixtures/fastapi-app/tests/test_users.py contains 1 detected Python symbol and 1 import. |
| `benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts` | test | 61 | related test | benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx` | test | 64 | related test | benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/small-ts-app/test/auth/session.test.ts` | test | 60 | related test | benchmarks/fixtures/small-ts-app/test/auth/session.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts` | test | 63 | related test | benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `src/core/context-builder.ts` | dependency-neighbor | 106 | direct dependency of src/benchmarks/agent-benchmark.ts, direct dependency of src/benchmarks/benchmark.ts | src/core/context-builder.ts contains 15 detected symbols, 11 imports, 2 exports. |
| `src/outputs/markdown.ts` | dependency-neighbor | 68 | direct dependency of src/benchmarks/agent-benchmark.ts, direct dependency of src/benchmarks/benchmark.ts | src/outputs/markdown.ts contains 8 detected symbols, 0 imports, 5 exports. |
| `src/outputs/loop-controller.ts` | dependency-neighbor | 302 | direct dependency of src/benchmarks/agent-benchmark.ts | src/outputs/loop-controller.ts contains 60 detected symbols, 13 imports, 10 exports. |
| `src/outputs/policy-engine.ts` | dependency-neighbor | 271 | direct dependency of src/benchmarks/agent-benchmark.ts | src/outputs/policy-engine.ts contains 48 detected symbols, 11 imports, 9 exports. |
| `src/outputs/regression-guard.ts` | dependency-neighbor | 297 | direct dependency of src/benchmarks/agent-benchmark.ts | src/outputs/regression-guard.ts contains 61 detected symbols, 7 imports, 8 exports. |
| `src/outputs/execution-trace.ts` | dependency-neighbor | 330 | direct dependency of src/benchmarks/agent-benchmark.ts | src/outputs/execution-trace.ts contains 49 detected symbols, 6 imports, 19 exports. |
| `src/outputs/hallucination-guard.ts` | dependency-neighbor | 467 | direct dependency of src/benchmarks/agent-benchmark.ts | src/outputs/hallucination-guard.ts contains 106 detected symbols, 6 imports, 8 exports. |
| `src/outputs/task-run.ts` | dependency-neighbor | 203 | direct dependency of src/benchmarks/agent-benchmark.ts | src/outputs/task-run.ts contains 43 detected symbols, 11 imports, 4 exports. |
| `src/outputs/orchestrator.ts` | dependency-neighbor | 626 | direct dependency of src/benchmarks/agent-benchmark.ts | src/outputs/orchestrator.ts contains 136 detected symbols, 23 imports, 12 exports. |
| `src/outputs/test-selector.ts` | dependency-neighbor | 249 | direct dependency of src/benchmarks/benchmark.ts | src/outputs/test-selector.ts contains 50 detected symbols, 4 imports, 4 exports. |
| `src/outputs/writer.ts` | dependency-neighbor | 265 | direct dependency of src/benchmarks/agent-benchmark.ts | src/outputs/writer.ts contains 61 detected symbols, 19 imports, 2 exports. |
| `src/core/safe-command.ts` | dependency-neighbor | 158 | direct dependency of src/benchmarks/agent-benchmark.ts | src/core/safe-command.ts contains 26 detected symbols, 1 import, 5 exports. |
| `src/core/types.ts` | dependency-neighbor | 300 | direct dependency of src/benchmarks/benchmark.ts | src/core/types.ts contains 35 detected symbols, 0 imports, 35 exports. |
| `src/outputs/task-context.ts` | dependency-neighbor | 260 | direct dependency of src/benchmarks/benchmark.ts | src/outputs/task-context.ts contains 67 detected symbols, 4 imports, 3 exports. |
| `src/outputs/agent-events.ts` | dependency-neighbor | 293 | direct dependency of src/benchmarks/agent-benchmark.ts | src/outputs/agent-events.ts contains 70 detected symbols, 3 imports, 6 exports. |
| `src/core/git.ts` | dependency-neighbor | 78 | direct dependency of src/benchmarks/agent-benchmark.ts | src/core/git.ts contains 8 detected symbols, 1 import, 2 exports. |
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
| `benchmarks/fixtures/monorepo/packages/api/README.md` | config-doc | 48 | owning module documentation | benchmarks/fixtures/monorepo/packages/api/README.md is a docs file written as Markdown. |
| `benchmarks/README.md` | config-doc | 28 | owning module documentation | benchmarks/README.md is a docs file written as Markdown. |
| `benchmarks/fixtures/monorepo/packages/config/README.md` | config-doc | 45 | owning module documentation | benchmarks/fixtures/monorepo/packages/config/README.md is a docs file written as Markdown. |
| `benchmarks/fixtures/monorepo/packages/web/README.md` | config-doc | 44 | owning module documentation | benchmarks/fixtures/monorepo/packages/web/README.md is a docs file written as Markdown. |

## Budget Packing
| Bucket | Tokens | Files |
| --- | --- | --- |
| Directly relevant source files | 816 | `src/benchmarks/agent-benchmark.ts`, `src/benchmarks/benchmark.ts` |
| Tests | 552 | `test/agent-benchmark.test.ts`, `test/benchmark.test.ts`, `benchmarks/fixtures/small-ts-app/test/api/login.test.ts`, `benchmarks/fixtures/monorepo/packages/api/test/config.test.ts`, `benchmarks/fixtures/fastapi-app/tests/test_users.py`, `benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts`, `benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx`, `benchmarks/fixtures/small-ts-app/test/auth/session.test.ts`, `benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts` |
| Dependency neighbors | 4,273 | `src/core/context-builder.ts`, `src/outputs/markdown.ts`, `src/outputs/loop-controller.ts`, `src/outputs/policy-engine.ts`, `src/outputs/regression-guard.ts`, `src/outputs/execution-trace.ts`, `src/outputs/hallucination-guard.ts`, `src/outputs/task-run.ts`, `src/outputs/orchestrator.ts`, `src/outputs/test-selector.ts`, `src/outputs/writer.ts`, `src/core/safe-command.ts`, `src/core/types.ts`, `src/outputs/task-context.ts`, `src/outputs/agent-events.ts`, `src/core/git.ts` |
| Config/docs | 679 | `benchmarks/fixtures/monorepo/packages/api/package.json`, `package.json`, `benchmarks/fixtures/fastapi-app/pyproject.toml`, `benchmarks/fixtures/monorepo/package.json`, `benchmarks/fixtures/react-app/package.json`, `benchmarks/fixtures/small-ts-app/package.json`, `benchmarks/fixtures/monorepo/packages/config/package.json`, `benchmarks/fixtures/monorepo/packages/shared/package.json`, `benchmarks/fixtures/monorepo/packages/web/package.json`, `.env.example`, `code-agent-plusplus.config.yml`, `tsconfig.json`, `.github/workflows/ci.yml`, `benchmarks/fixtures/monorepo/packages/api/README.md`, `benchmarks/README.md`, `benchmarks/fixtures/monorepo/packages/config/README.md`, `benchmarks/fixtures/monorepo/packages/web/README.md` |
| Entrypoints | 654 | `src/cli/index.ts`, `src/mcp/server.ts` |

Remaining budget: 5,026 estimated tokens

## Suggested Commands
- npm run test -- feature
- npm run build
- npm run lint

## Anti-Regression Notes
- None detected.

## Required Regression Tests
- None detected.

## Suggested Agent Workflow
- Confirm the intended behavior and entrypoint integration before implementation.
- Read `AGENTS.md` and inspect evidence before editing.
- Open the selected files and dependency neighbors.
- Run detected test/check commands after edits.
