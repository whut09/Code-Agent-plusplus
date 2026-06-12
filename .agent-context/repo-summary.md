# Repository Summary

Generated for target: `codex`.

## Detected Stack
- Languages: JSON, JavaScript, Markdown, Python, TOML, TypeScript, YAML
- Frameworks: none detected
- Package managers: npm
- Files scanned: 163
- Symbols detected: 1410
- Dependency edges detected: 355

## Token Compression Estimate
Original repo (estimated, chars_approx): 1,538,870 tokens
Estimated context pack (chars_approx): 15,344 tokens
Compression: 100x
Token budget: 80,000 (within budget)

## Repository Summary
This repository contains 163 scanned files with 1410 detected symbols across 14 modules. Detected stack: languages JSON, JavaScript, Markdown, Python, TOML, TypeScript, YAML, frameworks none, package managers npm. Primary entrypoints: src/cli/index.ts, src/mcp/server.ts. Common commands: npm run dev, npm run build, npm run lint, npm run test. Highest-signal modules: benchmarks (benchmarks/README.md, benchmarks/agent-runs/manual-eval.json); test (test/agents-md.test.ts, test/analyzers.test.ts); outputs (src/outputs/agents-md.ts, src/outputs/architecture.ts); core (src/core/context-builder.ts, src/core/file-classifier.ts). Highest-signal files: src/mcp/server.ts: src/mcp/server.ts contains 48 detected symbols, 13 imports, 4 exports.; src/outputs/task-harness.ts: src/outputs/task-harness.ts contains 67 detected symbols, 7 imports, 5 exports.; src/cli/index.ts: src/cli/index.ts contains 52 detected symbols, 23 imports, 0 exports.; src/core/token-estimator.ts: src/core/token-estimator.ts contains 9 detected symbols, 2 imports, 5 exports.; src/core/context-builder.ts: src/core/context-builder.ts contains 11 detected symbols, 10 imports, 2 exports..

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

## Top Modules
- `benchmarks` - benchmarks contains 50 files and depends on core, outputs.
- `test` - test contains 33 files and depends on analyzers, benchmarks, cli, config, core, mcp, outputs, retrievers.
- `outputs` - outputs contains 20 files and depends on core.
- `core` - core contains 15 files and depends on analyzers, config, llm.
- `retrievers` - retrievers contains 6 files and depends on core, outputs.
- `analyzers` - analyzers contains 6 files and depends on core.

## Key Entry Files
- `src/mcp/server.ts` - entrypoint, 4 exports
- `src/outputs/task-harness.ts` - 5 exports, 67 symbols
- `src/cli/index.ts` - entrypoint, 52 symbols
- `src/core/token-estimator.ts` - 5 exports, 9 symbols
- `src/core/context-builder.ts` - 2 exports, 11 symbols
- `src/outputs/writer.ts` - 2 exports, 55 symbols
- `src/outputs/contract-validator.ts` - 5 exports, 61 symbols
- `src/outputs/test-selector.ts` - 4 exports, 44 symbols

## Run Commands
- `npm run dev`

## Test Commands
- `npm run test`
