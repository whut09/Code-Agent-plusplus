# Task Context: fix a bug or regression

Type: bugfix
Budget: 1,535 / 12,000 estimated tokens

## Read First
1. `src/core/token-estimator.ts` - key file fallback; defines estimateTokens
2. `src/core/context-builder.ts` - key file fallback; defines BuildOptions
3. `src/core/types.ts` - key file fallback; defines AgentTarget
4. `src/outputs/markdown.ts` - key file fallback; defines heading
5. `src/core/token-savings.ts` - key file fallback; defines DEFAULT_TOKEN_BUDGET
6. `src/outputs/writer.ts` - key file fallback; defines WriteResult
7. `src/core/path-utils.ts` - key file fallback; defines toPosixPath
8. `src/outputs/task-context.ts` - key file fallback; defines TaskContextOptions

## Then Inspect If Needed
- `package.json` - configuration
- `tsconfig.json` - configuration

## Why These Files
| File | Category | Tokens | Why | Summary |
| --- | --- | --- | --- | --- |
| `src/core/token-estimator.ts` | direct-source | 104 | key file fallback | src/core/token-estimator.ts contains 9 detected symbols, 2 imports, 5 exports. |
| `src/core/context-builder.ts` | direct-source | 90 | key file fallback | src/core/context-builder.ts contains 11 detected symbols, 10 imports, 2 exports. |
| `src/core/types.ts` | direct-source | 291 | key file fallback | src/core/types.ts contains 34 detected symbols, 0 imports, 34 exports. |
| `src/outputs/markdown.ts` | direct-source | 68 | key file fallback | src/outputs/markdown.ts contains 8 detected symbols, 0 imports, 5 exports. |
| `src/core/token-savings.ts` | direct-source | 198 | key file fallback | src/core/token-savings.ts contains 30 detected symbols, 2 imports, 3 exports. |
| `src/outputs/writer.ts` | direct-source | 166 | key file fallback | src/outputs/writer.ts contains 33 detected symbols, 15 imports, 2 exports. |
| `src/core/path-utils.ts` | direct-source | 91 | key file fallback | src/core/path-utils.ts contains 7 detected symbols, 1 import, 5 exports. |
| `src/outputs/task-context.ts` | direct-source | 252 | key file fallback | src/outputs/task-context.ts contains 64 detected symbols, 3 imports, 3 exports. |
| `src/outputs/rag.ts` | direct-source | 113 | key file fallback | src/outputs/rag.ts contains 15 detected symbols, 3 imports, 4 exports. |
| `src/cli/index.ts` | entrypoint | 111 | entrypoint, key file fallback | src/cli/index.ts contains 30 detected symbols, 15 imports, 0 exports. |
| `package.json` | config-doc | 25 | configuration | package.json is a config file written as JSON. |
| `tsconfig.json` | config-doc | 26 | configuration | tsconfig.json is a config file written as JSON. |

## Budget Packing
| Bucket | Tokens | Files |
| --- | --- | --- |
| Directly relevant source files | 1,373 | `src/core/token-estimator.ts`, `src/core/context-builder.ts`, `src/core/types.ts`, `src/outputs/markdown.ts`, `src/core/token-savings.ts`, `src/outputs/writer.ts`, `src/core/path-utils.ts`, `src/outputs/task-context.ts`, `src/outputs/rag.ts` |
| Tests | 0 | none |
| Dependency neighbors | 0 | none |
| Config/docs | 51 | `package.json`, `tsconfig.json` |
| Entrypoints | 111 | `src/cli/index.ts` |

Remaining budget: 10,465 estimated tokens

## Suggested Commands
- npm run test -- regression

## Suggested Agent Workflow
- Reproduce the failure and inspect related tests first.
- Read `AGENTS.md` and inspect evidence before editing.
- Open the selected files and dependency neighbors.
- Run detected test/check commands after edits.
