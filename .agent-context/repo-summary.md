# Repository Summary

Generated for target: `codex`.

## Detected Stack
- Languages: JSON, JavaScript, Markdown, Python, TOML, TypeScript, YAML
- Frameworks: none detected
- Package managers: npm
- Files scanned: 158
- Symbols detected: 1256
- Dependency edges detected: 317

## Token Compression Estimate
Original repo (estimated, chars_approx): 1,516,021 tokens
Estimated context pack (chars_approx): 14,674 tokens
Compression: 103x
Token budget: 80,000 (within budget)

## Repository Summary
This repository contains 158 scanned files with 1256 detected symbols across 13 modules. Detected stack: languages JSON, JavaScript, Markdown, Python, TOML, TypeScript, YAML, frameworks none, package managers npm. Primary entrypoints: src/cli/index.ts. Common commands: npm run dev, npm run build, npm run lint, npm run test. Highest-signal modules: benchmarks (benchmarks/README.md, benchmarks/expected/relevant-files.json); test (test/agents-md.test.ts, test/analyzers.test.ts); outputs (src/outputs/agents-md.ts, src/outputs/architecture.ts); core (src/core/context-builder.ts, src/core/file-classifier.ts). Highest-signal files: src/cli/index.ts: src/cli/index.ts contains 50 detected symbols, 22 imports, 0 exports.; src/core/token-estimator.ts: src/core/token-estimator.ts contains 9 detected symbols, 2 imports, 5 exports.; src/core/context-builder.ts: src/core/context-builder.ts contains 11 detected symbols, 10 imports, 2 exports.; src/outputs/task-harness.ts: src/outputs/task-harness.ts contains 66 detected symbols, 6 imports, 5 exports.; src/core/types.ts: src/core/types.ts contains 34 detected symbols, 0 imports, 34 exports..

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

## Top Modules
- `benchmarks` - benchmarks contains 49 files and depends on core, outputs.
- `test` - test contains 31 files and depends on analyzers, benchmarks, cli, config, core, outputs, retrievers.
- `outputs` - outputs contains 19 files and depends on core.
- `core` - core contains 15 files and depends on analyzers, config, llm.
- `retrievers` - retrievers contains 6 files and depends on core, outputs.
- `analyzers` - analyzers contains 6 files and depends on core.

## Key Entry Files
- `src/cli/index.ts` - entrypoint, 50 symbols
- `src/core/token-estimator.ts` - 5 exports, 9 symbols
- `src/core/context-builder.ts` - 2 exports, 11 symbols
- `src/outputs/task-harness.ts` - 5 exports, 66 symbols
- `src/core/types.ts` - 34 exports, 34 symbols
- `src/outputs/markdown.ts` - 5 exports, 8 symbols
- `src/benchmarks/benchmark.ts` - 7 exports, 44 symbols
- `src/outputs/task-context.ts` - 3 exports, 64 symbols

## Run Commands
- `npm run dev`

## Test Commands
- `npm run test`
