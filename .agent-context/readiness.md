# Agent Readiness

Agent Readiness: 86/100

## Dimensions
| Category | Score | Evidence | Missing |
| --- | --- | --- | --- |
| structure | 97/100 | Entrypoint: src/cli/index.ts; 9 modules detected.; 174 dependency edges detected.; 69% of files have high-confidence analysis. | none |
| commands | 75/100 | Run command: npm run dev; Typecheck command: npm run build; Typecheck command: npm run check | No lint/format command detected. |
| tests | 90/100 | Test/check command: npm run test; 22 test files detected. | No CI workflow detected. |
| architecture | 100/100 | README documentation detected.; Architecture documentation detected. | none |
| task-context | 100/100 | 542 code symbols extracted.; Internal dependency neighbors are available.; 54 files include analysis evidence. | none |
| safety | 55/100 | No database signals detected; migration guidance is not applicable. | No environment variable example detected.; No CI workflow detected. |

## Missing Or Weak Signals
- No lint/format command detected.
- No CI workflow detected.
- No environment variable example detected.

## Strengths
- Structure readiness: 97/100.
- Commands readiness: 75/100.
- Tests readiness: 90/100.
- Architecture readiness: 100/100.
- Task Context readiness: 100/100.
