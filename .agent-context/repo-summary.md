# Repository Summary

Generated for target: `codex`.

## Detected Stack
- Languages: JSON, JavaScript, Markdown, Python, TOML, TypeScript, YAML
- Frameworks: none detected
- Package managers: npm
- Files scanned: 194
- Symbols detected: 2540
- Dependency edges detected: 562

## Token Compression Estimate
Original repo (estimated, chars_approx): 1,634,286 tokens
Estimated context pack (chars_approx): 19,027 tokens
Compression: 86x
Token budget: 100,000 (within budget)

## Repository Summary
This repository contains 194 scanned files with 2540 detected symbols across 25 modules. Detected stack: languages JSON, JavaScript, Markdown, Python, TOML, TypeScript, YAML, frameworks none, package managers npm. Primary entrypoints: src/cli/index.ts, src/mcp/server.ts. Common commands: npm run dev, npm run build, npm run lint, npm run test. Highest-signal modules: outputs (src/outputs/agent-events.ts, src/outputs/agents-md.ts); test (test/agent-events.test.ts, test/agents-md.test.ts); core (src/core/cache.ts, src/core/context-builder.ts); retrievers (src/retrievers/external.ts, src/retrievers/hybrid.ts). Highest-signal files: src/mcp/server.ts: src/mcp/server.ts contains 81 detected symbols, 18 imports, 4 exports.; src/core/freshness.ts: src/core/freshness.ts contains 57 detected symbols, 8 imports, 9 exports.; src/outputs/policy-engine.ts: src/outputs/policy-engine.ts contains 48 detected symbols, 11 imports, 9 exports.; src/outputs/task-harness.ts: src/outputs/task-harness.ts contains 68 detected symbols, 8 imports, 5 exports.; src/outputs/regression-guard.ts: src/outputs/regression-guard.ts contains 61 detected symbols, 7 imports, 8 exports..

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
- `outputs` - outputs contains 30 files and depends on core.
- `test` - test contains 33 files and depends on analyzers, benchmarks, cli, config, core, mcp, outputs, retrievers.
- `core` - core contains 18 files and depends on analyzers, config, llm, outputs.
- `retrievers` - retrievers contains 6 files and depends on core, outputs.
- `analyzers` - analyzers contains 6 files and depends on core.
- `benchmarks/fixtures/small-ts-app` - benchmarks/fixtures/small-ts-app contains 9 files.

## Key Entry Files
- `src/mcp/server.ts` - entrypoint, 4 exports
- `src/core/freshness.ts` - 9 exports, 57 symbols
- `src/outputs/policy-engine.ts` - 9 exports, 48 symbols
- `src/outputs/task-harness.ts` - 5 exports, 68 symbols
- `src/outputs/regression-guard.ts` - 8 exports, 61 symbols
- `src/outputs/contract-validator.ts` - 5 exports, 65 symbols
- `src/outputs/execution-trace.ts` - 19 exports, 49 symbols
- `src/outputs/task-run.ts` - 4 exports, 43 symbols

## Run Commands
- `npm run dev`

## Test Commands
- `npm run test`
