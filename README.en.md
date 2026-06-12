# Repo-to-Agent-Context

[中文](README.md) | English

Repo-to-Agent-Context is a repository context harness that generates minimal, evidence-linked, task-aware context packs for coding agents, with validation hooks to reduce irrelevant context, unsafe edits, and regression risk.

The first version is deliberately offline-first: it scans a repo, extracts lightweight code structure, ranks important files, builds dependency graphs, and writes Markdown/JSON context files without requiring an LLM.

The next direction is to move from "help the agent understand the repository" to "help the agent safely and verifiably complete tasks inside the repository" through task-level context, change impact analysis, test recommendation, edit boundaries, verification loops, and context-quality benchmarks.

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

- The generated `AGENTS.md` defaults to `agents.mode: minimal`, keeping only mandatory operating rules, entrypoints, required commands, and links into `.agent-context/`.
- Root instructions are now split into three layers: hand-maintained `AGENTS.manual.md`, generated `.agent-context/AGENTS.generated.md`, and composed `AGENTS.md`.
- If a repository already has a hand-written legacy `AGENTS.md`, the first build migrates environment and deployment sections into `AGENTS.manual.md` before regenerating the composed root file.
- Longer repo summaries, module maps, dependency graphs, readiness details, and task packs live under `.agent-context/` so the root instruction file stays small.
- Codex: yes. Codex reads `AGENTS.md` before doing work. It can combine global guidance from your Codex home directory with project-level `AGENTS.md` files.
- Claude Code: not directly. Claude Code reads `CLAUDE.md`. To reuse the generated agent guide, create a root `CLAUDE.md` with `@AGENTS.md`, then add Claude-specific notes below it if needed.
- Cursor: yes for straightforward project instructions. Place `AGENTS.md` at the project root. For scoped, conditional, or multi-file rules, prefer `.cursor/rules`.
- Other tools: support varies. If a tool does not auto-load `AGENTS.md`, attach or reference the file manually in your prompt.

See [docs/agents-md.md](docs/agents-md.md) for detailed usage patterns and official references.

## Outputs

```txt
AGENTS.md
AGENTS.manual.md
.agent-context/
  AGENTS.generated.md
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
  contracts/
    architecture.contract.json
    module-boundaries.json
    commands.contract.json
    test.contract.json
    safety.contract.json
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
  cache/                 # local incremental cache; ignore in git
    file-hashes.json
    index-cache.json
    graph-cache.json
    tokenizer-cache.json
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
repo-context validate-contracts [repo]
repo-context run "<task>" [repo]
repo-context plan "<task>" [repo]
repo-context pack "<task>" [repo]
repo-context verify --diff [repo]
repo-context impact [repo] --base main
repo-context tests [repo] --for <path>
repo-context tests [repo] --diff --base main
repo-context benchmark [benchmarkDir] --top-k 8
repo-context retrieve "<task>" [repo] --provider hybrid
repo-context-mcp
repo-context task "<task>" [repo]
repo-context task "<task>" --repo <repo...>
repo-context diff [repo] --base main
repo-context update [repo] --since main
repo-context rag export [repo]
```

Examples:

```bash
repo-context build . --target codex
repo-context build . --target codex --tokenizer chars-approx
repo-context build . --target codex --model gpt-4.1
repo-context build . --llm
repo-context build ../my-app --target all --token-budget 80000
repo-context explain src/server.ts .
repo-context explain auth .
repo-context readiness .
repo-context validate .
repo-context validate-contracts .
repo-context savings . --token-budget 60000
repo-context savings . --actual --model gpt-4.1
repo-context run "fix login timeout bug" . --type bugfix --token-budget 12000
repo-context plan "fix login timeout bug" . --type bugfix
repo-context pack "fix login timeout bug" . --type bugfix --token-budget 12000
repo-context verify --diff .
repo-context impact . --base main
repo-context tests . --for src/auth/session.ts
repo-context tests . --diff --base main
repo-context task "fix login timeout bug" . --type bugfix --token-budget 12000
repo-context task fix login timeout bug --repo "../my app/中文项目" --type bugfix
repo-context diff . --base main
repo-context rag export . --token-budget 60000
```

## Incremental Cache

Large repositories and MCP/editor integrations should not rebuild all context on every command. Builds write `.agent-context/cache/` when the target is a Git repository or already has `.agent-context/`:

- `file-hashes.json`: file hashes, sizes, and mtimes; unchanged size/mtime reuses the previous hash and avoids rereading large files.
- `index-cache.json`: reused scan/index/symbol/evidence results keyed by file hash and dependency-resolution fingerprint.
- `graph-cache.json`: dependency graph reused by index fingerprint.
- `tokenizer-cache.json`: token counts reused by tokenizer, model, and text hash.

Invalidation rules: changed file hashes refresh only that file analysis; `package.json`, `tsconfig.json`, `jsconfig.json`, `pyproject.toml`, workspace files, or lockfiles refresh dependency resolution; config changes rerender outputs while reusing unaffected indexes; task changes only regenerate the plan/pack/run layer. `.agent-context/cache/**` is ignored by `diff`, `impact`, `tests --diff`, and `verify --diff` so cache files do not pollute change impact analysis.

## Token Savings Report

Every build includes a token savings report:

```txt
Original repo (estimated, chars_approx): 2,400,000 tokens
Estimated context pack (chars_approx): 42,000 tokens
Actual context pack (o200k_base, gpt-4.1): 41,832 tokens
Compression: 57x
Token budget: 60,000 (within budget)
```

The report separates original repository estimates, theoretical compact context estimates, and actual generated Markdown, Mermaid, and RAG JSONL token counts. Machine-readable indexes are excluded from actual output tokens and documented in the report scope. Real tokenizer modes use `js-tiktoken`; unsupported models fall back to `chars_approx`.

Generated files:

- `.agent-context/token-savings.md`
- `.agent-context/token-savings.json`

## Agent Readiness Score

The readiness report is an engineering diagnostic, not a guarantee of agent task success. It rolls low-level signals into three dimensions and applies hard caps so repositories do not get easy 100s:

```txt
Agent Readiness: B / 82

Dimensions:
- Operational: 90/100
- Context Quality: 75/100
- Agent Safety: 70/100

Hard caps:
- max 90 when no CI workflow is detected
- max 90 when token counting uses chars_approx instead of a model tokenizer
- max 85 when no high-confidence AST/compiler analyzer evidence exists
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

Run `repo-context validate .` to check config, generated JSON, dependency edges, confidence, and token budget. Run `repo-context validate-contracts .` to treat `contracts/` as an edit boundary and fail on protected paths, illegal dependencies, lockfile mismatches, env-example drift, and missing test coverage.

## Analysis Confidence And Evidence

- TypeScript/JavaScript uses the TypeScript Compiler API for `import type`, dynamic `import()`, re-exports, symbols, barrel exports, `tsconfig` path aliases, workspace package aliases, and common Next.js/Express/Fastify/Hono/NestJS route patterns.
- Python uses the optional Tree-sitter backend first when the runtime provides `tree_sitter` and `tree_sitter_python`, then falls back to stdlib `ast`, then lightweight parsing. It resolves local absolute and relative imports such as `from .models import User` and `from app.services.auth import login`.
- Unsupported and fallback analysis is marked low-confidence.

Each indexed file includes `analyzer`, `confidence`, `analysisStats` (`parser`, resolved/unresolved imports, symbols, routes), and line-oriented `evidence`. Aggregated evidence is written to `.agent-context/evidence/file-evidence.json`.

## Context Layers

Generated context is split into L0-L3 so agents do not load the full `.agent-context/` directory by default:

- L0: `AGENTS.md`, the shortest operating rules and default workflow, always loaded.
- L1: `.agent-context/repo-summary.md`, `.agent-context/onboarding.md`, and `.agent-context/context-layers.md`, loaded when a new task starts.
- L2: `.agent-context/runs/<task-id>/` for a complete task run, or `.agent-context/tasks/<task>/` for a standalone task pack, loaded only for the concrete task.
- L3: `.agent-context/key-files.md`, `index/`, `evidence/`, `graphs/`, and `rag/`, loaded on demand for deeper analysis, symbol lookup, or evidence tracing.

`AGENTS.md` states the default workflow explicitly: read only `AGENTS.md` first; for a concrete task, run `repo-context run "<task>" .` or inspect the generated run directory; do not load the full `.agent-context/` directory by default; prefer source files over generated summaries for behavior decisions. Manual environment and deployment notes stay in `AGENTS.manual.md` and are loaded only for environment, deployment, configuration, or operations tasks.

## Task Context Packs

The task workflow has a complete closed-loop entrypoint: `repo-context run "<task>" .`. It does not edit code; it writes one Agent execution directory under `.agent-context/runs/<task-id>/` with `plan.md`, `pack.md`, `edit-boundary.md`, `expected-diff.md`, `tests.md`, `verify.md`, `impact.md`, `prompt.codex.md`, `prompt.claude.md`, `prompt.cursor.md`, and `run.json`. The individual `plan`, `pack`, `verify`, `impact`, and `tests` commands remain available when a user or automation needs only one stage. The older `task` command remains as a compatibility shortcut.

Task packing is a three-stage context selector rather than a plain keyword file list:

1. Direct retrieval matches the task against paths, modules, summaries, exports, symbols, tests, and docs.
2. Graph expansion adds direct imports, direct importers, sibling tests, entrypoints, config files, and owning module docs.
3. Budget packing groups selected files into direct source, tests, dependency neighbors, config/docs, and entrypoints.

```bash
repo-context run "fix login timeout bug" . --type bugfix --token-budget 12000
repo-context plan "fix login timeout bug" . --type bugfix
repo-context pack "fix login timeout bug" . --type bugfix --token-budget 12000
repo-context verify --diff .
repo-context validate-contracts --diff .
repo-context impact . --base main
repo-context tests . --for src/auth/session.ts
repo-context tests . --diff --base main
repo-context task "fix login timeout bug" . --type bugfix --token-budget 12000
repo-context task fix login timeout bug --repo "../my app/中文项目" --type bugfix
repo-context task "add SSO login" . --type feature
repo-context task "split auth module" . --type refactor
```

The Markdown output gives agents `Read First`, `Then Inspect If Needed`, `Why These Files`, `Budget Packing`, and `Suggested Commands` sections. Machine-readable packs are generated under `.agent-context/tasks/*.json`.

## Benchmark

The repository includes a demo context-quality benchmark under `benchmarks/`. It evaluates task-aware context packs against expected relevant files and required tests across small TypeScript, React, FastAPI, and monorepo fixtures.

```bash
npm run benchmark
repo-context benchmark benchmarks --top-k 8
repo-context benchmark benchmarks --json
```

Reported metrics include `Recall@K`, `Precision@K`, token compression ratio, test recommendation accuracy, `agentSuccessDelta`, and `agentSuccessDeltaProxy`. `agentSuccessDelta` reads manual or automated Agent run records from `benchmarks/agent-runs/*.json` and compares the score gap across `no-context`, `agents-md`, `task-pack`, and `task-pack-contracts-verify`. The repository ships with `manual-eval` samples now; later runs can come from Codex or Claude Code. `agentSuccessDeltaProxy` remains the deterministic fallback when no agent-run records are available.

## Context Retrieval Protocol

RAG is modeled as a retrieval protocol, not just an export format. The core interface is:

```ts
interface ContextRetriever {
  search(
    task: string,
    options: {
      topK: number;
      modules?: string[];
      changedFiles?: string[];
      includeTests?: boolean;
    }
  ): Promise<ContextHit[]>;
}
```

Built-in providers:

- `static`: searches generated summaries, module/file metadata, symbols, evidence, and RAG documents.
- `ripgrep`: searches source text through `rg` when available.
- `hybrid`: merges static and ripgrep hits.
- `lightrag`: protocol placeholder for a LightRAG service adapter.
- `embedding`: protocol placeholder for embedding/vector-store adapters.

```bash
repo-context retrieve "fix login timeout" . --provider hybrid --top-k 8 --include-tests
repo-context rag search "fix login timeout" . --provider static --json
```

This keeps MCP, VS Code, Cursor, Codex CLI, LightRAG, and future embedding stores on the same retrieval contract instead of binding the harness to a single RAG framework.

## MCP Server

Repo-to-Agent-Context ships a stdio MCP server for Claude Code, Cursor, LibreChat, OpenHands, and custom agents:

```bash
repo-context-mcp
# or during development
npm run mcp
```

Exposed tools:

- `repo_context_build`
- `repo_context_plan`
- `repo_context_pack`
- `repo_context_retrieve`
- `repo_context_tests`
- `repo_context_impact`
- `repo_context_verify`
- `repo_context_explain`

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

agents:
  mode: minimal # minimal | balanced | full
  maxTokens: 1200
  manualSources:
    - AGENTS.manual.md
  include:
    - commands
    - safety
    - entrypoints
    - contextLinks
```

`agents.manualSources` controls which hand-maintained files are composed ahead of generated agent guidance. Edit those files directly; do not hand-edit the final `AGENTS.md`.

Create `repo-context.config.yml`:

```yaml
target: codex
tokenBudget: 60000

tokenizer:
  mode: chars_approx
  # mode: cl100k_base
  # model: gpt-4.1

agents:
  mode: minimal # minimal | balanced | full
  maxTokens: 1200
  include:
    - commands
    - safety
    - entrypoints
    - contextLinks

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

`agents` controls the density of the root `AGENTS.md`. The default `minimal` mode keeps it to operating constraints; use `balanced` or `full` only when you want more overview content in the root file. The `outputs` switches control optional generated artifacts. Disabling a switch also removes previously generated artifacts in that optional group. Repository summary, key files, onboarding, token savings, and machine-readable indexes are always generated.

## Development

```bash
npm run build
npm run check
npm run lint
npm run format
npm run format:check
npm test
npm run benchmark
npm run build
npm run pack:dry-run
```
