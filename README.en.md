# Code Agent++

[中文](README.md) | English

**An external enhancement and reliability engineering layer for coding agents.**

Code Agent++ is not another code-generation agent and does not replace Codex, OpenCode, Claude Code, Cursor, or MiMoCode. It is a bounded harness-led control loop: it compiles repositories into task-aware context, generates edit boundaries, records execution evidence, runs policy / contracts / tests / impact / verify checks, and returns `finalize / repair / repack / block / require-human-review` decision reports.

```txt
Coding agents read code, edit code, and run commands.
Code Agent++ provides context, boundaries, evidence, gates, impact analysis, and decision reports.
```

## 30-Second Start

```bash
npm i -g code-agent-plusplus opencode-ai
cd your-repo
capp
```

Then chat like you normally would in OpenCode:

```txt
Fix the login timeout bug.
Add tests for this module.
Refactor this function while preserving behavior.
```

Code Agent++ runs quietly around the chat loop:

- initializes and refreshes repository context
- checks edit boundaries
- blocks dangerous or hallucinated commands
- blocks protected / secret paths before execution
- records sidecar events and verification evidence
- incrementally verifies the current diff on idle
- runs the shared contracts / hallucination / regression / impact / tests / policy guard stack
- reports impact and regression risk
- writes the latest verification report

It stays quiet by default and only interrupts the TUI when blockers are found.

## Daily Commands

```bash
capp          # OpenCode chat mode with the Code Agent++ sidecar
capp report   # show the latest sidecar check
capp status   # show whether the sidecar is active
capp doctor   # diagnose OpenCode / auth / git / context / plugin
capp --pure   # plain OpenCode without Code Agent++
```

`capp` runs preflight, ensures `.agent-context`, writes `.opencode/plugins/code-agent-plusplus.ts`, prepares OpenCode commands/agent files, then opens the OpenCode TUI for the current repository.

## Advanced: Batch Harness Mode

Use batch mode when Code Agent++ should run an external executor, collect diff / trace / policy / verify artifacts, and emit a decision report:

```bash
capp oc init .
capp oc "fix login timeout bug" .
capp oc report --last
capp oc repair
```

Use the full orchestrator when you need a custom executor command:

```bash
npx code-agent-plusplus orchestrate "fix login timeout bug" . \
  --executor opencode \
  --executor-command "opencode run --format json --dir {repo} --file {prompt} \"Follow the attached Code Agent++ task prompt.\"" \
  --max-loops 3 \
  --checkpoint git-worktree \
  --fail-on required
```

Manual verification commands remain available for advanced users:

```bash
npx code-agent-plusplus build .
npx code-agent-plusplus verify --diff .
npx code-agent-plusplus policy . --base main --fail-on required
npx code-agent-plusplus impact . --base main
```

Outputs are written to:

```txt
AGENTS.md
.agent-context/
  repo-summary.md
  key-files.md
  contracts/
  runs/<task-id>/
  traces/
  sidecar/
  hallucination/
  regression/
  graphs/
  index/
```

## Relationship To Related Projects

| Project                       | Main role                                    | Relationship to Code Agent++                                                     |
| ----------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------- |
| Codex / Claude Code / Cursor  | Read, edit, and run code                     | Executors; Code Agent++ adds external validation and constraints                 |
| OpenCode / MiMoCode           | Open-source coding agent runtime / assistant | Priority executor targets; Code Agent++ adds harness gates                       |
| CodeGraph                     | Code graph, symbols, call graph, MCP         | Optional deep code-intelligence backend                                          |
| OpenHarness / Oh My OpenAgent | General agent harness / workflow             | Same broad harness space; Code Agent++ focuses on coding-agent reliability loops |

## What It Solves

- Agents guess entry files and modules because repository context is incomplete.
- Agents over-edit generated files, lockfiles, CI, migrations, or unrelated modules.
- Agents hallucinate APIs, commands, config keys, environment variables, or project conventions.
- Agents claim tests passed without reliable exit-code, timestamp, or working-tree-hash evidence.
- Agents make changes whose downstream impact is invisible during review.
- Agents reintroduce historical bugs or keep repairing without a clear stop condition.

## Use It Through An AI Agent

You can tell Codex / Claude Code / Cursor / OpenCode / MiMoCode:

```txt
Use https://github.com/whut09/Code-Agent-plusplus to generate a Code Agent++ context and reliability package for xxx project.
Inspect the target repository first, then install or clone the tool if needed.
Force LLM summaries: create or update code-agent-plusplus.local.yml in the target repo, do not commit that file.
Prefer model API configuration available in the current AI tool environment, or the key/baseUrl/model I provide; ask me first if configuration is missing.
Then run code-agent-plusplus build <target-repo> --target codex --llm, run code-agent-plusplus validate <target-repo>, and summarize generated files, available Guard capabilities, and whether LLM summary mode succeeded.
```

Real credentials belong only in `code-agent-plusplus.local.yml`.

## Current Maturity

| Capability                                           | Maturity            |
| ---------------------------------------------------- | ------------------- |
| `build` / `AGENTS.md` / `.agent-context`             | Stable              |
| task plan / pack / run                               | Stable              |
| TypeScript Compiler API analyzer                     | Stable              |
| Python AST / optional Tree-sitter analyzer           | Foundation          |
| token savings estimated + actual output tokens       | Stable              |
| Context / Boundary / Evidence / Impact / Loop Guards | Foundation          |
| Hallucination Guard                                  | MVP                 |
| Regression Guard / memory candidates                 | MVP / Foundation    |
| bounded harness-led orchestrator / `orchestrate`     | Foundation          |
| mock executor / generic `--executor-command`         | Stable / Foundation |
| `capp` OpenCode TUI launcher + sidecar plugin        | Foundation          |
| `capp sidecar verify`                                | Foundation          |
| OpenCode preset / `opencode run` / `oc`              | Foundation          |
| OpenCode project init / `.opencode` commands         | Foundation          |
| OpenCode doctor                                      | Foundation          |
| compact OpenCode run summary / `oc report` / repair  | Foundation          |
| OpenCode event normalizer                            | Foundation          |
| MiMoCode / Codex / Claude native normalizers         | Planned             |
| MCP stdio server + core tools                        | Foundation          |
| MCP Agent Native Runtime tools                       | Experimental        |
| RAG export / retriever provider interface            | Foundation          |
| direct LightRAG server sync                          | Planned             |

See the [documentation home](docs/README.md) for full maturity notes.

## Documentation

- [Getting Started](docs/getting-started.md)
- [Positioning](docs/concepts/positioning.md)
- [Architecture](docs/concepts/architecture.md)
- [Guard Modules](docs/concepts/guard-modules.md)
- [Agent-led vs Harness-led](docs/concepts/integration-modes.md)
- [Loop Engineering Code Path](docs/concepts/loop-engineering.md)
- [CLI Reference](docs/reference/cli-reference.md)
- [Artifacts Reference](docs/reference/artifacts.md)
- [Executor Adapters](docs/reference/executor-adapters.md)
- [Benchmark Guide](docs/developer/benchmark-guide.md)
- [Roadmap](docs/roadmap.md)

## Development

```bash
npm install
npm run build
npm run check
npm test
```

## Acknowledgements

Code Agent++ is inspired by [OpenAI Codex](https://github.com/openai/codex), [OpenCode](https://github.com/anomalyco/opencode), [MiMo-Code](https://github.com/XiaomiMiMo/MiMo-Code), [CodeGraph](https://github.com/colbymchenry/codegraph), [Oh My OpenAgent](https://github.com/code-yeongyu/oh-my-openagent), [OpenHarness](https://github.com/HKUDS/OpenHarness), and [OpenClaw](https://github.com/openclaw/openclaw).
