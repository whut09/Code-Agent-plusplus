# Task Context

Task: fix a bug or regression
Type: bugfix
Budget: 162 / 12,000 estimated tokens

## Relevant Files
| File | Score | Why | Summary |
| --- | --- | --- | --- |
| `src/cli/index.ts` | 12 | entrypoint | src/cli/index.ts contains 30 detected symbols, 14 imports, 0 exports. |
| `package.json` | 8 | configuration | package.json is a config file written as JSON. |
| `tsconfig.json` | 8 | configuration | tsconfig.json is a config file written as JSON. |

## Suggested Agent Workflow
- Reproduce the failure and inspect related tests first.
- Read `AGENTS.md` and inspect evidence before editing.
- Open the selected files and dependency neighbors.
- Run detected test/check commands after edits.
