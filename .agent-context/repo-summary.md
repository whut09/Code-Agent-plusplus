# Repository Summary

Generated for target: `codex`.

## Detected Stack
- Languages: JSON, JavaScript, Markdown, Python, TOML, TypeScript, YAML
- Frameworks: none detected
- Package managers: npm
- Files scanned: 174
- Symbols detected: 1747
- Dependency edges detected: 442

## Token Compression Estimate
Original repo (estimated, chars_approx): 1,556,546 tokens
Estimated context pack (chars_approx): 17,319 tokens
Compression: 90x
Token budget: 80,000 (within budget)

## Repository Summary
This repository contains 174 scanned files with 1747 detected symbols across 25 modules. Detected stack: languages JSON, JavaScript, Markdown, Python, TOML, TypeScript, YAML, frameworks none, package managers npm. Primary entrypoints: src/cli/index.ts, src/mcp/server.ts. Common commands: npm run dev, npm run build, npm run lint, npm run test. Highest-signal modules: outputs (src/outputs/agents-md.ts, src/outputs/architecture.ts); test (test/agents-md.test.ts, test/analyzers.test.ts); core (src/core/cache.ts, src/core/context-builder.ts); retrievers (src/retrievers/external.ts, src/retrievers/hybrid.ts). Highest-signal files: src/mcp/server.ts: src/mcp/server.ts contains 48 detected symbols, 13 imports, 4 exports.; src/core/freshness.ts: src/core/freshness.ts contains 57 detected symbols, 8 imports, 9 exports.; src/outputs/task-harness.ts: src/outputs/task-harness.ts contains 67 detected symbols, 7 imports, 5 exports.; src/outputs/contract-validator.ts: src/outputs/contract-validator.ts contains 65 detected symbols, 6 imports, 5 exports.; src/core/token-estimator.ts: src/core/token-estimator.ts contains 15 detected symbols, 3 imports, 7 exports..

## Summary Mode
- Mode: offline
- LLM attempted: no
- Fallback reason: disabled
- LLM summaries use local private configuration when `repo-context.local.yml` is present.

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
- `outputs` - outputs contains 23 files and depends on core.
- `test` - test contains 27 files and depends on analyzers, benchmarks, cli, config, core, mcp, outputs, retrievers.
- `core` - core contains 17 files and depends on analyzers, config, llm, outputs.
- `retrievers` - retrievers contains 6 files and depends on core, outputs.
- `analyzers` - analyzers contains 6 files and depends on core.
- `benchmarks/fixtures/small-ts-app` - benchmarks/fixtures/small-ts-app contains 9 files.

## Key Entry Files
- `src/mcp/server.ts` - entrypoint, 4 exports
- `src/core/freshness.ts` - 9 exports, 57 symbols
- `src/outputs/task-harness.ts` - 5 exports, 67 symbols
- `src/outputs/contract-validator.ts` - 5 exports, 65 symbols
- `src/core/token-estimator.ts` - 7 exports, 15 symbols
- `src/outputs/execution-trace.ts` - 13 exports, 22 symbols
- `src/cli/index.ts` - entrypoint, 72 symbols
- `src/core/context-builder.ts` - 2 exports, 15 symbols

## Run Commands
- `npm run dev`

## Test Commands
- `npm run test`
