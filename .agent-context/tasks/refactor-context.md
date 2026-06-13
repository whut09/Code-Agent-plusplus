# Task Context: refactor code safely

Type: refactor
Budget: 8,571 / 12,000 estimated tokens

## Read First
1. `benchmarks/tasks/refactor-config-loader.json` - lexical match: refactor
2. `assets/agent-context-code-layers.png` - lexical match: code
3. `src/outputs/markdown.ts` - lexical match: code, shared API/refactor risk; defines heading
4. `src/core/token-estimator.ts` - lexical match: code, shared API/refactor risk; defines estimateTokens
5. `src/cli/index.ts` - direct importer of src/core/token-estimator.ts, entrypoint; defines program
6. `src/mcp/server.ts` - entrypoint, shared API/refactor risk; defines repoContextMcpToolNames

## Then Inspect If Needed
- `benchmarks/fixtures/small-ts-app/test/api/login.test.ts` - related test
- `benchmarks/fixtures/monorepo/packages/api/test/config.test.ts` - related test
- `benchmarks/fixtures/fastapi-app/tests/test_users.py` - related test
- `benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts` - related test
- `benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx` - related test
- `benchmarks/fixtures/small-ts-app/test/auth/session.test.ts` - related test
- `benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts` - related test
- `test/contract-validator.test.ts` - shared API/refactor risk
- `test/freshness.test.ts` - shared API/refactor risk
- `test/task-harness.test.ts` - shared API/refactor risk
- `test/test-selector.test.ts` - shared API/refactor risk
- `test/agents-md.test.ts` - shared API/refactor risk
- `test/config.test.ts` - shared API/refactor risk
- `test/mcp.test.ts` - shared API/refactor risk
- `test/retrievers.test.ts` - shared API/refactor risk
- `test/writer.test.ts` - shared API/refactor risk

## Why These Files
| File | Category | Tokens | Why | Summary |
| --- | --- | --- | --- | --- |
| `benchmarks/tasks/refactor-config-loader.json` | direct-source | 38 | lexical match: refactor | benchmarks/tasks/refactor-config-loader.json is a unknown file written as JSON. |
| `assets/agent-context-code-layers.png` | direct-source | 38 | lexical match: code | assets/agent-context-code-layers.png is a asset file. |
| `src/outputs/markdown.ts` | direct-source | 68 | lexical match: code, shared API/refactor risk | src/outputs/markdown.ts contains 8 detected symbols, 0 imports, 5 exports. |
| `src/core/token-estimator.ts` | direct-source | 132 | lexical match: code, shared API/refactor risk | src/core/token-estimator.ts contains 15 detected symbols, 3 imports, 7 exports. |
| `src/cli/index.ts` | entrypoint | 176 | direct importer of src/core/token-estimator.ts, entrypoint, shared API/refactor risk | src/cli/index.ts contains 56 detected symbols, 24 imports, 0 exports. |
| `src/mcp/server.ts` | entrypoint | 226 | entrypoint, shared API/refactor risk | src/mcp/server.ts contains 48 detected symbols, 13 imports, 4 exports. |
| `benchmarks/fixtures/small-ts-app/test/api/login.test.ts` | test | 63 | related test | benchmarks/fixtures/small-ts-app/test/api/login.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/monorepo/packages/api/test/config.test.ts` | test | 66 | related test | benchmarks/fixtures/monorepo/packages/api/test/config.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/fastapi-app/tests/test_users.py` | test | 72 | related test | benchmarks/fixtures/fastapi-app/tests/test_users.py contains 1 detected Python symbol and 1 import. |
| `benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts` | test | 61 | related test | benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx` | test | 64 | related test | benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/small-ts-app/test/auth/session.test.ts` | test | 60 | related test | benchmarks/fixtures/small-ts-app/test/auth/session.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts` | test | 63 | related test | benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `test/contract-validator.test.ts` | test | 71 | shared API/refactor risk | test/contract-validator.test.ts contains 8 detected symbols, 10 imports, 0 exports. |
| `test/freshness.test.ts` | test | 77 | shared API/refactor risk | test/freshness.test.ts contains 13 detected symbols, 9 imports, 0 exports. |
| `test/task-harness.test.ts` | test | 83 | shared API/refactor risk | test/task-harness.test.ts contains 17 detected symbols, 9 imports, 0 exports. |
| `test/test-selector.test.ts` | test | 84 | shared API/refactor risk | test/test-selector.test.ts contains 15 detected symbols, 8 imports, 0 exports. |
| `test/agents-md.test.ts` | test | 62 | shared API/refactor risk | test/agents-md.test.ts contains 9 detected symbols, 7 imports, 0 exports. |
| `test/config.test.ts` | test | 59 | shared API/refactor risk | test/config.test.ts contains 9 detected symbols, 7 imports, 0 exports. |
| `test/mcp.test.ts` | test | 61 | shared API/refactor risk | test/mcp.test.ts contains 8 detected symbols, 7 imports, 0 exports. |
| `test/retrievers.test.ts` | test | 78 | shared API/refactor risk | test/retrievers.test.ts contains 14 detected symbols, 7 imports, 0 exports. |
| `test/writer.test.ts` | test | 99 | shared API/refactor risk | test/writer.test.ts contains 23 detected symbols, 7 imports, 0 exports. |
| `test/analyzers.test.ts` | test | 63 | shared API/refactor risk | test/analyzers.test.ts contains 9 detected symbols, 6 imports, 0 exports. |
| `test/cache.test.ts` | test | 69 | shared API/refactor risk | test/cache.test.ts contains 9 detected symbols, 6 imports, 0 exports. |
| `test/impact.test.ts` | test | 58 | shared API/refactor risk | test/impact.test.ts contains 6 detected symbols, 8 imports, 0 exports. |
| `test/task-context.test.ts` | test | 59 | shared API/refactor risk | test/task-context.test.ts contains 6 detected symbols, 7 imports, 0 exports. |
| `test/fixtures.test.ts` | test | 60 | shared API/refactor risk | test/fixtures.test.ts contains 8 detected symbols, 4 imports, 0 exports. |
| `test/token-savings.test.ts` | test | 66 | shared API/refactor risk | test/token-savings.test.ts contains 9 detected symbols, 4 imports, 0 exports. |
| `test/readiness.test.ts` | test | 59 | shared API/refactor risk | test/readiness.test.ts contains 7 detected symbols, 4 imports, 0 exports. |
| `test/validator.test.ts` | test | 51 | shared API/refactor risk | test/validator.test.ts contains 3 detected symbols, 8 imports, 0 exports. |
| `test/scanner.test.ts` | test | 47 | shared API/refactor risk | test/scanner.test.ts contains 2 detected symbols, 7 imports, 0 exports. |
| `test/snapshot.test.ts` | test | 51 | shared API/refactor risk | test/snapshot.test.ts contains 3 detected symbols, 4 imports, 0 exports. |
| `test/benchmark.test.ts` | test | 50 | shared API/refactor risk | test/benchmark.test.ts contains 2 detected symbols, 4 imports, 0 exports. |
| `src/outputs/rag.ts` | dependency-neighbor | 113 | direct importer of src/core/token-estimator.ts, direct importer of src/outputs/markdown.ts, shared API/refactor risk | src/outputs/rag.ts contains 15 detected symbols, 3 imports, 4 exports. |
| `src/outputs/task-context.ts` | dependency-neighbor | 252 | direct importer of src/core/token-estimator.ts, direct importer of src/outputs/markdown.ts | src/outputs/task-context.ts contains 64 detected symbols, 3 imports, 3 exports. |
| `src/outputs/agents-md.ts` | dependency-neighbor | 148 | direct importer of src/core/token-estimator.ts, direct importer of src/outputs/markdown.ts | src/outputs/agents-md.ts contains 29 detected symbols, 3 imports, 1 export. |
| `src/outputs/task-harness.ts` | dependency-neighbor | 277 | direct importer of src/outputs/markdown.ts, shared API/refactor risk | src/outputs/task-harness.ts contains 67 detected symbols, 7 imports, 5 exports. |
| `src/core/freshness.ts` | dependency-neighbor | 290 | direct importer of src/outputs/markdown.ts, shared API/refactor risk | src/core/freshness.ts contains 57 detected symbols, 8 imports, 9 exports. |
| `src/core/context-builder.ts` | dependency-neighbor | 106 | direct importer of src/core/token-estimator.ts, shared API/refactor risk | src/core/context-builder.ts contains 15 detected symbols, 11 imports, 2 exports. |
| `src/outputs/writer.ts` | dependency-neighbor | 246 | direct importer of src/core/token-estimator.ts, shared API/refactor risk | src/outputs/writer.ts contains 55 detected symbols, 18 imports, 2 exports. |
| `src/outputs/contract-validator.ts` | dependency-neighbor | 315 | direct importer of src/outputs/markdown.ts, shared API/refactor risk | src/outputs/contract-validator.ts contains 61 detected symbols, 6 imports, 5 exports. |
| `src/outputs/test-selector.ts` | dependency-neighbor | 226 | direct importer of src/outputs/markdown.ts, shared API/refactor risk | src/outputs/test-selector.ts contains 44 detected symbols, 3 imports, 4 exports. |
| `src/benchmarks/benchmark.ts` | dependency-neighbor | 331 | direct importer of src/outputs/markdown.ts, shared API/refactor risk | src/benchmarks/benchmark.ts contains 64 detected symbols, 7 imports, 10 exports. |
| `src/outputs/impact.ts` | dependency-neighbor | 230 | direct importer of src/outputs/markdown.ts, shared API/refactor risk | src/outputs/impact.ts contains 46 detected symbols, 3 imports, 4 exports. |
| `src/outputs/task-run.ts` | dependency-neighbor | 194 | direct importer of src/outputs/markdown.ts, shared API/refactor risk | src/outputs/task-run.ts contains 40 detected symbols, 8 imports, 4 exports. |
| `src/retrievers/index.ts` | dependency-neighbor | 88 | direct importer of src/outputs/markdown.ts, shared API/refactor risk | src/retrievers/index.ts contains 2 detected symbols, 7 imports, 6 exports. |
| `src/core/cache.ts` | dependency-neighbor | 178 | direct importer of src/core/token-estimator.ts, shared API/refactor risk | src/core/cache.ts contains 32 detected symbols, 5 imports, 3 exports. |
| `src/core/scanner.ts` | dependency-neighbor | 211 | direct importer of src/core/token-estimator.ts, shared API/refactor risk | src/core/scanner.ts contains 52 detected symbols, 9 imports, 1 export. |
| `src/core/types.ts` | dependency-neighbor | 291 | direct dependency of src/core/token-estimator.ts, shared API/refactor risk | src/core/types.ts contains 34 detected symbols, 0 imports, 34 exports. |
| `src/core/token-savings.ts` | dependency-neighbor | 198 | direct importer of src/core/token-estimator.ts | src/core/token-savings.ts contains 30 detected symbols, 2 imports, 3 exports. |
| `src/outputs/architecture.ts` | dependency-neighbor | 70 | direct importer of src/outputs/markdown.ts | src/outputs/architecture.ts contains 3 detected symbols, 2 imports, 1 export. |
| `src/outputs/dependency-graph.ts` | dependency-neighbor | 85 | direct importer of src/outputs/markdown.ts | src/outputs/dependency-graph.ts contains 7 detected symbols, 2 imports, 2 exports. |
| `src/outputs/context-layers.ts` | dependency-neighbor | 66 | direct importer of src/outputs/markdown.ts | src/outputs/context-layers.ts contains 3 detected symbols, 2 imports, 1 export. |
| `src/outputs/key-files.ts` | dependency-neighbor | 57 | direct importer of src/outputs/markdown.ts | src/outputs/key-files.ts contains 2 detected symbols, 2 imports, 1 export. |
| `src/outputs/module-map.ts` | dependency-neighbor | 58 | direct importer of src/outputs/markdown.ts | src/outputs/module-map.ts contains 2 detected symbols, 2 imports, 1 export. |
| `src/outputs/onboarding.ts` | dependency-neighbor | 60 | direct importer of src/outputs/markdown.ts | src/outputs/onboarding.ts contains 2 detected symbols, 2 imports, 1 export. |
| `src/outputs/repo-summary.ts` | dependency-neighbor | 58 | direct importer of src/outputs/markdown.ts | src/outputs/repo-summary.ts contains 1 detected symbol, 3 imports, 1 export. |
| `src/outputs/token-savings.ts` | dependency-neighbor | 59 | direct importer of src/outputs/markdown.ts | src/outputs/token-savings.ts contains 1 detected symbol, 3 imports, 1 export. |
| `src/outputs/readiness.ts` | dependency-neighbor | 56 | direct importer of src/outputs/markdown.ts | src/outputs/readiness.ts contains 1 detected symbol, 2 imports, 1 export. |
| `src/retrievers/static.ts` | dependency-neighbor | 128 | shared API/refactor risk | src/retrievers/static.ts contains 23 detected symbols, 3 imports, 6 exports. |
| `src/core/path-utils.ts` | dependency-neighbor | 98 | shared API/refactor risk | src/core/path-utils.ts contains 9 detected symbols, 1 import, 5 exports. |
| `src/retrievers/types.ts` | dependency-neighbor | 79 | shared API/refactor risk | src/retrievers/types.ts contains 4 detected symbols, 0 imports, 4 exports. |
| `src/config/load-config.ts` | dependency-neighbor | 160 | shared API/refactor risk | src/config/load-config.ts contains 30 detected symbols, 5 imports, 2 exports. |
| `src/core/indexer.ts` | dependency-neighbor | 225 | shared API/refactor risk | src/core/indexer.ts contains 54 detected symbols, 10 imports, 2 exports. |
| `src/analyzers/python.ts` | dependency-neighbor | 159 | shared API/refactor risk | src/analyzers/python.ts contains 36 detected symbols, 5 imports, 1 export. |
| `src/analyzers/javascript.ts` | dependency-neighbor | 260 | shared API/refactor risk | src/analyzers/javascript.ts contains 66 detected symbols, 4 imports, 1 export. |
| `src/retrievers/ripgrep.ts` | dependency-neighbor | 89 | shared API/refactor risk | src/retrievers/ripgrep.ts contains 14 detected symbols, 5 imports, 1 export. |
| `benchmarks/fixtures/monorepo/packages/api/README.md` | config-doc | 48 | owning module documentation | benchmarks/fixtures/monorepo/packages/api/README.md is a docs file written as Markdown. |
| `benchmarks/README.md` | config-doc | 28 | owning module documentation | benchmarks/README.md is a docs file written as Markdown. |
| `benchmarks/fixtures/monorepo/packages/config/README.md` | config-doc | 45 | owning module documentation | benchmarks/fixtures/monorepo/packages/config/README.md is a docs file written as Markdown. |
| `benchmarks/fixtures/monorepo/packages/web/README.md` | config-doc | 44 | owning module documentation | benchmarks/fixtures/monorepo/packages/web/README.md is a docs file written as Markdown. |
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
| Directly relevant source files | 276 | `benchmarks/tasks/refactor-config-loader.json`, `assets/agent-context-code-layers.png`, `src/outputs/markdown.ts`, `src/core/token-estimator.ts` |
| Tests | 1,756 | `benchmarks/fixtures/small-ts-app/test/api/login.test.ts`, `benchmarks/fixtures/monorepo/packages/api/test/config.test.ts`, `benchmarks/fixtures/fastapi-app/tests/test_users.py`, `benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts`, `benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx`, `benchmarks/fixtures/small-ts-app/test/auth/session.test.ts`, `benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts`, `test/contract-validator.test.ts`, `test/freshness.test.ts`, `test/task-harness.test.ts`, `test/test-selector.test.ts`, `test/agents-md.test.ts`, `test/config.test.ts`, `test/mcp.test.ts`, `test/retrievers.test.ts`, `test/writer.test.ts`, `test/analyzers.test.ts`, `test/cache.test.ts`, `test/impact.test.ts`, `test/task-context.test.ts`, `test/fixtures.test.ts`, `test/token-savings.test.ts`, `test/readiness.test.ts`, `test/validator.test.ts`, `test/scanner.test.ts`, `test/snapshot.test.ts`, `test/benchmark.test.ts` |
| Dependency neighbors | 5,461 | `src/outputs/rag.ts`, `src/outputs/task-context.ts`, `src/outputs/agents-md.ts`, `src/outputs/task-harness.ts`, `src/core/freshness.ts`, `src/core/context-builder.ts`, `src/outputs/writer.ts`, `src/outputs/contract-validator.ts`, `src/outputs/test-selector.ts`, `src/benchmarks/benchmark.ts`, `src/outputs/impact.ts`, `src/outputs/task-run.ts`, `src/retrievers/index.ts`, `src/core/cache.ts`, `src/core/scanner.ts`, `src/core/types.ts`, `src/core/token-savings.ts`, `src/outputs/architecture.ts`, `src/outputs/dependency-graph.ts`, `src/outputs/context-layers.ts`, `src/outputs/key-files.ts`, `src/outputs/module-map.ts`, `src/outputs/onboarding.ts`, `src/outputs/repo-summary.ts`, `src/outputs/token-savings.ts`, `src/outputs/readiness.ts`, `src/retrievers/static.ts`, `src/core/path-utils.ts`, `src/retrievers/types.ts`, `src/config/load-config.ts`, `src/core/indexer.ts`, `src/analyzers/python.ts`, `src/analyzers/javascript.ts`, `src/retrievers/ripgrep.ts` |
| Config/docs | 676 | `benchmarks/fixtures/monorepo/packages/api/README.md`, `benchmarks/README.md`, `benchmarks/fixtures/monorepo/packages/config/README.md`, `benchmarks/fixtures/monorepo/packages/web/README.md`, `benchmarks/fixtures/monorepo/packages/api/package.json`, `package.json`, `benchmarks/fixtures/fastapi-app/pyproject.toml`, `benchmarks/fixtures/monorepo/package.json`, `benchmarks/fixtures/react-app/package.json`, `benchmarks/fixtures/small-ts-app/package.json`, `benchmarks/fixtures/monorepo/packages/config/package.json`, `benchmarks/fixtures/monorepo/packages/shared/package.json`, `benchmarks/fixtures/monorepo/packages/web/package.json`, `.env.example`, `repo-context.config.yml`, `tsconfig.json`, `.github/workflows/ci.yml` |
| Entrypoints | 402 | `src/cli/index.ts`, `src/mcp/server.ts` |

Remaining budget: 3,429 estimated tokens

## Suggested Commands
- npm run test -- refactor
- npm run build
- npm run lint

## Suggested Agent Workflow
- Preserve exported APIs and inspect callers before moving code.
- Read `AGENTS.md` and inspect evidence before editing.
- Open the selected files and dependency neighbors.
- Run detected test/check commands after edits.
