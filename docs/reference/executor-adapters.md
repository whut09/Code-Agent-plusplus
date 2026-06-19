# Executor Adapters

Executor adapters let Code Agent++ treat external code agents as replaceable coding tools.

## Maturity

| Executor / Adapter                | Maturity   | Notes                                                                                |
| --------------------------------- | ---------- | ------------------------------------------------------------------------------------ |
| `mock`                            | Stable     | Deterministic demo and CI executor.                                                  |
| `capp` OpenCode TUI launcher      | Foundation | Starts OpenCode TUI after context, command, agent, and sidecar plugin preflight.     |
| OpenCode preset                   | Foundation | `opencode doctor`, `opencode run`, and `oc` with the default OpenCode command.       |
| generic `--executor-command`      | Foundation | Calls scriptable CLIs such as OpenCode, Codex, Claude Code, Cursor, and MiMoCode.    |
| OpenCode event normalizer         | Foundation | Supports `opencode run --format json`, transcript files, and stdout/stderr fallback. |
| MiMoCode native normalizer        | Planned    | Native event format support is planned.                                              |
| Codex JSONL normalizer            | Planned    | Current path is the generic command adapter.                                         |
| Claude Code transcript normalizer | Planned    | Current path is the generic command adapter.                                         |
| Cursor native adapter             | Planned    | Current path is docs, MCP, and generic command hooks.                                |

## Generic Command

OpenCode has a first-class preset:

```bash
capp
capp oc init .
code-agent-plusplus opencode doctor .
code-agent-plusplus opencode run "<task>" .
capp oc "<task>" .
capp oc report --last
capp oc repair
```

The preset expands to:

```bash
opencode run --format json --dir {repo} --file {prompt} "Follow the attached Code Agent++ task prompt."
```

Use the generic adapter for other executors or custom OpenCode commands:

```bash
code-agent-plusplus orchestrate "<task>" . \
  --executor opencode \
  --executor-command "opencode run --format json --dir {repo} --file {prompt} \"Follow the attached Code Agent++ task prompt.\"" \
  --max-loops 3
```

Placeholders:

- `{prompt}`: per-iteration prompt file path
- `{task}`
- `{repo}`
- `{runDir}`

Executor commands are parsed as argv-style commands and run without a shell.
