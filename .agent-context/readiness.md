# Agent Readiness

Agent Readiness: B / 86

## Dimensions
| Dimension | Score | Evidence | Missing |
| --- | --- | --- | --- |
| operational | 87/100 | Entrypoint: src/cli/index.ts; 10 modules detected.; 188 dependency edges detected.; 69% of files have medium/high-confidence analysis.; Run command: npm run dev; Typecheck command: npm run build; Typecheck command: npm run check; Test/check command: npm run test; 25 test files detected. | No lint/format command detected.; No CI workflow detected. |
| context-quality | 99/100 | README documentation detected.; Architecture documentation detected.; 724 code symbols extracted.; Internal dependency neighbors are available.; 55 files include analysis evidence.; Entrypoint: src/cli/index.ts; 10 modules detected.; 188 dependency edges detected.; 69% of files have medium/high-confidence analysis. | none |
| agent-safety | 66/100 | No database signals detected; migration guidance is not applicable.; Test/check command: npm run test; 25 test files detected.; Run command: npm run dev; Typecheck command: npm run build; Typecheck command: npm run check | No environment variable example detected.; No CI workflow detected.; No lint/format command detected. |

## Hard Caps
| Cap | Status | Condition | Evidence |
| --- | --- | --- | --- |
| 90 | applied | No CI workflow detected. | none |
| 90 | applied | No model-specific tokenizer configured; token counts use chars_approx. | tokenizer.mode: chars_approx |
| 85 | not applied | No high-confidence AST/compiler analyzer evidence detected. | generic; typescript-compiler-api; python-ast |
| 80 | not applied | No benchmark or fixture corpus detected. | none |
| 80 | not applied | Generated output validation was not confirmed. | none |

## Signal Categories
| Category | Score | Evidence | Missing |
| --- | --- | --- | --- |
| structure | 97/100 | Entrypoint: src/cli/index.ts; 10 modules detected.; 188 dependency edges detected.; 69% of files have medium/high-confidence analysis. | none |
| commands | 75/100 | Run command: npm run dev; Typecheck command: npm run build; Typecheck command: npm run check | No lint/format command detected. |
| tests | 90/100 | Test/check command: npm run test; 25 test files detected. | No CI workflow detected. |
| architecture | 100/100 | README documentation detected.; Architecture documentation detected. | none |
| task-context | 100/100 | 724 code symbols extracted.; Internal dependency neighbors are available.; 55 files include analysis evidence. | none |
| safety | 55/100 | No database signals detected; migration guidance is not applicable. | No environment variable example detected.; No CI workflow detected. |

## Missing Or Weak Signals
- No lint/format command detected.
- No CI workflow detected.
- No environment variable example detected.
- No model-specific tokenizer configured; token counts use chars_approx.

## Strengths
- Operational readiness: 87/100.
- Context Quality readiness: 99/100.
