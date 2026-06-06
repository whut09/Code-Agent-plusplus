# Task Context: refactor code safely

Type: refactor
Budget: 3,694 / 12,000 estimated tokens

## Read First
1. `src/outputs/markdown.ts` - lexical match: code, shared API/refactor risk; defines heading
2. `src/core/token-estimator.ts` - lexical match: code, shared API/refactor risk; defines estimateTokens
3. `src/cli/index.ts` - direct importer of src/core/token-estimator.ts, entrypoint; defines program

## Then Inspect If Needed
- `test/config.test.ts` - shared API/refactor risk
- `test/writer.test.ts` - shared API/refactor risk
- `test/agents-md.test.ts` - shared API/refactor risk
- `test/task-context.test.ts` - shared API/refactor risk
- `test/token-savings.test.ts` - shared API/refactor risk
- `test/fixtures.test.ts` - shared API/refactor risk
- `test/readiness.test.ts` - shared API/refactor risk
- `test/validator.test.ts` - shared API/refactor risk
- `test/analyzers.test.ts` - shared API/refactor risk
- `test/scanner.test.ts` - shared API/refactor risk
- `test/snapshot.test.ts` - shared API/refactor risk
- `src/outputs/rag.ts` - direct importer of src/core/token-estimator.ts, direct importer of src/outputs/markdown.ts
- `src/outputs/task-context.ts` - direct importer of src/core/token-estimator.ts, direct importer of src/outputs/markdown.ts
- `src/outputs/agents-md.ts` - direct importer of src/core/token-estimator.ts, direct importer of src/outputs/markdown.ts
- `src/core/context-builder.ts` - direct importer of src/core/token-estimator.ts, shared API/refactor risk
- `src/outputs/writer.ts` - direct importer of src/core/token-estimator.ts, shared API/refactor risk

## Why These Files
| File | Category | Tokens | Why | Summary |
| --- | --- | --- | --- | --- |
| `src/outputs/markdown.ts` | direct-source | 68 | lexical match: code, shared API/refactor risk | src/outputs/markdown.ts contains 8 detected symbols, 0 imports, 5 exports. |
| `src/core/token-estimator.ts` | direct-source | 104 | lexical match: code, shared API/refactor risk | src/core/token-estimator.ts contains 9 detected symbols, 2 imports, 5 exports. |
| `src/cli/index.ts` | entrypoint | 111 | direct importer of src/core/token-estimator.ts, entrypoint, shared API/refactor risk | src/cli/index.ts contains 30 detected symbols, 15 imports, 0 exports. |
| `test/config.test.ts` | test | 59 | shared API/refactor risk | test/config.test.ts contains 9 detected symbols, 7 imports, 0 exports. |
| `test/writer.test.ts` | test | 65 | shared API/refactor risk | test/writer.test.ts contains 9 detected symbols, 7 imports, 0 exports. |
| `test/agents-md.test.ts` | test | 57 | shared API/refactor risk | test/agents-md.test.ts contains 6 detected symbols, 7 imports, 0 exports. |
| `test/task-context.test.ts` | test | 59 | shared API/refactor risk | test/task-context.test.ts contains 6 detected symbols, 7 imports, 0 exports. |
| `test/token-savings.test.ts` | test | 66 | shared API/refactor risk | test/token-savings.test.ts contains 9 detected symbols, 4 imports, 0 exports. |
| `test/fixtures.test.ts` | test | 59 | shared API/refactor risk | test/fixtures.test.ts contains 7 detected symbols, 4 imports, 0 exports. |
| `test/readiness.test.ts` | test | 59 | shared API/refactor risk | test/readiness.test.ts contains 7 detected symbols, 4 imports, 0 exports. |
| `test/validator.test.ts` | test | 51 | shared API/refactor risk | test/validator.test.ts contains 3 detected symbols, 8 imports, 0 exports. |
| `test/analyzers.test.ts` | test | 54 | shared API/refactor risk | test/analyzers.test.ts contains 5 detected symbols, 5 imports, 0 exports. |
| `test/scanner.test.ts` | test | 47 | shared API/refactor risk | test/scanner.test.ts contains 2 detected symbols, 7 imports, 0 exports. |
| `test/snapshot.test.ts` | test | 51 | shared API/refactor risk | test/snapshot.test.ts contains 3 detected symbols, 4 imports, 0 exports. |
| `src/outputs/rag.ts` | dependency-neighbor | 113 | direct importer of src/core/token-estimator.ts, direct importer of src/outputs/markdown.ts, shared API/refactor risk | src/outputs/rag.ts contains 15 detected symbols, 3 imports, 4 exports. |
| `src/outputs/task-context.ts` | dependency-neighbor | 252 | direct importer of src/core/token-estimator.ts, direct importer of src/outputs/markdown.ts | src/outputs/task-context.ts contains 64 detected symbols, 3 imports, 3 exports. |
| `src/outputs/agents-md.ts` | dependency-neighbor | 134 | direct importer of src/core/token-estimator.ts, direct importer of src/outputs/markdown.ts | src/outputs/agents-md.ts contains 26 detected symbols, 3 imports, 1 export. |
| `src/core/context-builder.ts` | dependency-neighbor | 90 | direct importer of src/core/token-estimator.ts, shared API/refactor risk | src/core/context-builder.ts contains 11 detected symbols, 10 imports, 2 exports. |
| `src/outputs/writer.ts` | dependency-neighbor | 166 | direct importer of src/core/token-estimator.ts, shared API/refactor risk | src/outputs/writer.ts contains 33 detected symbols, 15 imports, 2 exports. |
| `src/core/scanner.ts` | dependency-neighbor | 186 | direct importer of src/core/token-estimator.ts, shared API/refactor risk | src/core/scanner.ts contains 44 detected symbols, 9 imports, 1 export. |
| `src/core/types.ts` | dependency-neighbor | 291 | direct dependency of src/core/token-estimator.ts, shared API/refactor risk | src/core/types.ts contains 34 detected symbols, 0 imports, 34 exports. |
| `src/core/token-savings.ts` | dependency-neighbor | 198 | direct importer of src/core/token-estimator.ts | src/core/token-savings.ts contains 30 detected symbols, 2 imports, 3 exports. |
| `src/outputs/dependency-graph.ts` | dependency-neighbor | 85 | direct importer of src/outputs/markdown.ts | src/outputs/dependency-graph.ts contains 7 detected symbols, 2 imports, 2 exports. |
| `src/outputs/architecture.ts` | dependency-neighbor | 65 | direct importer of src/outputs/markdown.ts | src/outputs/architecture.ts contains 3 detected symbols, 2 imports, 1 export. |
| `src/outputs/key-files.ts` | dependency-neighbor | 57 | direct importer of src/outputs/markdown.ts | src/outputs/key-files.ts contains 2 detected symbols, 2 imports, 1 export. |
| `src/outputs/module-map.ts` | dependency-neighbor | 58 | direct importer of src/outputs/markdown.ts | src/outputs/module-map.ts contains 2 detected symbols, 2 imports, 1 export. |
| `src/outputs/onboarding.ts` | dependency-neighbor | 60 | direct importer of src/outputs/markdown.ts | src/outputs/onboarding.ts contains 2 detected symbols, 2 imports, 1 export. |
| `src/outputs/repo-summary.ts` | dependency-neighbor | 58 | direct importer of src/outputs/markdown.ts | src/outputs/repo-summary.ts contains 1 detected symbol, 3 imports, 1 export. |
| `src/outputs/token-savings.ts` | dependency-neighbor | 59 | direct importer of src/outputs/markdown.ts | src/outputs/token-savings.ts contains 1 detected symbol, 3 imports, 1 export. |
| `src/outputs/readiness.ts` | dependency-neighbor | 56 | direct importer of src/outputs/markdown.ts | src/outputs/readiness.ts contains 1 detected symbol, 2 imports, 1 export. |
| `src/core/path-utils.ts` | dependency-neighbor | 91 | shared API/refactor risk | src/core/path-utils.ts contains 7 detected symbols, 1 import, 5 exports. |
| `src/config/load-config.ts` | dependency-neighbor | 160 | shared API/refactor risk | src/config/load-config.ts contains 30 detected symbols, 5 imports, 2 exports. |
| `src/core/indexer.ts` | dependency-neighbor | 177 | shared API/refactor risk | src/core/indexer.ts contains 43 detected symbols, 9 imports, 1 export. |
| `src/analyzers/javascript.ts` | dependency-neighbor | 229 | shared API/refactor risk | src/analyzers/javascript.ts contains 56 detected symbols, 4 imports, 1 export. |
| `src/analyzers/python.ts` | dependency-neighbor | 148 | shared API/refactor risk | src/analyzers/python.ts contains 32 detected symbols, 4 imports, 1 export. |
| `package.json` | config-doc | 25 | configuration | package.json is a config file written as JSON. |
| `tsconfig.json` | config-doc | 26 | configuration | tsconfig.json is a config file written as JSON. |

## Budget Packing
| Bucket | Tokens | Files |
| --- | --- | --- |
| Directly relevant source files | 172 | `src/outputs/markdown.ts`, `src/core/token-estimator.ts` |
| Tests | 627 | `test/config.test.ts`, `test/writer.test.ts`, `test/agents-md.test.ts`, `test/task-context.test.ts`, `test/token-savings.test.ts`, `test/fixtures.test.ts`, `test/readiness.test.ts`, `test/validator.test.ts`, `test/analyzers.test.ts`, `test/scanner.test.ts`, `test/snapshot.test.ts` |
| Dependency neighbors | 2,733 | `src/outputs/rag.ts`, `src/outputs/task-context.ts`, `src/outputs/agents-md.ts`, `src/core/context-builder.ts`, `src/outputs/writer.ts`, `src/core/scanner.ts`, `src/core/types.ts`, `src/core/token-savings.ts`, `src/outputs/dependency-graph.ts`, `src/outputs/architecture.ts`, `src/outputs/key-files.ts`, `src/outputs/module-map.ts`, `src/outputs/onboarding.ts`, `src/outputs/repo-summary.ts`, `src/outputs/token-savings.ts`, `src/outputs/readiness.ts`, `src/core/path-utils.ts`, `src/config/load-config.ts`, `src/core/indexer.ts`, `src/analyzers/javascript.ts`, `src/analyzers/python.ts` |
| Config/docs | 51 | `package.json`, `tsconfig.json` |
| Entrypoints | 111 | `src/cli/index.ts` |

Remaining budget: 8,306 estimated tokens

## Suggested Commands
- npm run test -- refactor
- npm run build

## Suggested Agent Workflow
- Preserve exported APIs and inspect callers before moving code.
- Read `AGENTS.md` and inspect evidence before editing.
- Open the selected files and dependency neighbors.
- Run detected test/check commands after edits.
