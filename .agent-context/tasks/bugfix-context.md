# Task Context

Task: fix a bug or regression

## Relevant Files
| File | Score | Why | Summary |
| --- | --- | --- | --- |
| `src/cli/index.ts` | 65 | entrypoint, 29 symbols, 10 outbound dependencies | src/cli/index.ts contains 29 detected symbols, 10 imports, 0 exports. |
| `src/core/types.ts` | 60 | 16 exports, 16 symbols, 25 inbound dependencies | src/core/types.ts contains 16 detected symbols, 0 imports, 16 exports. |
| `src/outputs/markdown.ts` | 60 | 5 exports, 8 symbols, 9 inbound dependencies | src/outputs/markdown.ts contains 8 detected symbols, 0 imports, 5 exports. |
| `src/core/path-utils.ts` | 51 | 5 exports, 7 symbols, 3 inbound dependencies, 1 outbound dependency | src/core/path-utils.ts contains 7 detected symbols, 1 import, 5 exports. |
| `src/core/context-builder.ts` | 43 | 2 exports, 10 symbols, 1 inbound dependency, 8 outbound dependencies | src/core/context-builder.ts contains 10 detected symbols, 8 imports, 2 exports. |
| `src/outputs/writer.ts` | 43 | 2 exports, 16 symbols, 1 inbound dependency, 12 outbound dependencies | src/outputs/writer.ts contains 16 detected symbols, 12 imports, 2 exports. |
| `src/core/scanner.ts` | 39 | 1 export, 43 symbols, 1 inbound dependency, 9 outbound dependencies | src/core/scanner.ts contains 43 detected symbols, 9 imports, 1 export. |
| `src/core/file-classifier.ts` | 38 | 3 exports, 8 symbols, 1 inbound dependency, 3 outbound dependencies | src/core/file-classifier.ts contains 8 detected symbols, 3 imports, 3 exports. |
| `src/core/indexer.ts` | 38 | 1 export, 23 symbols, 1 inbound dependency, 7 outbound dependencies | src/core/indexer.ts contains 23 detected symbols, 7 imports, 1 export. |
| `src/outputs/dependency-graph.ts` | 37 | 2 exports, 9 symbols, 2 inbound dependencies, 2 outbound dependencies | src/outputs/dependency-graph.ts contains 9 detected symbols, 2 imports, 2 exports. |
| `src/outputs/task-context.ts` | 36 | 2 exports, 7 symbols, 2 inbound dependencies, 2 outbound dependencies | src/outputs/task-context.ts contains 7 detected symbols, 2 imports, 2 exports. |
| `src/analyzers/types.ts` | 34 | 2 exports, 2 symbols, 4 inbound dependencies, 1 outbound dependency | src/analyzers/types.ts contains 2 detected symbols, 1 import, 2 exports. |
| `src/config/load-config.ts` | 34 | 1 export, 13 symbols, 1 inbound dependency, 5 outbound dependencies | src/config/load-config.ts contains 13 detected symbols, 5 imports, 1 export. |
| `src/core/readiness.ts` | 34 | 2 exports, 7 symbols, 2 inbound dependencies, 1 outbound dependency | src/core/readiness.ts contains 7 detected symbols, 1 import, 2 exports. |
| `src/analyzers/javascript.ts` | 30 | 1 export, 25 symbols, 1 inbound dependency, 3 outbound dependencies | src/analyzers/javascript.ts contains 25 detected symbols, 3 imports, 1 export. |
| `src/llm/provider.ts` | 30 | 2 exports, 9 symbols, 1 inbound dependency, 1 outbound dependency | src/llm/provider.ts contains 9 detected symbols, 1 import, 2 exports. |
| `src/analyzers/python.ts` | 28 | 1 export, 11 symbols, 1 inbound dependency, 2 outbound dependencies | src/analyzers/python.ts contains 11 detected symbols, 2 imports, 1 export. |
| `src/analyzers/resolve-import.ts` | 28 | 1 export, 12 symbols, 1 inbound dependency, 2 outbound dependencies | src/analyzers/resolve-import.ts contains 12 detected symbols, 2 imports, 1 export. |
| `src/core/summarizer.ts` | 28 | 1 export, 10 symbols, 1 inbound dependency, 2 outbound dependencies | src/core/summarizer.ts contains 10 detected symbols, 2 imports, 1 export. |
| `src/core/graph.ts` | 26 | 1 export, 9 symbols, 1 inbound dependency, 1 outbound dependency | src/core/graph.ts contains 9 detected symbols, 1 import, 1 export. |

## Suggested Agent Workflow
- Read `AGENTS.md` first.
- Open the relevant files above and nearby tests before editing.
- Check `dependency-graph.md` when changing shared modules or exports.
- Run detected test/check commands from `repo-summary.md` after edits.
