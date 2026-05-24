# Architecture Notes

This document is generated from static repository signals. Treat it as a starting map, not a final design document.

## High-Level Shape
- Primary languages: JSON, Markdown, TypeScript, YAML
- Detected frameworks: none detected
- Main entrypoints: `src/cli/index.ts`
- Internal modules: 7

## Important Modules
- `core`: core contains 10 files and depends on analyzers, config.
- `outputs`: outputs contains 9 files and depends on core.
- `analyzers`: analyzers contains 5 files and depends on core.
- `root`: root contains 8 files.
- `cli`: cli contains 1 file and depends on core, outputs.
- `config`: config contains 2 files and depends on core.
- `docs`: docs contains 4 files.

## Agent Guidance
- Start with `AGENTS.md`, then read `key-files.md` for the highest-signal files.
- Use `dependency-graph.md` before editing shared modules or entrypoints.
- Prefer existing commands from `repo-summary.md` when running tests or checks.
- Generated summaries are evidence-based but shallow; inspect source before making broad changes.
