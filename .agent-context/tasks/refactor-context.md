# Task Context

Task: refactor code safely
Type: refactor
Budget: 2,797 / 12,000 estimated tokens

## Relevant Files
| File | Score | Why | Summary |
| --- | --- | --- | --- |
| `src/outputs/markdown.ts` | 165 | lexical match: code, shared API/refactor risk | src/outputs/markdown.ts contains 8 detected symbols, 0 imports, 5 exports. |
| `src/outputs/rag.ts` | 46 | caller/importer of src/outputs/markdown.ts, shared API/refactor risk | src/outputs/rag.ts contains 15 detected symbols, 3 imports, 4 exports. |
| `src/cli/index.ts` | 30 | entrypoint, shared API/refactor risk | src/cli/index.ts contains 30 detected symbols, 14 imports, 0 exports. |
| `src/outputs/task-context.ts` | 28 | caller/importer of src/outputs/markdown.ts | src/outputs/task-context.ts contains 37 detected symbols, 3 imports, 3 exports. |
| `src/outputs/dependency-graph.ts` | 28 | caller/importer of src/outputs/markdown.ts | src/outputs/dependency-graph.ts contains 7 detected symbols, 2 imports, 2 exports. |
| `src/outputs/agents-md.ts` | 28 | caller/importer of src/outputs/markdown.ts | src/outputs/agents-md.ts contains 4 detected symbols, 2 imports, 1 export. |
| `src/outputs/architecture.ts` | 28 | caller/importer of src/outputs/markdown.ts | src/outputs/architecture.ts contains 3 detected symbols, 2 imports, 1 export. |
| `src/outputs/key-files.ts` | 28 | caller/importer of src/outputs/markdown.ts | src/outputs/key-files.ts contains 2 detected symbols, 2 imports, 1 export. |
| `src/outputs/module-map.ts` | 28 | caller/importer of src/outputs/markdown.ts | src/outputs/module-map.ts contains 2 detected symbols, 2 imports, 1 export. |
| `src/outputs/onboarding.ts` | 28 | caller/importer of src/outputs/markdown.ts | src/outputs/onboarding.ts contains 2 detected symbols, 2 imports, 1 export. |
| `src/outputs/repo-summary.ts` | 28 | caller/importer of src/outputs/markdown.ts | src/outputs/repo-summary.ts contains 1 detected symbol, 3 imports, 1 export. |
| `src/outputs/token-savings.ts` | 28 | caller/importer of src/outputs/markdown.ts | src/outputs/token-savings.ts contains 1 detected symbol, 3 imports, 1 export. |
| `src/outputs/readiness.ts` | 28 | caller/importer of src/outputs/markdown.ts | src/outputs/readiness.ts contains 1 detected symbol, 2 imports, 1 export. |
| `src/core/context-builder.ts` | 18 | shared API/refactor risk | src/core/context-builder.ts contains 11 detected symbols, 9 imports, 2 exports. |
| `src/core/types.ts` | 18 | shared API/refactor risk | src/core/types.ts contains 25 detected symbols, 0 imports, 25 exports. |
| `src/outputs/writer.ts` | 18 | shared API/refactor risk | src/outputs/writer.ts contains 31 detected symbols, 15 imports, 2 exports. |
| `src/core/path-utils.ts` | 18 | shared API/refactor risk | src/core/path-utils.ts contains 7 detected symbols, 1 import, 5 exports. |
| `src/core/scanner.ts` | 18 | shared API/refactor risk | src/core/scanner.ts contains 44 detected symbols, 9 imports, 1 export. |
| `src/config/load-config.ts` | 18 | shared API/refactor risk | src/config/load-config.ts contains 24 detected symbols, 5 imports, 2 exports. |
| `src/core/indexer.ts` | 18 | shared API/refactor risk | src/core/indexer.ts contains 25 detected symbols, 9 imports, 1 export. |
| `test/writer.test.ts` | 18 | shared API/refactor risk | test/writer.test.ts contains 9 detected symbols, 7 imports, 0 exports. |
| `src/analyzers/javascript.ts` | 18 | shared API/refactor risk | src/analyzers/javascript.ts contains 36 detected symbols, 4 imports, 1 export. |
| `test/config.test.ts` | 18 | shared API/refactor risk | test/config.test.ts contains 6 detected symbols, 7 imports, 0 exports. |
| `test/task-context.test.ts` | 18 | shared API/refactor risk | test/task-context.test.ts contains 4 detected symbols, 7 imports, 0 exports. |
| `test/token-savings.test.ts` | 18 | shared API/refactor risk | test/token-savings.test.ts contains 7 detected symbols, 4 imports, 0 exports. |
| `test/validator.test.ts` | 18 | shared API/refactor risk | test/validator.test.ts contains 3 detected symbols, 8 imports, 0 exports. |
| `test/analyzers.test.ts` | 18 | shared API/refactor risk | test/analyzers.test.ts contains 5 detected symbols, 5 imports, 0 exports. |
| `test/fixtures.test.ts` | 18 | shared API/refactor risk | test/fixtures.test.ts contains 6 detected symbols, 4 imports, 0 exports. |
| `test/readiness.test.ts` | 18 | shared API/refactor risk | test/readiness.test.ts contains 6 detected symbols, 4 imports, 0 exports. |
| `test/scanner.test.ts` | 18 | shared API/refactor risk | test/scanner.test.ts contains 2 detected symbols, 7 imports, 0 exports. |
| `test/snapshot.test.ts` | 18 | shared API/refactor risk | test/snapshot.test.ts contains 3 detected symbols, 4 imports, 0 exports. |
| `package.json` | 8 | configuration | package.json is a config file written as JSON. |
| `tsconfig.json` | 8 | configuration | tsconfig.json is a config file written as JSON. |

## Suggested Agent Workflow
- Preserve exported APIs and inspect callers before moving code.
- Read `AGENTS.md` and inspect evidence before editing.
- Open the selected files and dependency neighbors.
- Run detected test/check commands after edits.
