# Task Context: fix a bug or regression

Type: bugfix
Budget: 7,615 / 12,000 estimated tokens

## Read First
1. `src/harness/verification-plane/guards/regression-memory.ts` - lexical match: regression, direct dependency of test/regression-guard.test.ts; defines RegressionMemoryCandidate
2. `src/harness/verification-plane/guards/regression.ts` - lexical match: regression, direct dependency of test/regression-guard.test.ts; defines RegressionMemoryEntry
3. `benchmarks/tasks/regression-session-ttl.json` - lexical match: regression
4. `benchmarks/fixtures/small-ts-app/.agent-context/regression/anti-regression-tests.json` - lexical match: regression
5. `benchmarks/fixtures/small-ts-app/.agent-context/regression/fix-history.json` - lexical match: regression
6. `benchmarks/fixtures/small-ts-app/.agent-context/regression/fragile-modules.json` - lexical match: regression
7. `benchmarks/fixtures/small-ts-app/.agent-context/regression/known-issues.json` - lexical match: regression
8. `src/cli/index.ts` - direct importer of src/harness/verification-plane/guards/regression.ts, direct importer of src/harness/verification-plane/guards/regression-memory.ts; defines program

## Then Inspect If Needed
- `test/regression-guard.test.ts` - lexical match: regression, direct importer of src/harness/verification-plane/guards/regression.ts
- `test/task-harness.test.ts` - related test
- `benchmarks/fixtures/small-ts-app/test/api/login.test.ts` - related test
- `benchmarks/fixtures/monorepo/packages/api/test/config.test.ts` - related test
- `benchmarks/fixtures/fastapi-app/tests/test_users.py` - related test
- `benchmarks/fixtures/small-ts-app/test/auth/session.test.ts` - related test
- `benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts` - related test
- `benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx` - related test
- `benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts` - related test
- `src/harness/control-plane/orchestrator.ts` - lexical match: regression, direct importer of src/harness/verification-plane/guards/regression.ts
- `src/harness/verification-plane/policy-engine.ts` - lexical match: regression, direct dependency of test/regression-guard.test.ts
- `src/outputs/task-run.ts` - lexical match: regression, direct dependency of test/regression-guard.test.ts
- `src/outputs/task-context.ts` - lexical match: regression, direct dependency of test/regression-guard.test.ts
- `src/outputs/task-harness.ts` - lexical match: regression, direct importer of src/harness/verification-plane/guards/regression.ts
- `src/benchmarks/agent-benchmark.ts` - lexical match: regression, direct importer of src/harness/verification-plane/guards/regression.ts
- `src/outputs/test-selector.ts` - lexical match: regression, direct dependency of src/harness/verification-plane/guards/regression-memory.ts

## Why These Files
| File | Category | Tokens | Why | Summary |
| --- | --- | --- | --- | --- |
| `src/harness/verification-plane/guards/regression-memory.ts` | direct-source | 332 | lexical match: regression, direct dependency of test/regression-guard.test.ts, direct importer of src/harness/verification-plane/guards/regression.ts | src/harness/verification-plane/guards/regression-memory.ts contains 56 detected symbols, 7 imports, 9 exports. |
| `src/harness/verification-plane/guards/regression.ts` | direct-source | 318 | lexical match: regression, direct dependency of test/regression-guard.test.ts, direct dependency of src/harness/verification-plane/guards/regression-memory.ts | src/harness/verification-plane/guards/regression.ts contains 64 detected symbols, 8 imports, 8 exports. |
| `benchmarks/tasks/regression-session-ttl.json` | direct-source | 38 | lexical match: regression | benchmarks/tasks/regression-session-ttl.json is a unknown file written as JSON. |
| `benchmarks/fixtures/small-ts-app/.agent-context/regression/anti-regression-tests.json` | direct-source | 58 | lexical match: regression | benchmarks/fixtures/small-ts-app/.agent-context/regression/anti-regression-tests.json is a unknown file written as JSON. |
| `benchmarks/fixtures/small-ts-app/.agent-context/regression/fix-history.json` | direct-source | 53 | lexical match: regression | benchmarks/fixtures/small-ts-app/.agent-context/regression/fix-history.json is a unknown file written as JSON. |
| `benchmarks/fixtures/small-ts-app/.agent-context/regression/fragile-modules.json` | direct-source | 55 | lexical match: regression | benchmarks/fixtures/small-ts-app/.agent-context/regression/fragile-modules.json is a unknown file written as JSON. |
| `benchmarks/fixtures/small-ts-app/.agent-context/regression/known-issues.json` | direct-source | 54 | lexical match: regression | benchmarks/fixtures/small-ts-app/.agent-context/regression/known-issues.json is a unknown file written as JSON. |
| `src/cli/index.ts` | entrypoint | 436 | direct importer of src/harness/verification-plane/guards/regression.ts, direct importer of src/harness/verification-plane/guards/regression-memory.ts, entrypoint | src/cli/index.ts contains 136 detected symbols, 38 imports, 0 exports. |
| `src/mcp/server.ts` | entrypoint | 405 | entrypoint | src/mcp/server.ts contains 102 detected symbols, 19 imports, 4 exports. |
| `test/regression-guard.test.ts` | test | 106 | lexical match: regression, direct importer of src/harness/verification-plane/guards/regression.ts, direct importer of src/harness/verification-plane/guards/regression-memory.ts, related test | test/regression-guard.test.ts contains 23 detected symbols, 13 imports, 0 exports. |
| `test/task-harness.test.ts` | test | 84 | related test | test/task-harness.test.ts contains 18 detected symbols, 9 imports, 0 exports. |
| `benchmarks/fixtures/small-ts-app/test/api/login.test.ts` | test | 63 | related test | benchmarks/fixtures/small-ts-app/test/api/login.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/monorepo/packages/api/test/config.test.ts` | test | 66 | related test | benchmarks/fixtures/monorepo/packages/api/test/config.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/fastapi-app/tests/test_users.py` | test | 72 | related test | benchmarks/fixtures/fastapi-app/tests/test_users.py contains 1 detected Python symbol and 1 import. |
| `benchmarks/fixtures/small-ts-app/test/auth/session.test.ts` | test | 60 | related test | benchmarks/fixtures/small-ts-app/test/auth/session.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts` | test | 61 | related test | benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx` | test | 64 | related test | benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts` | test | 63 | related test | benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `src/harness/control-plane/orchestrator.ts` | dependency-neighbor | 618 | lexical match: regression, direct importer of src/harness/verification-plane/guards/regression.ts, direct importer of src/harness/verification-plane/guards/regression-memory.ts | src/harness/control-plane/orchestrator.ts contains 132 detected symbols, 26 imports, 12 exports. |
| `src/harness/verification-plane/policy-engine.ts` | dependency-neighbor | 310 | lexical match: regression, direct dependency of test/regression-guard.test.ts, direct importer of src/harness/verification-plane/guards/regression.ts | src/harness/verification-plane/policy-engine.ts contains 54 detected symbols, 12 imports, 9 exports. |
| `src/outputs/task-run.ts` | dependency-neighbor | 203 | lexical match: regression, direct dependency of test/regression-guard.test.ts, direct importer of src/harness/verification-plane/guards/regression.ts | src/outputs/task-run.ts contains 43 detected symbols, 11 imports, 4 exports. |
| `src/outputs/task-context.ts` | dependency-neighbor | 260 | lexical match: regression, direct dependency of test/regression-guard.test.ts, direct importer of src/harness/verification-plane/guards/regression.ts | src/outputs/task-context.ts contains 67 detected symbols, 4 imports, 3 exports. |
| `src/outputs/task-harness.ts` | dependency-neighbor | 280 | lexical match: regression, direct importer of src/harness/verification-plane/guards/regression.ts | src/outputs/task-harness.ts contains 68 detected symbols, 8 imports, 5 exports. |
| `src/benchmarks/agent-benchmark.ts` | dependency-neighbor | 466 | lexical match: regression, direct importer of src/harness/verification-plane/guards/regression.ts | src/benchmarks/agent-benchmark.ts contains 98 detected symbols, 17 imports, 9 exports. |
| `src/outputs/test-selector.ts` | dependency-neighbor | 249 | lexical match: regression, direct dependency of src/harness/verification-plane/guards/regression-memory.ts | src/outputs/test-selector.ts contains 50 detected symbols, 4 imports, 4 exports. |
| `src/outputs/renderers/writer.ts` | dependency-neighbor | 270 | lexical match: regression, direct dependency of test/regression-guard.test.ts, direct importer of src/harness/verification-plane/guards/regression.ts | src/outputs/renderers/writer.ts contains 61 detected symbols, 19 imports, 2 exports. |
| `src/integrations/codegraph.ts` | dependency-neighbor | 294 | lexical match: regression | src/integrations/codegraph.ts contains 59 detected symbols, 5 imports, 11 exports. |
| `src/outputs/guard-gates.ts` | dependency-neighbor | 195 | lexical match: regression | src/outputs/guard-gates.ts contains 34 detected symbols, 4 imports, 6 exports. |
| `src/outputs/guard-finding.ts` | dependency-neighbor | 132 | lexical match: regression, direct importer of src/harness/verification-plane/guards/regression.ts | src/outputs/guard-finding.ts contains 9 detected symbols, 4 imports, 7 exports. |
| `src/core/git.ts` | dependency-neighbor | 78 | direct dependency of test/regression-guard.test.ts, direct dependency of src/harness/verification-plane/guards/regression-memory.ts, direct dependency of src/harness/verification-plane/guards/regression.ts | src/core/git.ts contains 8 detected symbols, 1 import, 2 exports. |
| `src/harness/observability/execution-trace.ts` | dependency-neighbor | 337 | direct dependency of src/harness/verification-plane/guards/regression-memory.ts, direct dependency of src/harness/verification-plane/guards/regression.ts | src/harness/observability/execution-trace.ts contains 49 detected symbols, 6 imports, 19 exports. |
| `src/core/types.ts` | dependency-neighbor | 300 | direct dependency of src/harness/verification-plane/guards/regression-memory.ts, direct dependency of src/harness/verification-plane/guards/regression.ts | src/core/types.ts contains 35 detected symbols, 0 imports, 35 exports. |
| `src/core/context-builder.ts` | dependency-neighbor | 106 | direct dependency of test/regression-guard.test.ts | src/core/context-builder.ts contains 15 detected symbols, 11 imports, 2 exports. |
| `src/outputs/renderers/markdown.ts` | dependency-neighbor | 73 | direct dependency of src/harness/verification-plane/guards/regression.ts | src/outputs/renderers/markdown.ts contains 8 detected symbols, 0 imports, 5 exports. |
| `src/harness/types.ts` | dependency-neighbor | 153 | direct dependency of src/harness/verification-plane/guards/regression.ts | src/harness/types.ts contains 16 detected symbols, 0 imports, 11 exports. |
| `src/outputs/evidence.ts` | dependency-neighbor | 224 | direct dependency of src/harness/verification-plane/guards/regression.ts | src/outputs/evidence.ts contains 38 detected symbols, 1 import, 8 exports. |
| `benchmarks/fixtures/monorepo/packages/api/README.md` | config-doc | 48 | owning module documentation | benchmarks/fixtures/monorepo/packages/api/README.md is a docs file written as Markdown. |
| `benchmarks/README.md` | config-doc | 28 | owning module documentation | benchmarks/README.md is a docs file written as Markdown. |
| `benchmarks/fixtures/monorepo/packages/config/README.md` | config-doc | 45 | owning module documentation | benchmarks/fixtures/monorepo/packages/config/README.md is a docs file written as Markdown. |
| `benchmarks/fixtures/monorepo/packages/web/README.md` | config-doc | 44 | owning module documentation | benchmarks/fixtures/monorepo/packages/web/README.md is a docs file written as Markdown. |
| `benchmarks/fixtures/monorepo/packages/api/package.json` | config-doc | 51 | configuration | benchmarks/fixtures/monorepo/packages/api/package.json is a config file written as JSON. |
| `package.json` | config-doc | 25 | configuration | package.json is a config file written as JSON. |
| `benchmarks/fixtures/fastapi-app/pyproject.toml` | config-doc | 42 | configuration | benchmarks/fixtures/fastapi-app/pyproject.toml is a config file written as TOML. |
| `benchmarks/fixtures/monorepo/package.json` | config-doc | 40 | configuration | benchmarks/fixtures/monorepo/package.json is a config file written as JSON. |
| `benchmarks/fixtures/small-ts-app/package.json` | config-doc | 42 | configuration | benchmarks/fixtures/small-ts-app/package.json is a config file written as JSON. |
| `benchmarks/fixtures/react-app/package.json` | config-doc | 40 | configuration | benchmarks/fixtures/react-app/package.json is a config file written as JSON. |
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
| Directly relevant source files | 908 | `src/harness/verification-plane/guards/regression-memory.ts`, `src/harness/verification-plane/guards/regression.ts`, `benchmarks/tasks/regression-session-ttl.json`, `benchmarks/fixtures/small-ts-app/.agent-context/regression/anti-regression-tests.json`, `benchmarks/fixtures/small-ts-app/.agent-context/regression/fix-history.json`, `benchmarks/fixtures/small-ts-app/.agent-context/regression/fragile-modules.json`, `benchmarks/fixtures/small-ts-app/.agent-context/regression/known-issues.json` |
| Tests | 639 | `test/regression-guard.test.ts`, `test/task-harness.test.ts`, `benchmarks/fixtures/small-ts-app/test/api/login.test.ts`, `benchmarks/fixtures/monorepo/packages/api/test/config.test.ts`, `benchmarks/fixtures/fastapi-app/tests/test_users.py`, `benchmarks/fixtures/small-ts-app/test/auth/session.test.ts`, `benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts`, `benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx`, `benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts` |
| Dependency neighbors | 4,548 | `src/harness/control-plane/orchestrator.ts`, `src/harness/verification-plane/policy-engine.ts`, `src/outputs/task-run.ts`, `src/outputs/task-context.ts`, `src/outputs/task-harness.ts`, `src/benchmarks/agent-benchmark.ts`, `src/outputs/test-selector.ts`, `src/outputs/renderers/writer.ts`, `src/integrations/codegraph.ts`, `src/outputs/guard-gates.ts`, `src/outputs/guard-finding.ts`, `src/core/git.ts`, `src/harness/observability/execution-trace.ts`, `src/core/types.ts`, `src/core/context-builder.ts`, `src/outputs/renderers/markdown.ts`, `src/harness/types.ts`, `src/outputs/evidence.ts` |
| Config/docs | 679 | `benchmarks/fixtures/monorepo/packages/api/README.md`, `benchmarks/README.md`, `benchmarks/fixtures/monorepo/packages/config/README.md`, `benchmarks/fixtures/monorepo/packages/web/README.md`, `benchmarks/fixtures/monorepo/packages/api/package.json`, `package.json`, `benchmarks/fixtures/fastapi-app/pyproject.toml`, `benchmarks/fixtures/monorepo/package.json`, `benchmarks/fixtures/small-ts-app/package.json`, `benchmarks/fixtures/react-app/package.json`, `benchmarks/fixtures/monorepo/packages/config/package.json`, `benchmarks/fixtures/monorepo/packages/shared/package.json`, `benchmarks/fixtures/monorepo/packages/web/package.json`, `.env.example`, `code-agent-plusplus.config.yml`, `tsconfig.json`, `.github/workflows/ci.yml` |
| Entrypoints | 841 | `src/cli/index.ts`, `src/mcp/server.ts` |

Remaining budget: 4,385 estimated tokens

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
