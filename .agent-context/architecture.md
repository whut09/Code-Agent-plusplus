# Architecture Notes

This document is generated from static repository signals. Treat it as a starting map, not a final design document.

## High-Level Shape
- Primary languages: JSON, Markdown, Python, TOML, TypeScript, YAML
- Detected frameworks: none detected
- Main entrypoints: `src/cli/index.ts`
- Internal modules: 10

## Important Modules
- `core`: core contains 15 files and depends on analyzers, config, llm.
- `test`: test contains 22 files and depends on analyzers, config, core, outputs.
- `outputs`: outputs contains 13 files and depends on core.
- `analyzers`: analyzers contains 5 files and depends on core.
- `config`: config contains 3 files and depends on core.
- `root`: root contains 12 files.
- `cli`: cli contains 1 file and depends on config, core, outputs.
- `llm`: llm contains 1 file and depends on core.
- `assets`: assets contains 1 file.
- `docs`: docs contains 4 files.

## Agent Guidance
- Start with `AGENTS.md`, then read `key-files.md` for the highest-signal files.
- Use `dependency-graph.md` before editing shared modules or entrypoints.
- Prefer existing commands from `repo-summary.md` when running tests or checks.
- Generated summaries are evidence-based but shallow; inspect source before making broad changes.
