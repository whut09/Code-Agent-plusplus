# Architecture Notes

This document is generated from static repository signals. Treat it as a starting map, not a final design document.

## High-Level Shape
- Primary languages: JSON, JavaScript, Markdown, Python, TOML, TypeScript, YAML
- Detected frameworks: none detected
- Main entrypoints: `src/cli/index.ts`, `src/mcp/server.ts`
- Internal modules: 28

## Important Modules
- `test`: test contains 38 files and depends on analyzers, benchmarks, cli, config, core, harness, integrations, mcp, outputs, retrievers.
- `outputs`: outputs contains 27 files and depends on core, harness, integrations.
- `core`: core contains 18 files and depends on analyzers, config, llm, outputs.
- `harness`: harness contains 9 files and depends on core, outputs, sandbox.
- `retrievers`: retrievers contains 7 files and depends on core, integrations, outputs.
- `integrations`: integrations contains 5 files and depends on core, outputs, retrievers.
- `benchmarks`: benchmarks contains 25 files and depends on core, harness, outputs.
- `analyzers`: analyzers contains 6 files and depends on core.
- `benchmarks/fixtures/small-ts-app`: benchmarks/fixtures/small-ts-app contains 13 files.
- `cli`: cli contains 4 files and depends on benchmarks, config, core, harness, integrations, outputs, retrievers.

## Agent Guidance
- Start with `AGENTS.md`, then read `key-files.md` for the highest-signal files.
- Use `dependency-graph.md` before editing shared modules or entrypoints.
- Prefer existing commands from `repo-summary.md` when running tests or checks.
- Generated summaries are evidence-based but shallow; inspect source before making broad changes.
