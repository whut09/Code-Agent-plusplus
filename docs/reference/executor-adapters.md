# Executor Adapters

Executor adapters let Code Agent++ treat external code agents as replaceable coding tools.

## Maturity

| Executor / Adapter                | Maturity   | Notes                                                                                |
| --------------------------------- | ---------- | ------------------------------------------------------------------------------------ |
| `mock`                            | Stable     | Deterministic demo and CI executor.                                                  |
| generic `--executor-command`      | Foundation | Calls scriptable CLIs such as OpenCode, Codex, Claude Code, Cursor, and MiMoCode.    |
| OpenCode event normalizer         | Foundation | Supports `opencode run --format json`, transcript files, and stdout/stderr fallback. |
| MiMoCode native normalizer        | Planned    | Native event format support is planned.                                              |
| Codex JSONL normalizer            | Planned    | Current path is the generic command adapter.                                         |
| Claude Code transcript normalizer | Planned    | Current path is the generic command adapter.                                         |
| Cursor native adapter             | Planned    | Current path is docs, MCP, and generic command hooks.                                |

## Generic Command

```bash
code-agent-plusplus orchestrate "<task>" . \
  --executor opencode \
  --executor-command "opencode run --format json {prompt}" \
  --max-loops 3
```

Placeholders:

- `{prompt}`
- `{task}`
- `{repo}`
- `{runDir}`

Executor commands are parsed as argv-style commands and run without a shell.
