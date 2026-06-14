# Task Context: fix a bug or regression

Type: bugfix
Budget: 4,464 / 12,000 estimated tokens

## Read First
1. `src/outputs/task-harness.ts` - lexical match: regression; defines TaskPackWriteResult
2. `src/outputs/test-selector.ts` - lexical match: regression; defines TestSelectionOptions
3. `src/mcp/server.ts` - direct importer of src/outputs/task-harness.ts, direct importer of src/outputs/test-selector.ts; defines repoContextMcpToolNames
4. `src/cli/index.ts` - direct importer of src/outputs/test-selector.ts, direct importer of src/outputs/task-harness.ts; defines program

## Then Inspect If Needed
- `test/task-harness.test.ts` - direct importer of src/outputs/task-harness.ts, related test
- `test/test-selector.test.ts` - direct importer of src/outputs/test-selector.ts, related test
- `test/contract-validator.test.ts` - direct importer of src/outputs/task-harness.ts
- `src/outputs/task-run.ts` - direct importer of src/outputs/task-harness.ts, direct importer of src/outputs/test-selector.ts
- `src/core/types.ts` - direct dependency of src/outputs/task-harness.ts, direct dependency of src/outputs/test-selector.ts
- `src/outputs/markdown.ts` - direct dependency of src/outputs/task-harness.ts, direct dependency of src/outputs/test-selector.ts
- `src/core/git.ts` - direct dependency of src/outputs/task-harness.ts, direct dependency of src/outputs/test-selector.ts
- `src/outputs/loop-controller.ts` - direct importer of src/outputs/test-selector.ts
- `src/outputs/policy-engine.ts` - direct importer of src/outputs/test-selector.ts
- `src/outputs/orchestrator.ts` - direct importer of src/outputs/task-harness.ts
- `src/benchmarks/benchmark.ts` - direct importer of src/outputs/test-selector.ts
- `src/outputs/contract-validator.ts` - direct dependency of src/outputs/task-harness.ts
- `src/outputs/task-context.ts` - direct dependency of src/outputs/task-harness.ts
- `benchmarks/fixtures/monorepo/packages/api/package.json` - configuration
- `package.json` - configuration
- `benchmarks/fixtures/fastapi-app/pyproject.toml` - configuration

## Why These Files
| File | Category | Tokens | Why | Summary |
| --- | --- | --- | --- | --- |
| `src/outputs/task-harness.ts` | direct-source | 277 | lexical match: regression | src/outputs/task-harness.ts contains 67 detected symbols, 7 imports, 5 exports. |
| `src/outputs/test-selector.ts` | direct-source | 226 | lexical match: regression | src/outputs/test-selector.ts contains 44 detected symbols, 3 imports, 4 exports. |
| `src/mcp/server.ts` | entrypoint | 324 | direct importer of src/outputs/task-harness.ts, direct importer of src/outputs/test-selector.ts, entrypoint | src/mcp/server.ts contains 81 detected symbols, 18 imports, 4 exports. |
| `src/cli/index.ts` | entrypoint | 281 | direct importer of src/outputs/test-selector.ts, direct importer of src/outputs/task-harness.ts, entrypoint | src/cli/index.ts contains 93 detected symbols, 29 imports, 0 exports. |
| `test/task-harness.test.ts` | test | 84 | direct importer of src/outputs/task-harness.ts, related test | test/task-harness.test.ts contains 18 detected symbols, 9 imports, 0 exports. |
| `test/test-selector.test.ts` | test | 84 | direct importer of src/outputs/test-selector.ts, related test | test/test-selector.test.ts contains 15 detected symbols, 8 imports, 0 exports. |
| `test/contract-validator.test.ts` | test | 81 | direct importer of src/outputs/task-harness.ts | test/contract-validator.test.ts contains 12 detected symbols, 10 imports, 0 exports. |
| `src/outputs/task-run.ts` | dependency-neighbor | 199 | direct importer of src/outputs/task-harness.ts, direct importer of src/outputs/test-selector.ts | src/outputs/task-run.ts contains 42 detected symbols, 10 imports, 4 exports. |
| `src/core/types.ts` | dependency-neighbor | 297 | direct dependency of src/outputs/task-harness.ts, direct dependency of src/outputs/test-selector.ts | src/core/types.ts contains 35 detected symbols, 0 imports, 35 exports. |
| `src/outputs/markdown.ts` | dependency-neighbor | 68 | direct dependency of src/outputs/task-harness.ts, direct dependency of src/outputs/test-selector.ts | src/outputs/markdown.ts contains 8 detected symbols, 0 imports, 5 exports. |
| `src/core/git.ts` | dependency-neighbor | 78 | direct dependency of src/outputs/task-harness.ts, direct dependency of src/outputs/test-selector.ts | src/core/git.ts contains 8 detected symbols, 1 import, 2 exports. |
| `src/outputs/loop-controller.ts` | dependency-neighbor | 302 | direct importer of src/outputs/test-selector.ts | src/outputs/loop-controller.ts contains 60 detected symbols, 13 imports, 10 exports. |
| `src/outputs/policy-engine.ts` | dependency-neighbor | 255 | direct importer of src/outputs/test-selector.ts | src/outputs/policy-engine.ts contains 45 detected symbols, 9 imports, 9 exports. |
| `src/outputs/orchestrator.ts` | dependency-neighbor | 366 | direct importer of src/outputs/task-harness.ts | src/outputs/orchestrator.ts contains 77 detected symbols, 15 imports, 9 exports. |
| `src/benchmarks/benchmark.ts` | dependency-neighbor | 452 | direct importer of src/outputs/test-selector.ts | src/benchmarks/benchmark.ts contains 90 detected symbols, 7 imports, 11 exports. |
| `src/outputs/contract-validator.ts` | dependency-neighbor | 327 | direct dependency of src/outputs/task-harness.ts | src/outputs/contract-validator.ts contains 65 detected symbols, 6 imports, 5 exports. |
| `src/outputs/task-context.ts` | dependency-neighbor | 252 | direct dependency of src/outputs/task-harness.ts | src/outputs/task-context.ts contains 64 detected symbols, 3 imports, 3 exports. |
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
| `repo-context.config.yml` | config-doc | 35 | configuration | repo-context.config.yml is a config file written as YAML. |
| `tsconfig.json` | config-doc | 34 | configuration | tsconfig.json is a config file written as JSON. |
| `.github/workflows/ci.yml` | config-doc | 35 | configuration | .github/workflows/ci.yml is a config file written as YAML. |

## Budget Packing
| Bucket | Tokens | Files |
| --- | --- | --- |
| Directly relevant source files | 503 | `src/outputs/task-harness.ts`, `src/outputs/test-selector.ts` |
| Tests | 249 | `test/task-harness.test.ts`, `test/test-selector.test.ts`, `test/contract-validator.test.ts` |
| Dependency neighbors | 2,596 | `src/outputs/task-run.ts`, `src/core/types.ts`, `src/outputs/markdown.ts`, `src/core/git.ts`, `src/outputs/loop-controller.ts`, `src/outputs/policy-engine.ts`, `src/outputs/orchestrator.ts`, `src/benchmarks/benchmark.ts`, `src/outputs/contract-validator.ts`, `src/outputs/task-context.ts` |
| Config/docs | 511 | `benchmarks/fixtures/monorepo/packages/api/package.json`, `package.json`, `benchmarks/fixtures/fastapi-app/pyproject.toml`, `benchmarks/fixtures/monorepo/package.json`, `benchmarks/fixtures/small-ts-app/package.json`, `benchmarks/fixtures/react-app/package.json`, `benchmarks/fixtures/monorepo/packages/config/package.json`, `benchmarks/fixtures/monorepo/packages/shared/package.json`, `benchmarks/fixtures/monorepo/packages/web/package.json`, `.env.example`, `repo-context.config.yml`, `tsconfig.json`, `.github/workflows/ci.yml` |
| Entrypoints | 605 | `src/mcp/server.ts`, `src/cli/index.ts` |

Remaining budget: 7,536 estimated tokens

## Suggested Commands
- npm run test -- regression

## Suggested Agent Workflow
- Reproduce the failure and inspect related tests first.
- Read `AGENTS.md` and inspect evidence before editing.
- Open the selected files and dependency neighbors.
- Run detected test/check commands after edits.
