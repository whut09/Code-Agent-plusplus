# Code Agent++

[中文](README.md) | English

**Code Agent++: an external enhancement and reliability engineering layer for coding agents.**

Code Agent++ is not another code-generation agent, and it does not replace Codex, OpenCode, Claude Code, Cursor, or MiMoCode. It is a **Code Agent Enhancement Layer / Agent Reliability Layer**: an attachable set of engineering controls that gives coding agents better context, boundaries, verification, regression protection, hallucination suppression, impact analysis, and repair/finalize loops.

Coding agents are already good at reading code, editing code, and running commands. In complex repositories, they still hit repeatable engineering failure modes:

- Missing accurate context and guessing the right files or modules.
- Expanding the edit scope and touching unrelated files or protected paths.
- Inventing APIs, config keys, commands, or project conventions that do not exist.
- Claiming tests passed with weak or stale evidence.
- Making changes whose downstream impact is invisible during review.
- Reintroducing bugs that were already fixed.
- Getting stuck in repair loops without a clear stop condition.
- Loading `AGENTS.md`, `CLAUDE.md`, Cursor rules, or other instruction files that are too large, stale, or conflicting.

The goal is not to make agents “generate more code.” The goal is to make each change **bounded, evidenced, verifiable, and less regression-prone**.

```txt
Code Agent writes code
Code Agent++ constrains, verifies, records, repairs, and prevents regressions
```

Core loop:

```txt
Context -> Agent -> Execution -> Trace -> Evaluation -> Context Update -> Loop
```

The current implementation supports two paths. In agent-led mode, it is a Context / Policy / Trace reporting system plus an explicit runtime state machine. In Code Agent++-led mode, `orchestrate` invokes a replaceable executor, runs bounded `pack -> execute -> evaluate -> repair/repack/finalize` loops through `--max-loops`, and writes every iteration under `.agent-context/runs/<task-id>/iterations/`. It still does not replace the external coding agent, but it can own acceptance gates and the next-loop decision.

<p align="center">
  <img src="./assets/context-pack-demo.svg" width="900" alt="Code Agent++ final output animation">
</p>

## Use It Through an AI Agent

The primary users of this project are AI coding tools. You can ask Codex, Claude Code, Cursor, OpenCode, MiMoCode, or another agent:

```txt
Use https://github.com/whut09/Code-Agent-plusplus to generate a Code Agent++ context and reliability enhancement pack for the xxx project.
Inspect the target repository first, then install or clone the tool if needed.
Force LLM summaries: create or update code-agent-plusplus.local.yml in the target repo, do not commit that file, and prefer the model API configuration available in the current AI tool environment or the key/baseUrl/model I provide; if configuration is missing, ask me first.
Then run code-agent-plusplus build <target-repo> --target codex --llm, run code-agent-plusplus validate <target-repo>, and summarize the generated files, available Guard capabilities, and whether LLM summary mode succeeded.
```

Replace `xxx project` with a local path, GitHub repository, or workspace name. Real keys should only go into `code-agent-plusplus.local.yml`; never commit them.

## Core Idea

Code Agent++ uses a problem-driven plugin-style architecture:

```txt
When a coding agent shows a class of failure
  -> attach the corresponding Guard / Enhancer module
```

Typical mapping:

| Coding agent failure mode               | Code Agent++ module                 |
| --------------------------------------- | ----------------------------------- |
| Wrong or missing context                | Context Guard                       |
| Hallucinated API / command / convention | Hallucination Guard                 |
| Unbounded edit scope                    | Boundary Guard                      |
| Reintroduced historical bug             | Regression Guard                    |
| Untrustworthy test evidence             | Evidence Guard                      |
| Invisible blast radius                  | Impact Guard                        |
| Repair loop cannot converge             | Loop Guard                          |
| Inconsistent agent event formats        | Executor Adapter + Trace Normalizer |

`AGENTS.md` is only one output of Context Guard. The larger goal is to become the external reliability layer for Codex, OpenCode, Claude Code, Cursor, and MiMoCode.

## Technical Direction

Code Agent++ is organized into three phases: pre-execution enhancement, in-execution constraints, and post-execution verification.

### 1. Before Execution: Make Agents Guess Less

Before the coding agent edits code, Code Agent++ analyzes the repository and generates task-level context plus engineering boundaries.

Capabilities:

- Repository structure analysis.
- Module relationship analysis.
- Task-relevant file retrieval.
- Task-aware context packs.
- `AGENTS.md` / `CLAUDE.md` / Cursor rules / OpenCode instructions export.
- Edit boundary generation.
- Protected path detection.
- Fix-history, known-issue, and anti-regression notes injection.
- Recommended tests and verification commands.

This layer answers: where should the agent look, what must it avoid, what old failures matter, and how should the change be verified?

### 2. During Execution: Give Agents Boundaries

Code Agent++ does not replace the coding agent. It attaches through Executor Adapters:

- OpenCode Executor
- Codex CLI Executor
- Claude Code Executor
- Cursor Executor
- MiMoCode Executor
- Mock Executor

Typical flow:

```txt
Code Agent++ plan
  -> Code Agent++ pack
  -> call OpenCode / Codex / Claude Code / Cursor / MiMoCode to edit
  -> collect diff, commands, logs, event stream
  -> verify and decide
```

Key principle: **the coding agent may edit code, but it cannot self-certify completion.** Completion is judged by Code Agent++ using evidence, diffs, tests, and policy gates.

### 3. After Execution: Make Changes Verifiable and Less Regression-Prone

After the agent edits code, Code Agent++ enters verification and decision mode.

Capabilities:

- Changed-file analysis.
- Allowed / denied edit boundary checks.
- Protected path checks.
- Dependency impact and blast-radius analysis.
- Test recommendation and command execution evidence.
- Command trace recording.
- Exit-code, timestamp, and working-tree-hash validation.
- Verification-after-last-edit checks.
- Regression risk checks.
- Historical bug / known issue comparison.
- Repair / repack / rerun tests / finalize decisions.

This layer answers: did the agent actually finish, is the test evidence trustworthy, did it touch forbidden files, did it reintroduce a known bug, what downstream modules are affected, and should the loop continue or stop for review?

## Guard Modules

### Context Guard

Builds task-level context: `AGENTS.md`, `CLAUDE.md`, Cursor rules, OpenCode instructions, task packs, module maps, relevant files, and validation hints. It reduces lost context, irrelevant search, and token waste.

### Hallucination Guard

Checks whether the agent referenced files, APIs, functions, config keys, CLI commands, test commands, project conventions, packages, or environment variables that are not backed by repository evidence.

### Boundary Guard

Constrains the edit surface with allowed paths, denied paths, protected paths, generated files, lockfiles, migration files, and CI/deploy/infra configuration boundaries.

### Regression Guard

Tracks fix history, known issues, previous bug patterns, regression notes, anti-regression tests, fragile modules, and historical failure cases so agents do not reintroduce already-fixed problems.

### Evidence Guard

Validates test evidence beyond natural-language claims: commands executed, exit code, output presence, timestamps, working-tree hash, and whether tests happened after the last edit.

### Impact Guard

Analyzes changed files, affected modules, downstream dependencies, tests to run, review risk, unexpected file changes, and scope expansion.

### Loop Guard

Controls repair/finalize decisions: finalize, rerun tests, repair code, repair tests, repack context, block, rollback, or require human review.

See [Guard Modules](docs/guard-modules.md) for implementation details.

## 30-Second Start

```bash
npx code-agent-plusplus build .
code-agent-plusplus plan "fix login timeout bug" .
code-agent-plusplus pack "fix login timeout bug" .
```

`code-agent-plusplus` is the only recommended CLI command; the MCP server command is `code-agent-plusplus-mcp`.

From source:

```bash
npm install
npm run build
node dist/cli/index.js build .
```

Common loop:

```bash
code-agent-plusplus run "fix login timeout bug" . --type bugfix
code-agent-plusplus orchestrate "fix login timeout bug" . --executor mock --max-loops 3 --checkpoint git-worktree --fail-on required
code-agent-plusplus agent run "fix login timeout bug" . --executor opencode --executor-command "opencode run --format json {prompt}"
code-agent-plusplus trace run fix-login-timeout-bug . --action run-test --command "npm test -- auth"
code-agent-plusplus policy . --base main --trace fix-login-timeout-bug --fail-on required
code-agent-plusplus impact . --base main
code-agent-plusplus verify --diff .
code-agent-plusplus freshness .
code-agent-plusplus drift .
```

`--executor-command` and `trace run --command` are parsed as argv-style commands and executed without a shell. Quoted paths with spaces or non-ASCII characters are preserved; shell control operators such as `&&`, `|`, `>`, `<`, `;`, and backticks are rejected. Put complex shell logic in a checked-in script and invoke that script directly.

## Current Status

| Capability                                           | Status                 |
| ---------------------------------------------------- | ---------------------- |
| `build` / `AGENTS.md` / `.agent-context`             | implemented            |
| task plan / pack / run                               | implemented            |
| TypeScript Compiler API analyzer                     | implemented            |
| Python AST / optional Tree-sitter analyzer           | implemented            |
| token savings estimated + actual output tokens       | implemented            |
| readiness dimensions and hard caps                   | implemented            |
| Context / Boundary / Evidence / Impact / Loop Guards | implemented foundation |
| Hallucination Guard MVP                              | implemented foundation |
| Regression Guard MVP                                 | implemented foundation |
| multi-loop harness orchestrator / `orchestrate`      | implemented            |
| `agent run` executor wrapper                         | implemented            |
| mock executor                                        | implemented            |
| generic executor command adapter                     | implemented            |
| native OpenCode event normalizer                     | implemented foundation |
| native MiMoCode event normalizer                     | planned                |
| runtime state machine / `state.json`                 | implemented            |
| policy engine                                        | implemented            |
| context delta analysis                               | implemented            |
| tests / impact / verify                              | implemented            |
| freshness / drift / manifest                         | implemented            |
| MCP server scaffold                                  | implemented            |
| Agent Native Runtime loop tools                      | experimental           |
| benchmark harness                                    | experimental           |
| direct LightRAG server sync                          | planned                |

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
  hallucination/
  regression/
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
code-agent-plusplus build [repo]
code-agent-plusplus plan "<task>" [repo]
code-agent-plusplus pack "<task>" [repo]
code-agent-plusplus run "<task>" [repo]
code-agent-plusplus orchestrate "<task>" [repo] --executor mock --max-loops 3 --checkpoint git-worktree --fail-on required
code-agent-plusplus agent run "<task>" [repo] --executor opencode --executor-command "opencode run --format json {prompt}"
code-agent-plusplus orchestrate "<task>" [repo] --executor opencode --executor-command "opencode run --format json {prompt}" --opencode-transcript .opencode/session.jsonl
code-agent-plusplus trace start "<task>" [repo] --agent codex
code-agent-plusplus trace run <trace-id> [repo] --action run-test --command "npm test -- auth"
code-agent-plusplus hallucination [repo] --trace <trace-id> --base main
code-agent-plusplus regression [repo] --trace <trace-id> --base main
code-agent-plusplus policy [repo] --base main --trace <trace-id> --fail-on required
code-agent-plusplus tests [repo] --diff --base main
code-agent-plusplus impact [repo] --base main
code-agent-plusplus verify --diff [repo]
code-agent-plusplus delta [repo] --base main
code-agent-plusplus evolve [repo] --base main
code-agent-plusplus loop "<task>" [repo] --phase after-edit
code-agent-plusplus validate [repo]
code-agent-plusplus validate-contracts [repo]
code-agent-plusplus freshness [repo]
code-agent-plusplus drift [repo]
code-agent-plusplus benchmark [benchmarkDir] --top-k 8
code-agent-plusplus retrieve "<task>" [repo] --provider hybrid
code-agent-plusplus-mcp
```

`policy --fail-on` supports three CI thresholds:

- `forbidden`: fail only forbidden edits; useful for local exploration.
- `required`: fail forbidden edits plus missing required actions; this is the default and works well for PR checks.
- `risk`: fail forbidden, required, and risk warnings; useful for main-branch or release gates.

## Code Agent Integration

Code Agent++ is an External Agent Harness Control Plane for code agents. Codex, Claude Code, Cursor, OpenCode, and MiMoCode remain responsible for reading code, editing code, and running commands; Code Agent++ provides task context, edit boundaries, execution evidence, and the verification loop.

```txt
Codex / Claude Code / Cursor / OpenCode / MiMoCode
  -> read code, edit code, run commands, call tools

Code Agent++
  -> context, boundaries, traces, policies, impact, tests, verify, repair/finalize decisions
```

The project supports two operating modes:

- Code agent-led, Code Agent++ constrained: the agent calls CLI / MCP tools, but the host agent still decides whether to obey gates.
- Code Agent++-led, code agent as executor: Code Agent++ owns plan / pack / execute / collect evidence / policy / verify / decision; the external agent is a replaceable coding executor.

For the detailed entry-point isolation guide, see [docs/integration-modes.md](docs/integration-modes.md).

## MCP / Agent Native Runtime

`code-agent-plusplus-mcp` currently provides a stdio MCP server and tool definitions. It can be wired into MCP-capable clients or custom agents; Codex CLI, Claude Code, Cursor, OpenCode, MiMoCode, LibreChat, and OpenHands integrations still need per-client end-to-end validation.

```txt
code_agent_plusplus_start_loop
code_agent_plusplus_step
code_agent_plusplus_evaluate
code_agent_plusplus_repair
code_agent_plusplus_finalize
```

The experimental runtime loop tools are: `start_loop` writes the task run and trace, `step` records edits/tests/verification, `evaluate` combines delta, loop, policy, and verify signals, `repair` returns repair actions, and `finalize` closes the run after test and contract evidence exists.

`--executor-command` and `trace run --command` are parsed as argv-style commands and executed without a shell. Quoted paths with spaces or non-ASCII characters are preserved; shell control operators such as `&&`, `|`, `>`, `<`, `;`, and backticks are rejected. Put complex shell logic in a checked-in script and invoke that script directly.

## LLM Summary Configuration

The CLI works offline by default. For LLM summaries, create a local `code-agent-plusplus.local.yml`:

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
code-agent-plusplus build . --llm
```

## Docs

- [Architecture](docs/architecture.md)
- [Guard Modules](docs/guard-modules.md)
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
