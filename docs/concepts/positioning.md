# Positioning

Code Agent++ is a **Code Agent Enhancement Layer / Agent Reliability Layer**.

It is not another coding agent. Codex, Claude Code, Cursor, OpenCode, and MiMoCode remain responsible for reading code, editing files, and running commands. Code Agent++ wraps those tools with a bounded harness-led control loop.

```txt
User task
  -> context and boundary preparation
  -> external code-agent executor
  -> diff / trace / test evidence collection
  -> guard evaluation
  -> decision report
```

## What It Owns

- Repository context compilation.
- Task-aware file retrieval and context packing.
- Edit boundaries and protected paths.
- Trace and command evidence recording.
- Policy, contracts, tests, impact, hallucination, and regression gates.
- Repair / repack / finalize / block / human-review decision reports.

## What It Does Not Own

- Model provider login.
- Interactive coding-agent UI.
- General tool-calling runtime.
- Actual source edits unless a configured external executor performs them.
- Automatic merge decisions.

## Two Integration Modes

- Agent-led mode: the external code agent calls Code Agent++ CLI or MCP tools. Gates are advisory unless the host agent follows them.
- Harness-led mode: Code Agent++ invokes a configured executor, collects evidence, evaluates gates, and writes decision reports.

See [Integration Modes](integration-modes.md).
