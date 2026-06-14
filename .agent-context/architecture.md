# Architecture Notes

This document is generated from static repository signals. Treat it as a starting map, not a final design document.

## High-Level Shape
- Primary languages: JSON, JavaScript, Markdown, Python, TOML, TypeScript, YAML
- Detected frameworks: none detected
- Main entrypoints: `src/cli/index.ts`, `src/mcp/server.ts`
- Internal modules: 25

## Important Modules
- `outputs`: outputs contains 27 files and depends on core.
- `test`: test contains 29 files and depends on analyzers, benchmarks, cli, config, core, mcp, outputs, retrievers.
- `core`: core contains 17 files and depends on analyzers, config, llm, outputs.
- `retrievers`: retrievers contains 6 files and depends on core, outputs.
- `analyzers`: analyzers contains 6 files and depends on core.
- `benchmarks/fixtures/small-ts-app`: benchmarks/fixtures/small-ts-app contains 9 files.
- `benchmarks`: benchmarks contains 17 files and depends on core, outputs.
- `benchmarks/fixtures/monorepo/packages/api`: benchmarks/fixtures/monorepo/packages/api contains 5 files and depends on benchmarks/fixtures/monorepo/packages/config.
- `benchmarks/fixtures/react-app`: benchmarks/fixtures/react-app contains 8 files.
- `cli`: cli contains 2 files and depends on benchmarks, config, core, outputs, retrievers.

## Agent Guidance
- Start with `AGENTS.md`, then read `key-files.md` for the highest-signal files.
- Use `dependency-graph.md` before editing shared modules or entrypoints.
- Prefer existing commands from `repo-summary.md` when running tests or checks.
- Generated summaries are evidence-based but shallow; inspect source before making broad changes.
