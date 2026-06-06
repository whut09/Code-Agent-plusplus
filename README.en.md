# Repo-to-Agent-Context

[中文](README.md) | English

Turn any repository into a compact, structured, agent-ready context package for Claude, Codex, Cursor, and similar coding agents.

The first version is deliberately offline-first: it scans a repo, extracts lightweight code structure, ranks important files, builds dependency graphs, and writes Markdown/JSON context files without requiring an LLM.

<p align="center">
  <img src="./assets/context-pack-demo.svg" width="900" alt="Repo-to-Agent-Context final output animation">
</p>

## Use It Through an AI Agent

You can also ask Codex, Claude Code, Cursor, or another coding agent to run this project for you. For example, in Codex:

```txt
Use https://github.com/whut09/Repo-to-Agent-Context to generate AGENTS.md and a .agent-context package for the xxx project. Inspect the target repository first, then install or clone the tool if needed. Force LLM summaries: create or update repo-context.local.yml in the target repo, do not commit that file, and prefer the model API configuration available in the current AI tool environment or the key/baseUrl/model I provide; if configuration is missing, ask me first. Then run repo-context build <target-repo> --target codex --llm, run repo-context validate <target-repo>, and summarize the generated files plus whether LLM summary mode succeeded.
```

Replace `xxx project` with a local path, GitHub repository, or workspace name. If you only need the root guide, say `generate AGENTS.md`; if you want the full context pack, ask for `AGENTS.md and .agent-context`.

Note: the current AI tool must provide callable model API credentials, base URL, and model name for Repo-to-Agent-Context to run real LLM summaries. If Codex, Claude, or Cursor does not expose its own model as an API, ask the user for configuration first. Real keys should only go into `repo-context.local.yml`.

## Quick Start

After publishing the package to npm:

```bash
npx repo-to-agent-context build ./path/to/repo
```

From source:

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
  readiness.md
  readiness.json
  token-savings.md
  token-savings.json
  tasks/
    bugfix-context.md
    feature-context.md
    refactor-context.md
    bugfix.json
    feature.json
    refactor.json
  rag/
    README.md
    manifest.json
    documents.jsonl
  evidence/
    file-evidence.json
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
repo-context validate [repo]
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
repo-context validate .
repo-context savings . --token-budget 60000
repo-context task "fix login timeout bug" . --type bugfix --token-budget 12000
repo-context diff . --base main
repo-context rag export . --token-budget 60000
```

## Token Savings Report

Every build includes a token savings report:

```txt
Original repo: 2,400,000 tokens
Context pack: 42,000 tokens
Compression: 57x
Token budget: 60,000 (within budget)
Actual generated output: 31,000 tokens (chars_approx)
```

The report separates compact-pack estimates from actual generated Markdown, Mermaid, and RAG JSONL size. Machine-readable indexes are excluded from actual output tokens and documented in the report scope.

Generated files:

- `.agent-context/token-savings.md`
- `.agent-context/token-savings.json`

## Agent Readiness Score

The readiness report makes missing context obvious:

```txt
Agent Readiness: 76/100

Categories:
- Structure: 90/100
- Commands: 70/100
- Tests: 50/100
- Architecture: 80/100
- Task Context: 65/100
- Safety: 85/100
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

When LLM mode is disabled, Repo-to-Agent-Context uses offline summaries. When enabled, missing or `xx` credentials fail with an actionable error instead of silently falling back. Runtime request failures fall back to offline summaries and record the fallback reason.

Run `repo-context validate .` to check config, generated JSON, dependency edges, confidence, and token budget.

## Analysis Confidence And Evidence

- TypeScript/JavaScript uses the TypeScript Compiler API for imports, exports, symbols, routes, barrel exports, and `tsconfig` path aliases.
- Python resolves local absolute and relative imports.
- Unsupported and fallback analysis is marked low-confidence.

Each indexed file includes `analyzer`, `confidence`, and line-oriented `evidence`. Aggregated evidence is written to `.agent-context/evidence/file-evidence.json`.

## Task Context Packs

Task mode combines lexical retrieval, dependency graph expansion, related tests/entrypoints/configuration, and token-budgeted packing.

```bash
repo-context task "fix login timeout bug" . --type bugfix --token-budget 12000
repo-context task "add SSO login" . --type feature
repo-context task "split auth module" . --type refactor
```

Machine-readable packs are generated under `.agent-context/tasks/*.json`.

## Optional RAG With LightRAG

RAG is useful, but it should not replace the static context pack. The recommended architecture is:

```txt
Static context pack first
  -> AGENTS.md, summaries, dependency graph, key files
Optional RAG adapter second
  -> LightRAG-friendly JSONL export for later LightRAG Server ingestion
```

Repo-to-Agent-Context generates:

- `.agent-context/rag/documents.jsonl`
- `.agent-context/rag/manifest.json`
- `.agent-context/rag/README.md`

LightRAG remains optional because it usually requires a separate Python/server environment and consistent embedding configuration between indexing and querying.

This version exports LightRAG-ready documents but does not directly synchronize with a LightRAG Server.

## Architecture

See [docs/architecture.md](docs/architecture.md) for the implementation design, [docs/agents-md.md](docs/agents-md.md) for agent instruction usage, and [docs/roadmap.md](docs/roadmap.md) for planned phases.

## Configuration

Create `repo-context.config.yml`:

```yaml
target: codex
tokenBudget: 60000

tokenizer:
  mode: chars_approx

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

The `outputs` switches control optional generated artifacts. Disabling a switch also removes previously generated artifacts in that optional group. Repository summary, key files, onboarding, token savings, and machine-readable indexes are always generated.

## Development

```bash
npm run build
npm run check
npm test
npm pack --dry-run
```
