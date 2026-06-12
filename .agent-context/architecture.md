# Architecture Notes

This document is generated from static repository signals. Treat it as a starting map, not a final design document.

## High-Level Shape
- Primary languages: JSON, JavaScript, Markdown, Python, TOML, TypeScript, YAML
- Detected frameworks: none detected
- Main entrypoints: `src/cli/index.ts`
- Internal modules: 13

## Important Modules
- `benchmarks`: benchmarks contains 49 files and depends on core, outputs.
- `outputs`: outputs contains 20 files and depends on core.
- `test`: test contains 32 files and depends on analyzers, benchmarks, cli, config, core, outputs, retrievers.
- `core`: core contains 15 files and depends on analyzers, config, llm.
- `retrievers`: retrievers contains 6 files and depends on core, outputs.
- `analyzers`: analyzers contains 6 files and depends on core.
- `cli`: cli contains 2 files and depends on benchmarks, config, core, outputs, retrievers.
- `config`: config contains 3 files and depends on core.
- `root`: root contains 17 files.
- `llm`: llm contains 1 file and depends on core.

## Agent Guidance
- Start with `AGENTS.md`, then read `key-files.md` for the highest-signal files.
- Use `dependency-graph.md` before editing shared modules or entrypoints.
- Prefer existing commands from `repo-summary.md` when running tests or checks.
- Generated summaries are evidence-based but shallow; inspect source before making broad changes.
