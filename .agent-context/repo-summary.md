# Repository Summary

Generated for target: `codex`.

## Detected Stack
- Languages: JSON, JavaScript, Markdown, Python, TOML, TypeScript, YAML
- Frameworks: none detected
- Package managers: npm
- Files scanned: 203
- Symbols detected: 2771
- Dependency edges detected: 622

## Token Compression Estimate
Original repo (estimated, chars_approx): 1,656,005 tokens
Estimated context pack (chars_approx): 19,958 tokens
Compression: 83x
Token budget: 100,000 (within budget)

## Repository Summary
This repository contains 203 scanned files with 2771 detected symbols across 27 modules. Detected stack: languages JSON, JavaScript, Markdown, Python, TOML, TypeScript, YAML, frameworks none, package managers npm. Primary entrypoints: src/cli/index.ts, src/mcp/server.ts. Common commands: npm run dev, npm run build, npm run lint, npm run test. Highest-signal modules: outputs (src/outputs/agent-events.ts, src/outputs/agents-md.ts); test (test/agent-benchmark.test.ts, test/agent-events.test.ts); core (src/core/cache.ts, src/core/context-builder.ts); retrievers (src/retrievers/codegraph.ts, src/retrievers/external.ts). Highest-signal files: src/mcp/server.ts: src/mcp/server.ts contains 81 detected symbols, 18 imports, 4 exports.; src/core/freshness.ts: src/core/freshness.ts contains 57 detected symbols, 8 imports, 9 exports.; src/outputs/loop-controller.ts: src/outputs/loop-controller.ts contains 60 detected symbols, 13 imports, 10 exports.; src/outputs/policy-engine.ts: src/outputs/policy-engine.ts contains 48 detected symbols, 11 imports, 9 exports.; src/outputs/task-harness.ts: src/outputs/task-harness.ts contains 68 detected symbols, 8 imports, 5 exports..

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
- `outputs` - outputs contains 31 files and depends on core, integrations, sandbox.
- `test` - test contains 35 files and depends on analyzers, benchmarks, cli, config, core, integrations, mcp, outputs, retrievers.
- `core` - core contains 18 files and depends on analyzers, config, llm, outputs.
- `retrievers` - retrievers contains 7 files and depends on core, integrations, outputs.
- `benchmarks` - benchmarks contains 18 files and depends on core, outputs.
- `analyzers` - analyzers contains 6 files and depends on core.

## Key Entry Files
- `src/mcp/server.ts` - entrypoint, 4 exports
- `src/core/freshness.ts` - 9 exports, 57 symbols
- `src/outputs/loop-controller.ts` - 10 exports, 60 symbols
- `src/outputs/policy-engine.ts` - 9 exports, 48 symbols
- `src/outputs/task-harness.ts` - 5 exports, 68 symbols
- `src/outputs/regression-guard.ts` - 8 exports, 61 symbols
- `src/outputs/contract-validator.ts` - 5 exports, 65 symbols
- `src/outputs/execution-trace.ts` - 19 exports, 49 symbols

## Run Commands
- `npm run dev`

## Test Commands
- `npm run test`
