# Task Context: fix a bug or regression

Type: bugfix
Budget: 2,256 / 12,000 estimated tokens

## Read First
1. `src/outputs/task-harness.ts` - lexical match: regression; defines TaskPackWriteResult
2. `src/outputs/test-selector.ts` - lexical match: regression; defines TestSelectionOptions
3. `src/cli/index.ts` - direct importer of src/outputs/test-selector.ts, direct importer of src/outputs/task-harness.ts; defines program

## Then Inspect If Needed
- `test/task-harness.test.ts` - direct importer of src/outputs/task-harness.ts, related test
- `test/test-selector.test.ts` - direct importer of src/outputs/test-selector.ts, related test
- `src/core/types.ts` - direct dependency of src/outputs/task-harness.ts, direct dependency of src/outputs/test-selector.ts
- `src/outputs/markdown.ts` - direct dependency of src/outputs/task-harness.ts, direct dependency of src/outputs/test-selector.ts
- `src/core/git.ts` - direct dependency of src/outputs/task-harness.ts, direct dependency of src/outputs/test-selector.ts
- `src/benchmarks/benchmark.ts` - direct importer of src/outputs/test-selector.ts
- `src/outputs/task-context.ts` - direct dependency of src/outputs/task-harness.ts
- `benchmarks/fixtures/monorepo/packages/api/package.json` - configuration
- `package.json` - configuration
- `benchmarks/fixtures/fastapi-app/pyproject.toml` - configuration
- `benchmarks/fixtures/monorepo/package.json` - configuration
- `benchmarks/fixtures/react-app/package.json` - configuration
- `benchmarks/fixtures/small-ts-app/package.json` - configuration
- `benchmarks/fixtures/monorepo/packages/config/package.json` - configuration
- `benchmarks/fixtures/monorepo/packages/shared/package.json` - configuration
- `benchmarks/fixtures/monorepo/packages/web/package.json` - configuration

## Why These Files
| File | Category | Tokens | Why | Summary |
| --- | --- | --- | --- | --- |
| `src/outputs/task-harness.ts` | direct-source | 274 | lexical match: regression | src/outputs/task-harness.ts contains 66 detected symbols, 6 imports, 5 exports. |
| `src/outputs/test-selector.ts` | direct-source | 226 | lexical match: regression | src/outputs/test-selector.ts contains 44 detected symbols, 3 imports, 4 exports. |
| `src/cli/index.ts` | entrypoint | 159 | direct importer of src/outputs/test-selector.ts, direct importer of src/outputs/task-harness.ts, entrypoint | src/cli/index.ts contains 48 detected symbols, 21 imports, 0 exports. |
| `test/task-harness.test.ts` | test | 72 | direct importer of src/outputs/task-harness.ts, related test | test/task-harness.test.ts contains 12 detected symbols, 8 imports, 0 exports. |
| `test/test-selector.test.ts` | test | 84 | direct importer of src/outputs/test-selector.ts, related test | test/test-selector.test.ts contains 15 detected symbols, 8 imports, 0 exports. |
| `src/core/types.ts` | dependency-neighbor | 291 | direct dependency of src/outputs/task-harness.ts, direct dependency of src/outputs/test-selector.ts | src/core/types.ts contains 34 detected symbols, 0 imports, 34 exports. |
| `src/outputs/markdown.ts` | dependency-neighbor | 68 | direct dependency of src/outputs/task-harness.ts, direct dependency of src/outputs/test-selector.ts | src/outputs/markdown.ts contains 8 detected symbols, 0 imports, 5 exports. |
| `src/core/git.ts` | dependency-neighbor | 73 | direct dependency of src/outputs/task-harness.ts, direct dependency of src/outputs/test-selector.ts | src/core/git.ts contains 7 detected symbols, 1 import, 2 exports. |
| `src/benchmarks/benchmark.ts` | dependency-neighbor | 246 | direct importer of src/outputs/test-selector.ts | src/benchmarks/benchmark.ts contains 44 detected symbols, 7 imports, 7 exports. |
| `src/outputs/task-context.ts` | dependency-neighbor | 252 | direct dependency of src/outputs/task-harness.ts | src/outputs/task-context.ts contains 64 detected symbols, 3 imports, 3 exports. |
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
| `repo-context.config.yml` | config-doc | 35 | configuration | repo-context.config.yml is a config file written as YAML. |
| `tsconfig.json` | config-doc | 34 | configuration | tsconfig.json is a config file written as JSON. |
| `.github/workflows/ci.yml` | config-doc | 35 | configuration | .github/workflows/ci.yml is a config file written as YAML. |

## Budget Packing
| Bucket | Tokens | Files |
| --- | --- | --- |
| Directly relevant source files | 500 | `src/outputs/task-harness.ts`, `src/outputs/test-selector.ts` |
| Tests | 156 | `test/task-harness.test.ts`, `test/test-selector.test.ts` |
| Dependency neighbors | 930 | `src/core/types.ts`, `src/outputs/markdown.ts`, `src/core/git.ts`, `src/benchmarks/benchmark.ts`, `src/outputs/task-context.ts` |
| Config/docs | 511 | `benchmarks/fixtures/monorepo/packages/api/package.json`, `package.json`, `benchmarks/fixtures/fastapi-app/pyproject.toml`, `benchmarks/fixtures/monorepo/package.json`, `benchmarks/fixtures/react-app/package.json`, `benchmarks/fixtures/small-ts-app/package.json`, `benchmarks/fixtures/monorepo/packages/config/package.json`, `benchmarks/fixtures/monorepo/packages/shared/package.json`, `benchmarks/fixtures/monorepo/packages/web/package.json`, `.env.example`, `repo-context.config.yml`, `tsconfig.json`, `.github/workflows/ci.yml` |
| Entrypoints | 159 | `src/cli/index.ts` |

Remaining budget: 9,744 estimated tokens

## Suggested Commands
- npm run test -- regression

## Suggested Agent Workflow
- Reproduce the failure and inspect related tests first.
- Read `AGENTS.md` and inspect evidence before editing.
- Open the selected files and dependency neighbors.
- Run detected test/check commands after edits.
