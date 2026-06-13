# Agent Readiness

Agent Readiness: A / 90

## Dimensions
| Dimension | Score | Evidence | Missing |
| --- | --- | --- | --- |
| operational | 99/100 | Entrypoint: src/cli/index.ts; Entrypoint: src/mcp/server.ts; 25 modules detected.; 423 dependency edges detected.; 70% of files have medium/high-confidence analysis.; Run command: npm run dev; Lint command: npm run lint; Lint command: npm run format; Lint command: npm run format:check; Lint command: npm run prepublishOnly; Typecheck command: npm run build; Typecheck command: npm run check; Test/check command: npm run test; 45 test files detected.; CI: .github/workflows/ci.yml | none |
| context-quality | 99/100 | README documentation detected.; Architecture documentation detected.; 1684 code symbols extracted.; Internal dependency neighbors are available.; 120 files include analysis evidence.; Entrypoint: src/cli/index.ts; Entrypoint: src/mcp/server.ts; 25 modules detected.; 423 dependency edges detected.; 70% of files have medium/high-confidence analysis. | none |
| agent-safety | 100/100 | Environment example: .env.example; CI workflow: .github/workflows/ci.yml; No database signals detected; migration guidance is not applicable.; Test/check command: npm run test; 45 test files detected.; CI: .github/workflows/ci.yml; Run command: npm run dev; Lint command: npm run lint; Lint command: npm run format; Lint command: npm run format:check; Lint command: npm run prepublishOnly; Typecheck command: npm run build; Typecheck command: npm run check | none |

## Hard Caps
| Cap | Status | Condition | Evidence |
| --- | --- | --- | --- |
| 90 | not applied | No CI workflow detected. | .github/workflows/ci.yml |
| 90 | applied | No model-specific tokenizer configured; token counts use chars_approx. | tokenizer.mode: chars_approx |
| 85 | not applied | No high-confidence AST/compiler analyzer evidence detected. | generic; typescript-compiler-api; python-ast |
| 80 | not applied | No benchmark or fixture corpus detected. | none |
| 80 | not applied | Generated output validation was not confirmed. | none |

## Signal Categories
| Category | Score | Evidence | Missing |
| --- | --- | --- | --- |
| structure | 97/100 | Entrypoint: src/cli/index.ts; Entrypoint: src/mcp/server.ts; 25 modules detected.; 423 dependency edges detected.; 70% of files have medium/high-confidence analysis. | none |
| commands | 100/100 | Run command: npm run dev; Lint command: npm run lint; Lint command: npm run format; Lint command: npm run format:check; Lint command: npm run prepublishOnly; Typecheck command: npm run build; Typecheck command: npm run check | none |
| tests | 100/100 | Test/check command: npm run test; 45 test files detected.; CI: .github/workflows/ci.yml | none |
| architecture | 100/100 | README documentation detected.; Architecture documentation detected. | none |
| task-context | 100/100 | 1684 code symbols extracted.; Internal dependency neighbors are available.; 120 files include analysis evidence. | none |
| safety | 100/100 | Environment example: .env.example; CI workflow: .github/workflows/ci.yml; No database signals detected; migration guidance is not applicable. | none |

## Missing Or Weak Signals
- No model-specific tokenizer configured; token counts use chars_approx.

## Strengths
- Operational readiness: 99/100.
- Context Quality readiness: 99/100.
- Agent Safety readiness: 100/100.
