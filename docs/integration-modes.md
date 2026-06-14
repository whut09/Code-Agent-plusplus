# Integration Modes and Entry Isolation

Code Agent++ supports two separate flows. The difference is not whether AI is used; the difference is who owns control.

## Summary

| Mode                                     | Controller                                         | Entry Points                                                                                                 | Executes a code agent?                      | Best For                                                                           |
| ---------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------- | ---------------------------------------------------------------------------------- |
| Code agent-led, Code Agent++ constrained | Codex / Claude Code / Cursor / OpenCode / MiMoCode | CLI `plan` / `pack` / `run` / `tests` / `impact` / `verify` / `policy`, or MCP `code_agent_plusplus_*` tools | No, the external code agent executes itself | Daily AI coding, MCP demos, existing agents calling tools                          |
| Code Agent++-led, code agent as executor | Code Agent++                                       | `code-agent-plusplus orchestrate` or `code-agent-plusplus agent run`                                         | Yes, through `mock` or `--executor-command` | Auditable gates, CI/automation, Code Agent++ deciding finalize/repair/repack/block |

The entry points are isolated:

- `code-agent-plusplus run` only writes `.agent-context/runs/<task-id>/`; it does not execute an external agent.
- `code-agent-plusplus orchestrate` and `code-agent-plusplus agent run` are the executor flows.
- MCP tools belong to the agent-led mode by default. They give an external agent plan/pack/retrieve/tests/impact/verify/evaluate/repair/finalize capabilities, but the host agent still decides whether to obey the gate.

## Mode 1: Code Agent-Led, Code Agent++ Constrained

In this mode, Codex / Claude Code / Cursor / OpenCode / MiMoCode is the main actor. Code Agent++ provides context, boundaries, and verification tools, but it does not own final execution.

```txt
User task
  -> code agent calls code-agent-plusplus plan / pack / run or MCP code_agent_plusplus_plan / pack
  -> code agent reads code, edits code, runs commands
  -> code agent calls tests / impact / verify / policy / evaluate
  -> Code Agent++ returns constraints, evidence, and recommendations
```

Recommended CLI entries:

```bash
code-agent-plusplus plan "fix login timeout bug" .
code-agent-plusplus pack "fix login timeout bug" .
code-agent-plusplus run "fix login timeout bug" . --type bugfix
code-agent-plusplus tests . --diff --base main
code-agent-plusplus impact . --base main
code-agent-plusplus verify --diff .
code-agent-plusplus policy . --base main --trace <trace-id> --fail-on required
```

MCP entries:

```txt
code_agent_plusplus_plan
code_agent_plusplus_pack
code_agent_plusplus_retrieve
code_agent_plusplus_tests
code_agent_plusplus_impact
code_agent_plusplus_verify
code_agent_plusplus_evaluate
code_agent_plusplus_repair
code_agent_plusplus_finalize
```

Artifacts:

- `.agent-context/tasks/<task-id>/`
- `.agent-context/runs/<task-id>/`
- `.agent-context/traces/<trace-id>.json`
- `.agent-context/loops/<task-id>/`, when loop/evaluate writes reports

Guarantee boundary:

- This mode guarantees that context, boundaries, test recommendations, impact reports, and policy reports are available.
- It cannot guarantee that the external code agent follows the report, because the external agent owns control.

## Mode 2: Code Agent++-Led, Code Agent As Executor

In this mode, Code Agent++ owns orchestration and acceptance. The code agent is a replaceable executor.

```txt
User task
  -> Code Agent++ plan / pack
  -> choose executor: Codex / Claude Code / Cursor / OpenCode / MiMoCode / mock
  -> executor edits code
  -> Code Agent++ collects diff / trace / test evidence
  -> policy / contracts / tests / impact / verify
  -> decision: finalize / repair / repack / block / require-human-review
```

Recommended CLI entries:

```bash
code-agent-plusplus orchestrate "fix login timeout bug" . --executor mock --fail-on required
code-agent-plusplus orchestrate "fix login timeout bug" . --executor opencode --executor-command "opencode run --format json {prompt}" --fail-on required
code-agent-plusplus agent run "fix login timeout bug" . --executor mimocode --executor-command "mimocode run {prompt}" --fail-on required
```

`--executor-command` supports placeholders:

- `{prompt}`: path to the executor prompt file written by Code Agent++.
- `{task}`: original task text.
- `{repo}`: repository root.
- `{runDir}`: `.agent-context/runs/<task-id>/`.
- `{agent}`: executor-specific agent/profile value.

Artifacts:

- `.agent-context/runs/<task-id>/`
- `.agent-context/traces/<task-id>.json`
- `.agent-context/orchestrator/<task-id>/orchestrator.md`
- `.agent-context/orchestrator/<task-id>/orchestrator.json`
- `.agent-context/orchestrator/<task-id>/policy.md`
- `.agent-context/orchestrator/<task-id>/impact.md`
- `.agent-context/orchestrator/<task-id>/verify.md`
- `.agent-context/orchestrator/<task-id>/loop.md`

Guarantee boundary:

- This mode guarantees that each run collects diff, trace, and executor events.
- It guarantees one gate over policy / contracts / tests / impact / verify.
- It produces an explicit decision: `finalize`, `repair`, `repack`, `block`, or `require-human-review`.
- It cannot guarantee that the external executor edits code correctly; it guarantees auditable acceptance and next-step decisions after execution.

## Which Mode Should I Use?

- Use mode 1 when you want Codex / Claude Code / Cursor / OpenCode / MiMoCode to naturally call the tools.
- Use mode 2 when Code Agent++ should own acceptance and treat the code agent as a coding tool.
- For CI or automation demos, start with mode 2 and `--executor mock`, then wire OpenCode or MiMoCode through `--executor-command`.
