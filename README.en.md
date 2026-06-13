# Repo-to-Agent-Context

[中文](README.md) | English

Turn any repository into a context package that coding agents can actually use.

Repo-to-Agent-Context is not just a repo summarizer. It is an Agent Context Harness: for a concrete task, it generates minimal context, edit boundaries, test recommendations, impact analysis, and verification entrypoints so Codex, Claude Code, and Cursor read less noise, touch fewer unrelated files, and know how to validate their changes.

<p align="center">
  <img src="./assets/context-pack-demo.svg" width="900" alt="Repo-to-Agent-Context final output animation">
</p>

## Use It Through an AI Agent

The primary users of this project are AI coding tools. You can ask Codex, Claude Code, Cursor, or another agent:

```txt
Use https://github.com/whut09/Repo-to-Agent-Context to generate AGENTS.md and a .agent-context package for the xxx project.
Inspect the target repository first, then install or clone the tool if needed.
Force LLM summaries: create or update repo-context.local.yml in the target repo, do not commit that file, and prefer the model API configuration available in the current AI tool environment or the key/baseUrl/model I provide; if configuration is missing, ask me first.
Then run repo-context build <target-repo> --target codex --llm, run repo-context validate <target-repo>, and summarize the generated files plus whether LLM summary mode succeeded.
```

Replace `xxx project` with a local path, GitHub repository, or workspace name. Real keys should only go into `repo-context.local.yml`; never commit them.

## What Problem Does It Solve?

AI coding tools usually do not fail because they cannot write code. They fail because they did not get the right context:

- Lost context: missing entrypoints, module boundaries, test commands, and architecture constraints.
- Noisy context: entire repositories are shoved into the prompt, wasting tokens.
- Unsafe edits: no clear generated, lockfile, migration, or env boundaries.
- Weak verification: agents do not know which tests, typechecks, lint commands, or impact checks to run.

Repo-to-Agent-Context turns repository memory for agents into generated, updatable, verifiable engineering artifacts.

## 30-Second Start

```bash
npx repo-to-agent-context build .
repo-context plan "fix login timeout bug" .
repo-context pack "fix login timeout bug" .
```

From source:

```bash
npm install
npm run build
node dist/cli/index.js build .
```

Common task loop:

```bash
repo-context run "fix login timeout bug" . --type bugfix
repo-context loop "fix login timeout bug" . --phase after-edit
repo-context trace add fix-login-timeout-bug . --action edit --files src/auth/session.ts --reason "timeout logic"
repo-context policy . --base main --trace fix-login-timeout-bug
repo-context tests . --diff --base main
repo-context impact . --base main
repo-context verify --diff .
repo-context freshness .
repo-context drift .
```

## Why Not Just a Repo Summarizer or RAG Loader?

- ✅ task-aware context: retrieval, graph expansion, and budget packing for a specific task.
- ✅ evidence-linked index: analyzer, confidence, symbols, imports, and line-oriented evidence.
- ✅ contracts: architecture, module-boundary, command, test, and safety constraints with `validate-contracts`.
- ✅ tests recommendation: focused and regression tests from files or diffs.
- ✅ diff / impact / verify: post-edit impact analysis and validation reports.
- ✅ loop controller: decides whether the next step is rebuild context, add tests, repair contracts, expand context, or enter review from freshness, diff, contracts, tests, and impact signals.
- ✅ execution trace: structured records of agent edits, test runs, verification steps, and final state.
- ✅ policy engine: runtime guardrails over diffs, contracts, freshness, and traces; blocks forbidden edits, flags risks, and requires test/validation evidence.
- 🧪 benchmark: fixture benchmark plus manual agent-run samples for context quality.
- 🧪 hybrid retrieve: shared static / ripgrep retrieval protocol for RAG, MCP, and editor integrations.
- 🚧 real agent benchmark: planned Codex / Claude Code run data.

## Current Status

| Capability                                     | Status          |
| ---------------------------------------------- | --------------- |
| `build` / `AGENTS.md` / `.agent-context`       | ✅ implemented  |
| minimal `AGENTS.md` + manual/generated layers  | ✅ implemented  |
| TypeScript Compiler API analyzer               | ✅ implemented  |
| Python AST / optional Tree-sitter analyzer     | ✅ implemented  |
| token savings estimated + actual output tokens | ✅ implemented  |
| readiness dimensions and hard caps             | ✅ implemented  |
| task plan / pack / run                         | ✅ implemented  |
| loop controller                                | ✅ implemented  |
| execution trace                                | ✅ implemented  |
| policy engine                                  | ✅ implemented  |
| tests / impact / verify                        | ✅ implemented  |
| freshness / drift / manifest                   | ✅ implemented  |
| contracts validation                           | ✅ implemented  |
| benchmark harness                              | 🧪 experimental |
| hybrid retrieve / RAG export                   | 🧪 experimental |
| MCP server                                     | 🧪 experimental |
| direct LightRAG server sync                    | 🚧 planned      |
| VS Code / Cursor extension                     | 🚧 planned      |

## Outputs

```txt
AGENTS.md
AGENTS.manual.md
.agent-context/
  AGENTS.generated.md
  manifest.json
  repo-summary.md
  key-files.md
  module-map.md
  dependency-graph.md
  readiness.md
  token-savings.md
  contracts/
  tasks/
  runs/
  loops/
  traces/
  rag/
  evidence/
  index/
  graphs/
```

The root `AGENTS.md` stays intentionally short by default: mandatory operating rules plus links into deeper context. Larger module maps, dependency graphs, readiness reports, token reports, evidence indexes, and task packs live under `.agent-context/`.

## Does the Agent Read AGENTS.md Automatically?

It depends on the coding agent client, not the model itself.

- Codex: reads `AGENTS.md`.
- Claude Code: reads `CLAUDE.md`; create a root `CLAUDE.md` with `@AGENTS.md` to reuse this guide.
- Cursor: can use root `AGENTS.md` for project rules; use `.cursor/rules` for scoped or conditional rules.
- Other tools: support varies; attach or reference `AGENTS.md` manually if needed.

See [docs/agents-md.md](docs/agents-md.md) for details.

## Core Commands

```bash
repo-context build [repo]
repo-context plan "<task>" [repo]
repo-context pack "<task>" [repo]
repo-context run "<task>" [repo]
repo-context loop "<task>" [repo] --phase after-edit
repo-context trace start "<task>" [repo] --agent codex
repo-context trace add <trace-id> [repo] --action edit --files src/auth/session.ts
repo-context policy [repo] --base main --trace <trace-id>
repo-context tests [repo] --diff --base main
repo-context impact [repo] --base main
repo-context verify --diff [repo]
repo-context validate [repo]
repo-context validate-contracts [repo]
repo-context freshness [repo]
repo-context drift [repo]
repo-context benchmark [benchmarkDir] --top-k 8
repo-context retrieve "<task>" [repo] --provider hybrid
repo-context-mcp
```

## LLM Summary Configuration

The CLI works offline by default. For LLM summaries, create a local `repo-context.local.yml`:

```yaml
llm:
  enabled: true
  provider: openai-compatible
  baseUrl: xx
  apiKey: xx
  model: xx
```

Committed config should keep only `xx` placeholders. Real keys, URLs, and model names belong in local files only.

```bash
repo-context build . --llm
```

## Docs

- [Architecture](docs/architecture.md)
- [AGENTS.md usage](docs/agents-md.md)
- [Roadmap](docs/roadmap.md)
- [Benchmark](benchmarks/README.md)

## Development

```bash
npm run check
npm run lint
npm run format:check
npm test
npm run benchmark
npm run build
npm run pack:dry-run
```
