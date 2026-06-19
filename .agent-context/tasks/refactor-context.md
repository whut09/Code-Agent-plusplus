# Task Context: refactor code safely

Type: refactor
Budget: 11,994 / 12,000 estimated tokens

## Read First
1. `src/integrations/opencode/sidecar.ts` - lexical match: code, safely, shared API/refactor risk; defines OpenCodeSidecarEnsureOptions
2. `benchmarks/tasks/refactor-config-loader.json` - lexical match: refactor
3. `benchmarks/tasks/refactor-session-expiry.json` - lexical match: refactor
4. `code-agent-plusplus.config.example.yml` - lexical match: code
5. `code-agent-plusplus.local.example.yml` - lexical match: code
6. `assets/agent-context-code-layers.png` - lexical match: code
7. `src/cli/index.ts` - lexical match: code, direct importer of src/integrations/opencode/sidecar.ts; defines program
8. `src/mcp/server.ts` - lexical match: code, entrypoint; defines codeAgentPlusplusMcpToolNames

## Then Inspect If Needed
- `test/opencode-launcher.test.ts` - lexical match: code, direct importer of src/integrations/opencode/sidecar.ts
- `test/codegraph.test.ts` - lexical match: code, related test
- `test/opencode-preset.test.ts` - lexical match: code, shared API/refactor risk
- `test/capp-commands.test.ts` - lexical match: code, direct importer of src/integrations/opencode/sidecar.ts
- `test/test-selector.test.ts` - lexical match: code, shared API/refactor risk
- `test/impact.test.ts` - lexical match: code, shared API/refactor risk
- `benchmarks/fixtures/small-ts-app/test/api/login.test.ts` - related test
- `benchmarks/fixtures/monorepo/packages/api/test/config.test.ts` - related test
- `benchmarks/fixtures/fastapi-app/tests/test_users.py` - related test
- `benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts` - related test
- `benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx` - related test
- `benchmarks/fixtures/small-ts-app/test/auth/session.test.ts` - related test
- `benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts` - related test
- `test/context-delta.test.ts` - shared API/refactor risk
- `test/contract-validator.test.ts` - shared API/refactor risk
- `test/execution-trace.test.ts` - shared API/refactor risk

## Why These Files
| File | Category | Tokens | Why | Summary |
| --- | --- | --- | --- | --- |
| `src/integrations/opencode/sidecar.ts` | direct-source | 731 | lexical match: code, safely, shared API/refactor risk | src/integrations/opencode/sidecar.ts contains 141 detected symbols, 15 imports, 18 exports. |
| `benchmarks/tasks/refactor-config-loader.json` | direct-source | 38 | lexical match: refactor | benchmarks/tasks/refactor-config-loader.json is a unknown file written as JSON. |
| `benchmarks/tasks/refactor-session-expiry.json` | direct-source | 38 | lexical match: refactor | benchmarks/tasks/refactor-session-expiry.json is a unknown file written as JSON. |
| `code-agent-plusplus.config.example.yml` | direct-source | 35 | lexical match: code | code-agent-plusplus.config.example.yml is a unknown file written as YAML. |
| `code-agent-plusplus.local.example.yml` | direct-source | 34 | lexical match: code | code-agent-plusplus.local.example.yml is a unknown file written as YAML. |
| `assets/agent-context-code-layers.png` | direct-source | 38 | lexical match: code | assets/agent-context-code-layers.png is a asset file. |
| `src/cli/index.ts` | entrypoint | 451 | lexical match: code, direct importer of src/integrations/opencode/sidecar.ts, entrypoint, shared API/refactor risk | src/cli/index.ts contains 142 detected symbols, 39 imports, 0 exports. |
| `src/mcp/server.ts` | entrypoint | 405 | lexical match: code, entrypoint, shared API/refactor risk | src/mcp/server.ts contains 102 detected symbols, 19 imports, 4 exports. |
| `test/opencode-launcher.test.ts` | test | 111 | lexical match: code, direct importer of src/integrations/opencode/sidecar.ts, shared API/refactor risk | test/opencode-launcher.test.ts contains 29 detected symbols, 12 imports, 0 exports. |
| `test/codegraph.test.ts` | test | 62 | lexical match: code, related test, shared API/refactor risk | test/codegraph.test.ts contains 8 detected symbols, 7 imports, 0 exports. |
| `test/opencode-preset.test.ts` | test | 93 | lexical match: code, shared API/refactor risk | test/opencode-preset.test.ts contains 20 detected symbols, 8 imports, 0 exports. |
| `test/capp-commands.test.ts` | test | 59 | lexical match: code, direct importer of src/integrations/opencode/sidecar.ts, shared API/refactor risk | test/capp-commands.test.ts contains 6 detected symbols, 7 imports, 0 exports. |
| `test/test-selector.test.ts` | test | 89 | lexical match: code, shared API/refactor risk | test/test-selector.test.ts contains 16 detected symbols, 8 imports, 0 exports. |
| `test/impact.test.ts` | test | 62 | lexical match: code, shared API/refactor risk | test/impact.test.ts contains 7 detected symbols, 8 imports, 0 exports. |
| `benchmarks/fixtures/small-ts-app/test/api/login.test.ts` | test | 63 | related test | benchmarks/fixtures/small-ts-app/test/api/login.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/monorepo/packages/api/test/config.test.ts` | test | 66 | related test | benchmarks/fixtures/monorepo/packages/api/test/config.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/fastapi-app/tests/test_users.py` | test | 72 | related test | benchmarks/fixtures/fastapi-app/tests/test_users.py contains 1 detected Python symbol and 1 import. |
| `benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts` | test | 61 | related test | benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx` | test | 64 | related test | benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/small-ts-app/test/auth/session.test.ts` | test | 60 | related test | benchmarks/fixtures/small-ts-app/test/auth/session.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts` | test | 63 | related test | benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts contains 0 detected symbols, 1 import, 0 exports. |
| `test/context-delta.test.ts` | test | 85 | shared API/refactor risk | test/context-delta.test.ts contains 14 detected symbols, 10 imports, 0 exports. |
| `test/contract-validator.test.ts` | test | 81 | shared API/refactor risk | test/contract-validator.test.ts contains 12 detected symbols, 10 imports, 0 exports. |
| `test/execution-trace.test.ts` | test | 84 | shared API/refactor risk | test/execution-trace.test.ts contains 18 detected symbols, 9 imports, 0 exports. |
| `test/freshness.test.ts` | test | 77 | shared API/refactor risk | test/freshness.test.ts contains 13 detected symbols, 9 imports, 0 exports. |
| `test/hallucination-guard.test.ts` | test | 89 | shared API/refactor risk | test/hallucination-guard.test.ts contains 14 detected symbols, 11 imports, 0 exports. |
| `test/loop-controller.test.ts` | test | 115 | shared API/refactor risk | test/loop-controller.test.ts contains 27 detected symbols, 10 imports, 0 exports. |
| `test/orchestrator.test.ts` | test | 116 | shared API/refactor risk | test/orchestrator.test.ts contains 27 detected symbols, 8 imports, 0 exports. |
| `test/policy-engine.test.ts` | test | 142 | shared API/refactor risk | test/policy-engine.test.ts contains 38 detected symbols, 10 imports, 0 exports. |
| `test/regression-guard.test.ts` | test | 106 | shared API/refactor risk | test/regression-guard.test.ts contains 23 detected symbols, 13 imports, 0 exports. |
| `test/task-harness.test.ts` | test | 84 | shared API/refactor risk | test/task-harness.test.ts contains 18 detected symbols, 9 imports, 0 exports. |
| `test/agents-md.test.ts` | test | 62 | shared API/refactor risk | test/agents-md.test.ts contains 9 detected symbols, 7 imports, 0 exports. |
| `test/config.test.ts` | test | 59 | shared API/refactor risk | test/config.test.ts contains 9 detected symbols, 7 imports, 0 exports. |
| `test/mcp.test.ts` | test | 78 | shared API/refactor risk | test/mcp.test.ts contains 15 detected symbols, 7 imports, 0 exports. |
| `test/retrievers.test.ts` | test | 88 | shared API/refactor risk | test/retrievers.test.ts contains 19 detected symbols, 7 imports, 0 exports. |
| `test/writer.test.ts` | test | 99 | shared API/refactor risk | test/writer.test.ts contains 23 detected symbols, 7 imports, 0 exports. |
| `test/analyzers.test.ts` | test | 63 | shared API/refactor risk | test/analyzers.test.ts contains 9 detected symbols, 6 imports, 0 exports. |
| `test/cache.test.ts` | test | 73 | shared API/refactor risk | test/cache.test.ts contains 10 detected symbols, 6 imports, 0 exports. |
| `test/agent-events.test.ts` | test | 60 | shared API/refactor risk | test/agent-events.test.ts contains 7 detected symbols, 6 imports, 0 exports. |
| `test/task-context.test.ts` | test | 59 | shared API/refactor risk | test/task-context.test.ts contains 6 detected symbols, 7 imports, 0 exports. |
| `test/fixtures.test.ts` | test | 60 | shared API/refactor risk | test/fixtures.test.ts contains 8 detected symbols, 4 imports, 0 exports. |
| `test/token-savings.test.ts` | test | 66 | shared API/refactor risk | test/token-savings.test.ts contains 9 detected symbols, 4 imports, 0 exports. |
| `test/readiness.test.ts` | test | 59 | shared API/refactor risk | test/readiness.test.ts contains 7 detected symbols, 4 imports, 0 exports. |
| `test/validator.test.ts` | test | 51 | shared API/refactor risk | test/validator.test.ts contains 3 detected symbols, 8 imports, 0 exports. |
| `test/scanner.test.ts` | test | 47 | shared API/refactor risk | test/scanner.test.ts contains 2 detected symbols, 7 imports, 0 exports. |
| `test/snapshot.test.ts` | test | 51 | shared API/refactor risk | test/snapshot.test.ts contains 3 detected symbols, 4 imports, 0 exports. |
| `test/agent-benchmark.test.ts` | test | 53 | shared API/refactor risk | test/agent-benchmark.test.ts contains 2 detected symbols, 4 imports, 0 exports. |
| `test/benchmark.test.ts` | test | 50 | shared API/refactor risk | test/benchmark.test.ts contains 2 detected symbols, 4 imports, 0 exports. |
| `src/integrations/opencode/launcher.ts` | dependency-neighbor | 250 | lexical match: code, direct importer of src/integrations/opencode/sidecar.ts, shared API/refactor risk | src/integrations/opencode/launcher.ts contains 37 detected symbols, 9 imports, 9 exports. |
| `src/integrations/codegraph.ts` | dependency-neighbor | 294 | lexical match: code, direct dependency of test/codegraph.test.ts, shared API/refactor risk | src/integrations/codegraph.ts contains 59 detected symbols, 5 imports, 11 exports. |
| `src/integrations/opencode/sidecar-plugin-template.ts` | dependency-neighbor | 121 | lexical match: code, direct dependency of src/integrations/opencode/sidecar.ts, shared API/refactor risk | src/integrations/opencode/sidecar-plugin-template.ts contains 4 detected symbols, 0 imports, 4 exports. |
| `src/cli/opencode-preset.ts` | dependency-neighbor | 317 | lexical match: code, shared API/refactor risk | src/cli/opencode-preset.ts contains 44 detected symbols, 6 imports, 16 exports. |
| `src/integrations/opencode/project-init.ts` | dependency-neighbor | 135 | lexical match: code, shared API/refactor risk | src/integrations/opencode/project-init.ts contains 13 detected symbols, 2 imports, 5 exports. |
| `src/retrievers/codegraph.ts` | dependency-neighbor | 69 | lexical match: code, shared API/refactor risk | src/retrievers/codegraph.ts contains 3 detected symbols, 6 imports, 1 export. |
| `src/cli/capp-commands.ts` | dependency-neighbor | 172 | lexical match: code, direct importer of src/integrations/opencode/sidecar.ts, shared API/refactor risk | src/cli/capp-commands.ts contains 29 detected symbols, 5 imports, 7 exports. |
| `src/harness/observability/execution-trace.ts` | dependency-neighbor | 337 | lexical match: code, direct dependency of src/integrations/opencode/sidecar.ts, shared API/refactor risk | src/harness/observability/execution-trace.ts contains 49 detected symbols, 6 imports, 19 exports. |
| `src/outputs/impact.ts` | dependency-neighbor | 260 | lexical match: code, direct dependency of src/integrations/opencode/sidecar.ts, shared API/refactor risk | src/outputs/impact.ts contains 52 detected symbols, 4 imports, 4 exports. |
| `src/outputs/test-selector.ts` | dependency-neighbor | 249 | lexical match: code, direct dependency of src/integrations/opencode/sidecar.ts, shared API/refactor risk | src/outputs/test-selector.ts contains 50 detected symbols, 4 imports, 4 exports. |
| `src/core/types.ts` | dependency-neighbor | 300 | lexical match: code, shared API/refactor risk | src/core/types.ts contains 35 detected symbols, 0 imports, 35 exports. |
| `src/outputs/renderers/markdown.ts` | dependency-neighbor | 73 | lexical match: code, shared API/refactor risk | src/outputs/renderers/markdown.ts contains 8 detected symbols, 0 imports, 5 exports. |
| `src/outputs/agent-events.ts` | dependency-neighbor | 293 | lexical match: code, shared API/refactor risk | src/outputs/agent-events.ts contains 70 detected symbols, 3 imports, 6 exports. |
| `src/harness/control-plane/orchestrator.ts` | dependency-neighbor | 618 | lexical match: code, shared API/refactor risk | src/harness/control-plane/orchestrator.ts contains 132 detected symbols, 26 imports, 12 exports. |
| `src/core/token-estimator.ts` | dependency-neighbor | 132 | lexical match: code, shared API/refactor risk | src/core/token-estimator.ts contains 15 detected symbols, 3 imports, 7 exports. |
| `src/outputs/renderers/writer.ts` | dependency-neighbor | 270 | lexical match: code, shared API/refactor risk | src/outputs/renderers/writer.ts contains 61 detected symbols, 19 imports, 2 exports. |
| `src/outputs/context-delta.ts` | dependency-neighbor | 304 | lexical match: code, shared API/refactor risk | src/outputs/context-delta.ts contains 66 detected symbols, 5 imports, 9 exports. |
| `src/retrievers/index.ts` | dependency-neighbor | 100 | lexical match: code, shared API/refactor risk | src/retrievers/index.ts contains 5 detected symbols, 8 imports, 6 exports. |
| `src/core/context-builder.ts` | dependency-neighbor | 106 | direct dependency of test/codegraph.test.ts, direct dependency of src/integrations/opencode/sidecar.ts, shared API/refactor risk | src/core/context-builder.ts contains 15 detected symbols, 11 imports, 2 exports. |
| `src/harness/verification-plane/policy-engine.ts` | dependency-neighbor | 310 | direct dependency of src/integrations/opencode/sidecar.ts, shared API/refactor risk | src/harness/verification-plane/policy-engine.ts contains 54 detected symbols, 12 imports, 9 exports. |
| `src/harness/verification-plane/guards/regression.ts` | dependency-neighbor | 318 | direct dependency of src/integrations/opencode/sidecar.ts, shared API/refactor risk | src/harness/verification-plane/guards/regression.ts contains 64 detected symbols, 8 imports, 8 exports. |
| `src/outputs/task-harness.ts` | dependency-neighbor | 280 | direct dependency of src/integrations/opencode/sidecar.ts, shared API/refactor risk | src/outputs/task-harness.ts contains 68 detected symbols, 8 imports, 5 exports. |
| `src/harness/verification-plane/guards/hallucination.ts` | dependency-neighbor | 489 | direct dependency of src/integrations/opencode/sidecar.ts, shared API/refactor risk | src/harness/verification-plane/guards/hallucination.ts contains 109 detected symbols, 7 imports, 8 exports. |
| `src/outputs/contract-validator.ts` | dependency-neighbor | 327 | direct dependency of src/integrations/opencode/sidecar.ts, shared API/refactor risk | src/outputs/contract-validator.ts contains 65 detected symbols, 6 imports, 5 exports. |
| `src/core/safe-command.ts` | dependency-neighbor | 159 | direct dependency of src/integrations/opencode/sidecar.ts, shared API/refactor risk | src/core/safe-command.ts contains 26 detected symbols, 1 import, 5 exports. |
| `src/core/git.ts` | dependency-neighbor | 78 | direct dependency of src/integrations/opencode/sidecar.ts | src/core/git.ts contains 8 detected symbols, 1 import, 2 exports. |
| `src/core/freshness.ts` | dependency-neighbor | 290 | shared API/refactor risk | src/core/freshness.ts contains 57 detected symbols, 8 imports, 9 exports. |
| `src/harness/control-plane/loop-controller.ts` | dependency-neighbor | 309 | shared API/refactor risk | src/harness/control-plane/loop-controller.ts contains 60 detected symbols, 13 imports, 10 exports. |
| `src/outputs/task-run.ts` | dependency-neighbor | 203 | shared API/refactor risk | src/outputs/task-run.ts contains 43 detected symbols, 11 imports, 4 exports. |
| `src/retrievers/types.ts` | dependency-neighbor | 79 | shared API/refactor risk | src/retrievers/types.ts contains 4 detected symbols, 0 imports, 4 exports. |

## Budget Packing
| Bucket | Tokens | Files |
| --- | --- | --- |
| Directly relevant source files | 914 | `src/integrations/opencode/sidecar.ts`, `benchmarks/tasks/refactor-config-loader.json`, `benchmarks/tasks/refactor-session-expiry.json`, `code-agent-plusplus.config.example.yml`, `code-agent-plusplus.local.example.yml`, `assets/agent-context-code-layers.png` |
| Tests | 2,982 | `test/opencode-launcher.test.ts`, `test/codegraph.test.ts`, `test/opencode-preset.test.ts`, `test/capp-commands.test.ts`, `test/test-selector.test.ts`, `test/impact.test.ts`, `benchmarks/fixtures/small-ts-app/test/api/login.test.ts`, `benchmarks/fixtures/monorepo/packages/api/test/config.test.ts`, `benchmarks/fixtures/fastapi-app/tests/test_users.py`, `benchmarks/fixtures/react-app/src/auth/useAuthState.test.ts`, `benchmarks/fixtures/react-app/src/components/LoginStatus.test.tsx`, `benchmarks/fixtures/small-ts-app/test/auth/session.test.ts`, `benchmarks/fixtures/monorepo/packages/config/test/loader.test.ts`, `test/context-delta.test.ts`, `test/contract-validator.test.ts`, `test/execution-trace.test.ts`, `test/freshness.test.ts`, `test/hallucination-guard.test.ts`, `test/loop-controller.test.ts`, `test/orchestrator.test.ts`, `test/policy-engine.test.ts`, `test/regression-guard.test.ts`, `test/task-harness.test.ts`, `test/agents-md.test.ts`, `test/config.test.ts`, `test/mcp.test.ts`, `test/retrievers.test.ts`, `test/writer.test.ts`, `test/analyzers.test.ts`, `test/cache.test.ts`, `test/agent-events.test.ts`, `test/task-context.test.ts`, `test/fixtures.test.ts`, `test/token-savings.test.ts`, `test/readiness.test.ts`, `test/validator.test.ts`, `test/scanner.test.ts`, `test/snapshot.test.ts`, `test/agent-benchmark.test.ts`, `test/benchmark.test.ts` |
| Dependency neighbors | 7,242 | `src/integrations/opencode/launcher.ts`, `src/integrations/codegraph.ts`, `src/integrations/opencode/sidecar-plugin-template.ts`, `src/cli/opencode-preset.ts`, `src/integrations/opencode/project-init.ts`, `src/retrievers/codegraph.ts`, `src/cli/capp-commands.ts`, `src/harness/observability/execution-trace.ts`, `src/outputs/impact.ts`, `src/outputs/test-selector.ts`, `src/core/types.ts`, `src/outputs/renderers/markdown.ts`, `src/outputs/agent-events.ts`, `src/harness/control-plane/orchestrator.ts`, `src/core/token-estimator.ts`, `src/outputs/renderers/writer.ts`, `src/outputs/context-delta.ts`, `src/retrievers/index.ts`, `src/core/context-builder.ts`, `src/harness/verification-plane/policy-engine.ts`, `src/harness/verification-plane/guards/regression.ts`, `src/outputs/task-harness.ts`, `src/harness/verification-plane/guards/hallucination.ts`, `src/outputs/contract-validator.ts`, `src/core/safe-command.ts`, `src/core/git.ts`, `src/core/freshness.ts`, `src/harness/control-plane/loop-controller.ts`, `src/outputs/task-run.ts`, `src/retrievers/types.ts` |
| Config/docs | 0 | none |
| Entrypoints | 856 | `src/cli/index.ts`, `src/mcp/server.ts` |

Remaining budget: 6 estimated tokens

## Suggested Commands
- npm run test -- refactor
- npm run build
- npm run lint

## Anti-Regression Notes
- None detected.

## Required Regression Tests
- None detected.

## Suggested Agent Workflow
- Preserve exported APIs and inspect callers before moving code.
- Read `AGENTS.md` and inspect evidence before editing.
- Open the selected files and dependency neighbors.
- Run detected test/check commands after edits.
