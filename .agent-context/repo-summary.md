# Repository Summary

Generated for target: `codex`.

## Detected Stack
- Languages: JSON, JavaScript, Markdown, Python, TOML, TypeScript, YAML
- Frameworks: none detected
- Package managers: npm
- Files scanned: 258
- Symbols detected: 3351
- Dependency edges detected: 721

## Token Compression Estimate
Original repo (estimated, chars_approx): 1,714,159 tokens
Estimated context pack (chars_approx): 21,530 tokens
Compression: 80x
Token budget: 120,000 (within budget)

## Repository Summary
This repository contains 258 scanned files with 3351 detected symbols across 28 modules. Detected stack: languages JSON, JavaScript, Markdown, Python, TOML, TypeScript, YAML, frameworks none, package managers npm. Primary entrypoints: src/cli/index.ts, src/mcp/server.ts. Common commands: npm run dev, npm run build, npm run lint, npm run test. Highest-signal modules: test (test/agent-benchmark.test.ts, test/agent-events.test.ts); outputs (src/outputs/agent-events.ts, src/outputs/agents-md.ts); core (src/core/cache.ts, src/core/context-builder.ts); harness (src/harness/control-plane/decision-engine.ts, src/harness/control-plane/loop-controller.ts). Highest-signal files: src/mcp/server.ts: src/mcp/server.ts contains 102 detected symbols, 19 imports, 4 exports.; src/core/freshness.ts: src/core/freshness.ts contains 57 detected symbols, 8 imports, 9 exports.; src/harness/control-plane/loop-controller.ts: src/harness/control-plane/loop-controller.ts contains 60 detected symbols, 13 imports, 10 exports.; src/harness/control-plane/orchestrator.ts: src/harness/control-plane/orchestrator.ts contains 132 detected symbols, 26 imports, 12 exports.; src/harness/verification-plane/guards/regression.ts: src/harness/verification-plane/guards/regression.ts contains 64 detected symbols, 8 imports, 8 exports..

## Summary Mode
- Mode: offline
- LLM attempted: no
- Fallback reason: disabled
- LLM summaries use local private configuration when `code-agent-plusplus.local.yml` is present.

## Agent Readiness
- Score: A / 90
- Dimensions: operational 99/100; context-quality 99/100; agent-safety 100/100
- Caps applied: 1
- Missing signals: 1

## Entrypoints
- `src/cli/index.ts`
- `src/mcp/server.ts`

## Python CLI Entrypoints
- None detected.

## Top Modules
- `test` - test contains 39 files and depends on analyzers, benchmarks, cli, config, core, harness, integrations, mcp, outputs, retrievers.
- `outputs` - outputs contains 27 files and depends on core, harness, integrations.
- `core` - core contains 18 files and depends on analyzers, config, llm, outputs.
- `harness` - harness contains 9 files and depends on core, outputs, sandbox.
- `retrievers` - retrievers contains 7 files and depends on core, integrations, outputs.
- `integrations` - integrations contains 5 files and depends on core, harness, outputs, retrievers.

## Key Entry Files
- `src/mcp/server.ts` - entrypoint, 4 exports
- `src/core/freshness.ts` - 9 exports, 57 symbols
- `src/harness/control-plane/loop-controller.ts` - 10 exports, 60 symbols
- `src/harness/control-plane/orchestrator.ts` - 12 exports, 132 symbols
- `src/harness/verification-plane/guards/regression.ts` - 8 exports, 64 symbols
- `src/harness/verification-plane/policy-engine.ts` - 9 exports, 54 symbols
- `src/integrations/opencode/sidecar.ts` - 18 exports, 136 symbols
- `src/outputs/task-harness.ts` - 5 exports, 68 symbols

## Run Commands
- `npm run dev`

## Test Commands
- `npm run test`
