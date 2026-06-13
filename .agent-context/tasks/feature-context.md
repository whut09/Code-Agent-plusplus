# Task Context: add a feature or new behavior

Type: feature
Budget: 2,761 / 12,000 estimated tokens

## Read First
1. `src/outputs/task-harness.ts` - key file fallback; defines TaskPackWriteResult
2. `src/core/freshness.ts` - key file fallback; defines TOOL_VERSION
3. `src/outputs/contract-validator.ts` - key file fallback; defines ContractValidationOptions
4. `src/core/token-estimator.ts` - key file fallback; defines estimateTokens
5. `src/core/context-builder.ts` - key file fallback; defines BuildOptions
6. `src/outputs/writer.ts` - key file fallback; defines GENERATED_AGENTS_FILE
7. `src/outputs/impact.ts` - key file fallback; defines ChangeImpactOptions
8. `src/outputs/test-selector.ts` - key file fallback; defines TestSelectionOptions

## Then Inspect If Needed
- `benchmarks/fixtures/monorepo/packages/api/package.json` - configuration
- `package.json` - configuration
- `benchmarks/fixtures/fastapi-app/pyproject.toml` - configuration
- `benchmarks/fixtures/monorepo/package.json` - configuration
- `benchmarks/fixtures/react-app/package.json` - configuration
- `benchmarks/fixtures/small-ts-app/package.json` - configuration
- `benchmarks/fixtures/monorepo/packages/config/package.json` - configuration
- `benchmarks/fixtures/monorepo/packages/shared/package.json` - configuration
- `benchmarks/fixtures/monorepo/packages/web/package.json` - configuration
- `.env.example` - configuration
- `repo-context.config.yml` - configuration
- `tsconfig.json` - configuration
- `.github/workflows/ci.yml` - configuration

## Why These Files
| File | Category | Tokens | Why | Summary |
| --- | --- | --- | --- | --- |
| `src/outputs/task-harness.ts` | direct-source | 277 | key file fallback | src/outputs/task-harness.ts contains 67 detected symbols, 7 imports, 5 exports. |
| `src/core/freshness.ts` | direct-source | 290 | key file fallback | src/core/freshness.ts contains 57 detected symbols, 8 imports, 9 exports. |
| `src/outputs/contract-validator.ts` | direct-source | 327 | key file fallback | src/outputs/contract-validator.ts contains 65 detected symbols, 6 imports, 5 exports. |
| `src/core/token-estimator.ts` | direct-source | 132 | key file fallback | src/core/token-estimator.ts contains 15 detected symbols, 3 imports, 7 exports. |
| `src/core/context-builder.ts` | direct-source | 106 | key file fallback | src/core/context-builder.ts contains 15 detected symbols, 11 imports, 2 exports. |
| `src/outputs/writer.ts` | direct-source | 246 | key file fallback | src/outputs/writer.ts contains 55 detected symbols, 18 imports, 2 exports. |
| `src/outputs/impact.ts` | direct-source | 230 | key file fallback | src/outputs/impact.ts contains 46 detected symbols, 3 imports, 4 exports. |
| `src/outputs/test-selector.ts` | direct-source | 226 | key file fallback | src/outputs/test-selector.ts contains 44 detected symbols, 3 imports, 4 exports. |
| `src/mcp/server.ts` | entrypoint | 226 | entrypoint, key file fallback | src/mcp/server.ts contains 48 detected symbols, 13 imports, 4 exports. |
| `src/cli/index.ts` | entrypoint | 190 | entrypoint, key file fallback | src/cli/index.ts contains 61 detected symbols, 25 imports, 0 exports. |
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
| Directly relevant source files | 1,834 | `src/outputs/task-harness.ts`, `src/core/freshness.ts`, `src/outputs/contract-validator.ts`, `src/core/token-estimator.ts`, `src/core/context-builder.ts`, `src/outputs/writer.ts`, `src/outputs/impact.ts`, `src/outputs/test-selector.ts` |
| Tests | 0 | none |
| Dependency neighbors | 0 | none |
| Config/docs | 511 | `benchmarks/fixtures/monorepo/packages/api/package.json`, `package.json`, `benchmarks/fixtures/fastapi-app/pyproject.toml`, `benchmarks/fixtures/monorepo/package.json`, `benchmarks/fixtures/react-app/package.json`, `benchmarks/fixtures/small-ts-app/package.json`, `benchmarks/fixtures/monorepo/packages/config/package.json`, `benchmarks/fixtures/monorepo/packages/shared/package.json`, `benchmarks/fixtures/monorepo/packages/web/package.json`, `.env.example`, `repo-context.config.yml`, `tsconfig.json`, `.github/workflows/ci.yml` |
| Entrypoints | 416 | `src/mcp/server.ts`, `src/cli/index.ts` |

Remaining budget: 9,239 estimated tokens

## Suggested Commands
- npm run test -- feature
- npm run build
- npm run lint

## Suggested Agent Workflow
- Confirm the intended behavior and entrypoint integration before implementation.
- Read `AGENTS.md` and inspect evidence before editing.
- Open the selected files and dependency neighbors.
- Run detected test/check commands after edits.
