# Code Agent++

[中文](README.md) | English

**An external enhancement and reliability engineering layer for coding agents.**

Code Agent++ is not another code-generation agent and does not replace Codex, OpenCode, Claude Code, Cursor, or MiMoCode. It is a bounded harness-led control loop: it compiles repositories into task-aware context, generates edit boundaries, records execution evidence, runs policy / contracts / tests / impact / verify checks, and returns `finalize / repair / repack / block / require-human-review` decision reports.

```txt
Coding agents read code, edit code, and run commands.
Code Agent++ provides context, boundaries, evidence, gates, impact analysis, and decision reports.
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

## 30-Second Start

```bash
npx code-agent-plusplus build .
npx code-agent-plusplus run "fix login timeout bug" .
npx code-agent-plusplus verify --diff .
```

Harness-led executor flow:

```bash
npx code-agent-plusplus opencode doctor .
npx code-agent-plusplus opencode run "fix login timeout bug" .
# short alias:
npx code-agent-plusplus oc "fix login timeout bug" .
```

The OpenCode preset internally uses:

```bash
opencode run --format json --dir {repo} --file {prompt} "Follow the attached Code Agent++ task prompt."
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
  hallucination/
  regression/
  graphs/
  index/
```

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
| OpenCode preset / `opencode run` / `oc`              | Foundation          |
| OpenCode doctor                                      | Foundation          |
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
