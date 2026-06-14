# Repo-to-Agent-Context

[中文](README.md) | English

Repo-to-Agent-Context is an Agent Harness Runtime Control Plane for coding agents.

It does not replace Codex, Claude Code, Cursor, OpenCode, or MiMoCode as the coding agent. It compiles a repository into task-aware context, generates edit boundaries, records execution traces, checks policies and contracts, analyzes diff impact, recommends tests and verification paths, and decides the next loop action from freshness / trace / policy / impact signals.

Core loop:

```txt
Context -> Agent -> Execution -> Trace -> Evaluation -> Context Update -> Loop
```

It is not just a repo summarizer or a context pack tool. Its goal is to give Codex, Claude Code, Cursor, OpenCode, and MiMoCode a static but verifiable engineering control plane: read less noise, touch fewer unrelated files, validate changes, and decide whether the next step is repair, context expansion, policy enforcement, or finalization.

The current implementation is best understood as a Context / Policy / Trace reporting system plus an explicit runtime state machine and semi-automatic loop advisor: it does not autonomously call an agent to edit code, but it does consume trace evidence, policies, contracts, impact, and freshness, update `.agent-context/runs/<task-id>/state.json`, and produce the single highest-priority next action. The target shape is a stateful, autonomous, evidence-driven Agent Harness Runtime.

<p align="center">
  <img src="./assets/context-pack-demo.svg" width="900" alt="Repo-to-Agent-Context final output animation">
</p>

## Use It Through an AI Agent

The primary users of this project are AI coding tools. You can ask Codex, Claude Code, Cursor, OpenCode, MiMoCode, or another agent:

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

Repo-to-Agent-Context turns repository memory for agents into a generated, updatable, verifiable runtime loop.

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
repo-context orchestrate "fix login timeout bug" . --executor mock --fail-on required
repo-context agent run "fix login timeout bug" . --executor opencode --executor-command "opencode run --format json {prompt}"
repo-context delta . --base main
repo-context evolve . --base main
repo-context loop "fix login timeout bug" . --phase after-edit
repo-context trace add fix-login-timeout-bug . --action edit --files src/auth/session.ts --reason "timeout logic"
repo-context trace run fix-login-timeout-bug . --action run-test --command "npm test -- auth"
repo-context policy . --base main --trace fix-login-timeout-bug --fail-on required
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
- ✅ loop controller + runtime state machine: decides whether the next step is rebuild context, add tests, repair contracts, expand context, or enter review from freshness, diff, contracts, tests, impact, and trace evidence; it also writes `.agent-context/runs/<task-id>/state.json` with the current state, allowed actions, blocking next action, satisfied evidence, and missing evidence.
- ✅ execution trace: structured records of agent edits, test runs, verification steps, and final state, with manual / command / CI evidence separated.
- ✅ evidence validation: traces are decision evidence, not just logs; test and contract evidence checks required commands, exit codes, working-tree hashes, and whether verification happened after the last edit to prevent stale evidence pollution.
- ✅ policy engine: runtime guardrails over diffs, contracts, freshness, and traces; blocks forbidden edits, flags risks, and requires test/validation evidence. `trace run` captures exit code, output hashes, and working-tree hashes, which is stronger than a manual claim.
- ✅ context delta: derives stale context outputs, affected graph nodes, and files the agent must re-read from git diff; `evolve` is currently a cache-aware full refresh, while selective output writes are planned.
- 🧪 MCP runtime tools: the stdio MCP server exposes build / plan / pack / retrieve / tests / impact / verify plus start_loop / step / evaluate / repair / finalize tools; real client integrations still need per-client validation.
- 🧪 benchmark: Loop Behavior Benchmark comparing no-context, AGENTS.md, context pack, and loop-enabled harness runs across wrong edits, test failures, steps, tokens, and repair loops.
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
| harness orchestrator / `orchestrate`           | ✅ implemented  |
| `agent run` executor wrapper                   | ✅ implemented  |
| mock executor for CI and deterministic tests   | ✅ implemented  |
| generic executor command adapter               | ✅ implemented  |
| native OpenCode / MiMoCode event normalizers   | 🚧 planned      |
| loop controller                                | ✅ implemented  |
| runtime state machine / `state.json`           | ✅ implemented  |
| execution trace                                | ✅ implemented  |
| policy engine                                  | ✅ implemented  |
| context delta analysis                         | ✅ implemented  |
| evolve cache-aware full refresh                | ✅ implemented  |
| evolve selective output writes                 | 🚧 planned      |
| tests / impact / verify                        | ✅ implemented  |
| freshness / drift / manifest                   | ✅ implemented  |
| contracts validation                           | ✅ implemented  |
| MCP server scaffold                            | ✅ implemented  |
| MCP tools: build / plan / pack / retrieve      | ✅ implemented  |
| Agent Native Runtime loop tools                | 🧪 experimental |
| benchmark harness                              | 🧪 experimental |
| hybrid retrieve / RAG export                   | 🧪 experimental |
| Claude / Cursor / Codex real integration       | 🚧 planned      |
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
  delta/
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
repo-context orchestrate "<task>" [repo] --executor mock --fail-on required
repo-context agent run "<task>" [repo] --executor opencode --executor-command "opencode run --format json {prompt}"
repo-context delta [repo] --base main
repo-context evolve [repo] --base main
repo-context loop "<task>" [repo] --phase after-edit
repo-context trace start "<task>" [repo] --agent codex
repo-context trace add <trace-id> [repo] --action edit --files src/auth/session.ts
repo-context trace run <trace-id> [repo] --action run-test --command "npm test -- auth"
repo-context policy [repo] --base main --trace <trace-id> --fail-on required
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

`policy --fail-on` supports three CI thresholds:

- `forbidden`: fail only forbidden edits; useful for local exploration.
- `required`: fail forbidden edits plus missing required actions; this is the default and works well for PR checks.
- `risk`: fail forbidden, required, and risk warnings; equivalent to the legacy `--strict` mode and useful for main-branch or release gates.

## Code Agent Integration

Repo-to-Agent-Context is an External Agent Harness Control Plane for code agents. Codex, Claude Code, Cursor, OpenCode, and MiMoCode remain responsible for reading code, editing code, and running commands; Repo-to-Agent-Context provides task context, edit boundaries, execution evidence, and the verification loop.

```txt
Codex / Claude Code / Cursor / OpenCode / MiMoCode
  -> read code, edit code, run commands, call tools

Repo-to-Agent-Context
  -> context, boundaries, traces, policies, impact, tests, verify, repair/finalize decisions
```

This combines existing code-agent execution with Repo-to-Agent-Context's control plane. OpenCode and MiMoCode are open-source code-agent runtimes, so they are priority executor targets for the next integration phase.

The project supports two operating modes:

For the detailed entry-point isolation guide, see [docs/integration-modes.md](docs/integration-modes.md).

### Mode 1: Code Agent-Led, Repo-to-Agent-Context Constrained

This is the fastest integration path. Codex, Claude Code, Cursor, OpenCode, or MiMoCode remains the main actor and calls Repo-to-Agent-Context through MCP or CLI:

```txt
User task
  -> code agent calls repo_context_plan / pack / retrieve
  -> code agent reads code, edits code, runs commands
  -> code agent calls tests / impact / verify / evaluate
  -> Repo-to-Agent-Context returns policy, contracts, trace, and verify results
```

This mode feels natural and is ideal for OpenCode / MiMoCode MCP demos and daily assisted use. Its limitation is that the code agent still has final control: it may skip tool calls or ignore a gate, so Repo-to-Agent-Context can provide constraints and evidence but cannot fully guarantee the result.

### Mode 2: Repo-to-Agent-Context-Led, Code Agent As Executor

This is the formal Harness Runtime direction. Repo-to-Agent-Context owns orchestration and acceptance; the code agent is a replaceable coding executor:

```txt
User task
  -> Repo-to-Agent-Context plan / pack
  -> choose executor: Codex / Claude Code / Cursor / OpenCode / MiMoCode
  -> code agent executes code changes
  -> Repo-to-Agent-Context collects diff / trace / test evidence
  -> policy / contracts / tests / impact / verify
  -> decision: finalize / repair / repack / block / require human review
```

In this mode, Repo-to-Agent-Context owns the stop/go decision: continue, repair, repack context, block, or require human review. The decision is based on the runtime state machine, trace evidence, policy gates, and verify reports. OpenCode and MiMoCode are priority executors because they are open-source, scriptable, and observable.

Delivery path:

1. MCP integration: let code agents call `repo_context_plan`, `repo_context_pack`, `repo_context_retrieve`, `repo_context_tests`, `repo_context_impact`, `repo_context_verify`, `repo_context_evaluate`, `repo_context_repair`, and `repo_context_finalize`. OpenCode and MiMoCode are the first open-source executor targets to validate.
2. Executor Wrapper: `repo-context agent run "<task>" . --executor opencode|mimocode --executor-command "<command with {prompt}>"` runs `pack -> run agent -> collect diff -> verify`. The deterministic `mock` executor is implemented for CI and tests; real code-agent CLIs are connected through `--executor-command` until native event normalizers are added.
3. Orchestrator Loop: `repo-context orchestrate "<task>" . --executor opencode|mimocode --max-loops 3 --fail-on required --executor-command "<command with {prompt}>"`, where Repo-to-Agent-Context owns `plan -> pack -> execute -> collect evidence -> policy/tests/impact/verify -> decision`.

The key abstraction is `AgentExecutor`: the executor can be OpenCode, MiMoCode, Codex CLI, Claude Code, or another code agent; the harness only needs changed files, event logs, test evidence, diff state, and policy-gate results.

## MCP / Agent Native Runtime

`repo-context-mcp` currently provides a stdio MCP server and tool definitions. It can be wired into MCP-capable clients or custom agents; Codex CLI, Claude Code, Cursor, OpenCode, MiMoCode, LibreChat, and OpenHands integrations still need per-client end-to-end validation.

```txt
repo_context_start_loop
repo_context_step
repo_context_evaluate
repo_context_repair
repo_context_finalize
```

The experimental runtime loop tools are: start_loop writes the task run and trace, step records edits/tests/verification, evaluate combines delta, loop, policy, and verify signals, repair returns the next repair actions, and finalize closes the run after test and contract evidence exists.

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
- [Loop Engineering code path](docs/loop-engineering.md)
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
