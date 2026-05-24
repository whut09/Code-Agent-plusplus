# Repo-to-Agent-Context

[中文](README.zh-CN.md) | English

Turn any repository into a compact, structured, agent-ready context package for Claude, Codex, Cursor, and similar coding agents.

The first version is deliberately offline-first: it scans a repo, extracts lightweight code structure, ranks important files, builds dependency graphs, and writes Markdown/JSON context files without requiring an LLM.

## Quick Start

```bash
npm install
npm run build
node dist/cli/index.js build ./path/to/repo
```

During development:

```bash
npm run dev -- build ./path/to/repo
```

## Does the Agent Read AGENTS.md Automatically?

It depends on the coding tool, not the model itself. `AGENTS.md` is a convention used by agent clients to inject repository instructions into the model context.

- Codex: yes. Codex reads `AGENTS.md` before doing work. It can combine global guidance from your Codex home directory with project-level `AGENTS.md` files.
- Claude Code: not directly. Claude Code reads `CLAUDE.md`. To reuse the generated agent guide, create a root `CLAUDE.md` with `@AGENTS.md`, then add Claude-specific notes below it if needed.
- Cursor: yes for straightforward project instructions. Place `AGENTS.md` at the project root. For scoped, conditional, or multi-file rules, prefer `.cursor/rules`.
- Other tools: support varies. If a tool does not auto-load `AGENTS.md`, attach or reference the file manually in your prompt.

See [docs/agents-md.md](docs/agents-md.md) for detailed usage patterns and official references.

## Outputs

```txt
AGENTS.md
.agent-context/
  repo-summary.md
  key-files.md
  module-map.md
  dependency-graph.md
  architecture.md
  onboarding.md
  index/
    files.json
    symbols.json
    modules.json
    chunks.json
  graphs/
    dependencies.json
    dependencies.mmd
```

## Commands

```bash
repo-context init [repo]
repo-context build [repo]
repo-context graph [repo]
repo-context explain <path> [repo]
repo-context savings [repo]
repo-context readiness [repo]
repo-context task "<task>" [repo]
repo-context diff [repo] --base main
repo-context update [repo] --since main
repo-context rag export [repo]
```

Examples:

```bash
repo-context build . --target codex
repo-context build . --llm
repo-context build ../my-app --target all --token-budget 80000
repo-context explain src/server.ts .
repo-context explain auth .
repo-context readiness .
repo-context savings .
repo-context task "fix login timeout bug" .
repo-context diff . --base main
repo-context rag export .
```

## Token Savings Report

Every build includes a token savings report:

```txt
Original repo: 2,400,000 tokens
Context pack: 42,000 tokens
Compression: 57x
```

Generated files:

- `.agent-context/token-savings.md`
- `.agent-context/token-savings.json`

## Agent Readiness Score

The readiness report makes missing context obvious:

```txt
Agent Readiness: 82/100

Missing or weak signals:
- No test/check command detected.
- No architecture summary.
- Large undocumented module: src/core.
```

Generated files:

- `.agent-context/readiness.md`
- `.agent-context/readiness.json`

## Optional LLM Summaries

LLM usage is optional. The CLI works offline by default.

Committed configuration should only contain placeholders:

```yaml
llm:
  enabled: false
  provider: openai-compatible
  baseUrl: xx
  apiKey: xx
  model: xx
```

For local use, copy `repo-context.local.example.yml` to `repo-context.local.yml` and put your real key and URL there. `repo-context.local.yml` is ignored by git.

```yaml
llm:
  enabled: true
  provider: openai-compatible
  baseUrl: xx
  apiKey: xx
  model: xx
```

Then run:

```bash
repo-context build . --llm
```

If the local key, URL, or model is missing or still set to `xx`, Repo-to-Agent-Context falls back to offline summaries.

## Optional RAG With LightRAG

RAG is useful, but it should not replace the static context pack. The recommended architecture is:

```txt
Static context pack first
  -> AGENTS.md, summaries, dependency graph, key files
Optional RAG adapter second
  -> LightRAG-friendly JSONL export or LightRAG Server ingestion
```

Repo-to-Agent-Context generates:

- `.agent-context/rag/documents.jsonl`
- `.agent-context/rag/manifest.json`
- `.agent-context/rag/README.md`

LightRAG remains optional because it usually requires a separate Python/server environment and consistent embedding configuration between indexing and querying.

## Architecture

See [docs/architecture.md](docs/architecture.md) for the implementation design, [docs/agents-md.md](docs/agents-md.md) for agent instruction usage, and [docs/roadmap.md](docs/roadmap.md) for planned phases.

## Configuration

Create `repo-context.config.yml`:

```yaml
target: codex
tokenBudget: 60000

include:
  - src/**
  - docs/**
  - package.json

exclude:
  - node_modules/**
  - dist/**
  - coverage/**

outputs:
  agents: true
  modules: true
  graph: true
  tasks: true
  readiness: true
  rag: true
```
