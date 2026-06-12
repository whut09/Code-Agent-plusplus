# Task Context: add a feature or new behavior

Type: feature
Budget: 2,423 / 12,000 estimated tokens

## Read First
1. `src/core/token-estimator.ts` - key file fallback; defines estimateTokens
2. `src/core/context-builder.ts` - key file fallback; defines BuildOptions
3. `src/outputs/task-harness.ts` - key file fallback; defines TaskPackWriteResult
4. `src/core/types.ts` - key file fallback; defines AgentTarget
5. `src/outputs/markdown.ts` - key file fallback; defines heading
6. `src/benchmarks/benchmark.ts` - key file fallback; defines BenchmarkTaskDefinition
7. `src/outputs/task-context.ts` - key file fallback; defines TaskContextOptions
8. `src/outputs/test-selector.ts` - key file fallback; defines TestSelectionOptions

## Then Inspect If Needed
- `benchmarks/fixtures/monorepo/packages/api/package.json` - configuration
- `package.json` - configuration
- `benchmarks/fixtures/fastapi-app/pyproject.toml` - configuration
- `benchmarks/fixtures/monorepo/package.json` - configuration
- `benchmarks/fixtures/react-app/package.json` - configuration
- `benchmarks/fixtures/small-ts-app/package.json` - configuration
- `benchmarks/fixtures/monorepo/packages/config/package.json` - configuration
- `benchmarks/fixtures/monorepo/packages/web/package.json` - configuration
- `benchmarks/fixtures/monorepo/packages/shared/package.json` - configuration
- `.env.example` - configuration
- `repo-context.config.yml` - configuration
- `tsconfig.json` - configuration
- `.github/workflows/ci.yml` - configuration

## Why These Files
| File | Category | Tokens | Why | Summary |
| --- | --- | --- | --- | --- |
| `src/core/token-estimator.ts` | direct-source | 104 | key file fallback | src/core/token-estimator.ts contains 9 detected symbols, 2 imports, 5 exports. |
| `src/core/context-builder.ts` | direct-source | 90 | key file fallback | src/core/context-builder.ts contains 11 detected symbols, 10 imports, 2 exports. |
| `src/outputs/task-harness.ts` | direct-source | 274 | key file fallback | src/outputs/task-harness.ts contains 66 detected symbols, 6 imports, 5 exports. |
| `src/core/types.ts` | direct-source | 291 | key file fallback | src/core/types.ts contains 34 detected symbols, 0 imports, 34 exports. |
| `src/outputs/markdown.ts` | direct-source | 68 | key file fallback | src/outputs/markdown.ts contains 8 detected symbols, 0 imports, 5 exports. |
| `src/benchmarks/benchmark.ts` | direct-source | 246 | key file fallback | src/benchmarks/benchmark.ts contains 44 detected symbols, 7 imports, 7 exports. |
| `src/outputs/task-context.ts` | direct-source | 252 | key file fallback | src/outputs/task-context.ts contains 64 detected symbols, 3 imports, 3 exports. |
| `src/outputs/test-selector.ts` | direct-source | 226 | key file fallback | src/outputs/test-selector.ts contains 44 detected symbols, 3 imports, 4 exports. |
| `src/core/token-savings.ts` | direct-source | 198 | key file fallback | src/core/token-savings.ts contains 30 detected symbols, 2 imports, 3 exports. |
| `src/cli/index.ts` | entrypoint | 163 | entrypoint, key file fallback | src/cli/index.ts contains 50 detected symbols, 22 imports, 0 exports. |
| `benchmarks/fixtures/monorepo/packages/api/package.json` | config-doc | 51 | configuration | benchmarks/fixtures/monorepo/packages/api/package.json is a config file written as JSON. |
| `package.json` | config-doc | 25 | configuration | package.json is a config file written as JSON. |
| `benchmarks/fixtures/fastapi-app/pyproject.toml` | config-doc | 42 | configuration | benchmarks/fixtures/fastapi-app/pyproject.toml is a config file written as TOML. |
| `benchmarks/fixtures/monorepo/package.json` | config-doc | 40 | configuration | benchmarks/fixtures/monorepo/package.json is a config file written as JSON. |
| `benchmarks/fixtures/react-app/package.json` | config-doc | 40 | configuration | benchmarks/fixtures/react-app/package.json is a config file written as JSON. |
| `benchmarks/fixtures/small-ts-app/package.json` | config-doc | 42 | configuration | benchmarks/fixtures/small-ts-app/package.json is a config file written as JSON. |
| `benchmarks/fixtures/monorepo/packages/config/package.json` | config-doc | 48 | configuration | benchmarks/fixtures/monorepo/packages/config/package.json is a config file written as JSON. |
| `benchmarks/fixtures/monorepo/packages/web/package.json` | config-doc | 46 | configuration | benchmarks/fixtures/monorepo/packages/web/package.json is a config file written as JSON. |
| `benchmarks/fixtures/monorepo/packages/shared/package.json` | config-doc | 48 | configuration | benchmarks/fixtures/monorepo/packages/shared/package.json is a config file written as JSON. |
| `.env.example` | config-doc | 25 | configuration | .env.example is a config file. |
| `repo-context.config.yml` | config-doc | 35 | configuration | repo-context.config.yml is a config file written as YAML. |
| `tsconfig.json` | config-doc | 34 | configuration | tsconfig.json is a config file written as JSON. |
| `.github/workflows/ci.yml` | config-doc | 35 | configuration | .github/workflows/ci.yml is a config file written as YAML. |

## Budget Packing
| Bucket | Tokens | Files |
| --- | --- | --- |
| Directly relevant source files | 1,749 | `src/core/token-estimator.ts`, `src/core/context-builder.ts`, `src/outputs/task-harness.ts`, `src/core/types.ts`, `src/outputs/markdown.ts`, `src/benchmarks/benchmark.ts`, `src/outputs/task-context.ts`, `src/outputs/test-selector.ts`, `src/core/token-savings.ts` |
| Tests | 0 | none |
| Dependency neighbors | 0 | none |
| Config/docs | 511 | `benchmarks/fixtures/monorepo/packages/api/package.json`, `package.json`, `benchmarks/fixtures/fastapi-app/pyproject.toml`, `benchmarks/fixtures/monorepo/package.json`, `benchmarks/fixtures/react-app/package.json`, `benchmarks/fixtures/small-ts-app/package.json`, `benchmarks/fixtures/monorepo/packages/config/package.json`, `benchmarks/fixtures/monorepo/packages/web/package.json`, `benchmarks/fixtures/monorepo/packages/shared/package.json`, `.env.example`, `repo-context.config.yml`, `tsconfig.json`, `.github/workflows/ci.yml` |
| Entrypoints | 163 | `src/cli/index.ts` |

Remaining budget: 9,577 estimated tokens

## Suggested Commands
- npm run test -- feature
- npm run build
- npm run lint

## Suggested Agent Workflow
- Confirm the intended behavior and entrypoint integration before implementation.
- Read `AGENTS.md` and inspect evidence before editing.
- Open the selected files and dependency neighbors.
- Run detected test/check commands after edits.
