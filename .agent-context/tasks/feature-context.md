# Task Context: add a feature or new behavior

Type: feature
Budget: 3,170 / 12,000 estimated tokens

## Read First
1. `src/benchmarks/benchmark.ts` - lexical match: behavior; defines BenchmarkTaskDefinition
2. `src/cli/index.ts` - direct importer of src/benchmarks/benchmark.ts, entrypoint; defines program
3. `src/mcp/server.ts` - entrypoint; defines repoContextMcpToolNames

## Then Inspect If Needed
- `test/benchmark.test.ts` - direct importer of src/benchmarks/benchmark.ts, related test
- `benchmarks/fixtures/small-ts-app/test/api/login.test.ts` - related test
- `benchmarks/fixtures/monorepo/packages/api/test/config.test.ts` - related test
- `benchmarks/fixtures/fastapi-app/tests/test_users.py` - related test
- `benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts` - related test
- `benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx` - related test
- `benchmarks/fixtures/small-ts-app/test/auth/session.test.ts` - related test
- `benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts` - related test
- `src/core/context-builder.ts` - direct dependency of src/benchmarks/benchmark.ts
- `src/outputs/test-selector.ts` - direct dependency of src/benchmarks/benchmark.ts
- `src/core/types.ts` - direct dependency of src/benchmarks/benchmark.ts
- `src/outputs/markdown.ts` - direct dependency of src/benchmarks/benchmark.ts
- `src/outputs/task-context.ts` - direct dependency of src/benchmarks/benchmark.ts
- `benchmarks/fixtures/monorepo/packages/api/package.json` - configuration
- `package.json` - configuration
- `benchmarks/fixtures/fastapi-app/pyproject.toml` - configuration

## Why These Files
| File | Category | Tokens | Why | Summary |
| --- | --- | --- | --- | --- |
| `src/benchmarks/benchmark.ts` | direct-source | 452 | lexical match: behavior | src/benchmarks/benchmark.ts contains 90 detected symbols, 7 imports, 11 exports. |
| `src/cli/index.ts` | entrypoint | 270 | direct importer of src/benchmarks/benchmark.ts, entrypoint | src/cli/index.ts contains 89 detected symbols, 28 imports, 0 exports. |
| `src/mcp/server.ts` | entrypoint | 324 | entrypoint | src/mcp/server.ts contains 81 detected symbols, 18 imports, 4 exports. |
| `test/benchmark.test.ts` | test | 50 | direct importer of src/benchmarks/benchmark.ts, related test | test/benchmark.test.ts contains 2 detected symbols, 4 imports, 0 exports. |
| `benchmarks/fixtures/small-ts-app/test/api/login.test.ts` | test | 63 | related test | benchmarks/fixtures/small-ts-app/test/api/login.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/monorepo/packages/api/test/config.test.ts` | test | 66 | related test | benchmarks/fixtures/monorepo/packages/api/test/config.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/fastapi-app/tests/test_users.py` | test | 72 | related test | benchmarks/fixtures/fastapi-app/tests/test_users.py contains 1 detected Python symbol and 1 import. |
| `benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts` | test | 61 | related test | benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx` | test | 64 | related test | benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/small-ts-app/test/auth/session.test.ts` | test | 60 | related test | benchmarks/fixtures/small-ts-app/test/auth/session.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts` | test | 63 | related test | benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `src/core/context-builder.ts` | dependency-neighbor | 106 | direct dependency of src/benchmarks/benchmark.ts | src/core/context-builder.ts contains 15 detected symbols, 11 imports, 2 exports. |
| `src/outputs/test-selector.ts` | dependency-neighbor | 226 | direct dependency of src/benchmarks/benchmark.ts | src/outputs/test-selector.ts contains 44 detected symbols, 3 imports, 4 exports. |
| `src/core/types.ts` | dependency-neighbor | 297 | direct dependency of src/benchmarks/benchmark.ts | src/core/types.ts contains 35 detected symbols, 0 imports, 35 exports. |
| `src/outputs/markdown.ts` | dependency-neighbor | 68 | direct dependency of src/benchmarks/benchmark.ts | src/outputs/markdown.ts contains 8 detected symbols, 0 imports, 5 exports. |
| `src/outputs/task-context.ts` | dependency-neighbor | 252 | direct dependency of src/benchmarks/benchmark.ts | src/outputs/task-context.ts contains 64 detected symbols, 3 imports, 3 exports. |
| `benchmarks/fixtures/monorepo/packages/api/package.json` | config-doc | 51 | configuration | benchmarks/fixtures/monorepo/packages/api/package.json is a config file written as JSON. |
| `package.json` | config-doc | 25 | configuration | package.json is a config file written as JSON. |
| `benchmarks/fixtures/fastapi-app/pyproject.toml` | config-doc | 42 | configuration | benchmarks/fixtures/fastapi-app/pyproject.toml is a config file written as TOML. |
| `benchmarks/fixtures/monorepo/package.json` | config-doc | 40 | configuration | benchmarks/fixtures/monorepo/package.json is a config file written as JSON. |
| `benchmarks/fixtures/react-app/package.json` | config-doc | 40 | configuration | benchmarks/fixtures/react-app/package.json is a config file written as JSON. |
| `benchmarks/fixtures/small-ts-app/package.json` | config-doc | 42 | configuration | benchmarks/fixtures/small-ts-app/package.json is a config file written as JSON. |
| `benchmarks/fixtures/monorepo/packages/web/package.json` | config-doc | 46 | configuration | benchmarks/fixtures/monorepo/packages/web/package.json is a config file written as JSON. |
| `benchmarks/fixtures/monorepo/packages/config/package.json` | config-doc | 48 | configuration | benchmarks/fixtures/monorepo/packages/config/package.json is a config file written as JSON. |
| `benchmarks/fixtures/monorepo/packages/shared/package.json` | config-doc | 48 | configuration | benchmarks/fixtures/monorepo/packages/shared/package.json is a config file written as JSON. |
| `.env.example` | config-doc | 25 | configuration | .env.example is a config file. |
| `repo-context.config.yml` | config-doc | 35 | configuration | repo-context.config.yml is a config file written as YAML. |
| `tsconfig.json` | config-doc | 34 | configuration | tsconfig.json is a config file written as JSON. |
| `.github/workflows/ci.yml` | config-doc | 35 | configuration | .github/workflows/ci.yml is a config file written as YAML. |
| `benchmarks/fixtures/monorepo/packages/api/README.md` | config-doc | 48 | owning module documentation | benchmarks/fixtures/monorepo/packages/api/README.md is a docs file written as Markdown. |
| `benchmarks/README.md` | config-doc | 28 | owning module documentation | benchmarks/README.md is a docs file written as Markdown. |
| `benchmarks/fixtures/monorepo/packages/web/README.md` | config-doc | 44 | owning module documentation | benchmarks/fixtures/monorepo/packages/web/README.md is a docs file written as Markdown. |
| `benchmarks/fixtures/monorepo/packages/config/README.md` | config-doc | 45 | owning module documentation | benchmarks/fixtures/monorepo/packages/config/README.md is a docs file written as Markdown. |

## Budget Packing
| Bucket | Tokens | Files |
| --- | --- | --- |
| Directly relevant source files | 452 | `src/benchmarks/benchmark.ts` |
| Tests | 499 | `test/benchmark.test.ts`, `benchmarks/fixtures/small-ts-app/test/api/login.test.ts`, `benchmarks/fixtures/monorepo/packages/api/test/config.test.ts`, `benchmarks/fixtures/fastapi-app/tests/test_users.py`, `benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts`, `benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx`, `benchmarks/fixtures/small-ts-app/test/auth/session.test.ts`, `benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts` |
| Dependency neighbors | 949 | `src/core/context-builder.ts`, `src/outputs/test-selector.ts`, `src/core/types.ts`, `src/outputs/markdown.ts`, `src/outputs/task-context.ts` |
| Config/docs | 676 | `benchmarks/fixtures/monorepo/packages/api/package.json`, `package.json`, `benchmarks/fixtures/fastapi-app/pyproject.toml`, `benchmarks/fixtures/monorepo/package.json`, `benchmarks/fixtures/react-app/package.json`, `benchmarks/fixtures/small-ts-app/package.json`, `benchmarks/fixtures/monorepo/packages/web/package.json`, `benchmarks/fixtures/monorepo/packages/config/package.json`, `benchmarks/fixtures/monorepo/packages/shared/package.json`, `.env.example`, `repo-context.config.yml`, `tsconfig.json`, `.github/workflows/ci.yml`, `benchmarks/fixtures/monorepo/packages/api/README.md`, `benchmarks/README.md`, `benchmarks/fixtures/monorepo/packages/web/README.md`, `benchmarks/fixtures/monorepo/packages/config/README.md` |
| Entrypoints | 594 | `src/cli/index.ts`, `src/mcp/server.ts` |

Remaining budget: 8,830 estimated tokens

## Suggested Commands
- npm run test -- feature
- npm run build
- npm run lint

## Suggested Agent Workflow
- Confirm the intended behavior and entrypoint integration before implementation.
- Read `AGENTS.md` and inspect evidence before editing.
- Open the selected files and dependency neighbors.
- Run detected test/check commands after edits.
