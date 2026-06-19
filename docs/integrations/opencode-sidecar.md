# OpenCode Transparent Sidecar Mode

OpenCode Transparent Sidecar Mode is the default `ocpp` experience. Users keep working in the normal OpenCode TUI while OpenCode++ runs as a quiet reliability layer around the session.

OpenCode++ does not replace OpenCode. OpenCode reads, edits, and runs tools; OpenCode++ prepares repository context, installs the sidecar plugin, records execution evidence, blocks unsafe commands or paths, and writes verification reports.

## User Experience

`opencode-plusplus` has not been published to npm yet. Install OpenCode from npm, then install OpenCode++ from source and link `ocpp` globally:

```bash
npm i -g opencode-ai
git clone https://github.com/whut09/opencode-plusplus.git
cd opencode-plusplus
npm install
npm run build
npm link
```

Then enter the repository where you want the sidecar:

```bash
cd your-repo
ocpp
```

After the package is published to npm, the install step will become `npm i -g opencode-plusplus opencode-ai`.

`ocpp` runs preflight, prints a compact readiness summary, and then launches OpenCode:

```txt
OpenCode++ sidecar ready
- Context: ready (.agent-context already exists)
- Plugin: ready (.opencode/plugins/opencode-plusplus.ts generated)
- Report: .agent-context/sidecar/latest.md

Launching OpenCode...
```

Then use OpenCode normally:

```txt
Fix the login timeout bug.
Add tests for this module.
Refactor this function while preserving behavior.
```

The sidecar stays quiet by default. It only surfaces a TUI message when a blocker or forbidden gate is detected.

## Workflow

```txt
ocpp
  -> preflight
  -> ensure .agent-context
  -> ensure .opencode plugin / commands / agent profile
  -> launch OpenCode TUI
  -> listen for OpenCode events
  -> record tool evidence
  -> dirty/debounced sidecar verify
  -> write latest report
```

The generated OpenCode plugin listens for:

- `tool.execute.before`: blocks dangerous commands, hallucinated package scripts / Makefile targets, protected paths, and secret paths.
- `tool.execute.after`: records command, exit code, timestamps, stdout/stderr hashes, working-tree hashes, and touched files.
- `file.edited` and `file.watcher.updated`: marks the repository dirty.
- `session.idle`: runs dirty/debounced incremental verification.

## Generated Files

```txt
.opencode/plugins/opencode-plusplus.ts
.opencode/commands/ocpp.md
.opencode/commands/ocpp-verify.md
.opencode/agents/opencode-plusplus.md
.opencode/commands/capp.md
.opencode/commands/capp-verify.md
.opencode/agents/code-agent-plusplus.md
.agent-context/sidecar/latest.json
.agent-context/sidecar/latest.md
.agent-context/sidecar/policy.md
.agent-context/sidecar/task-verify.md
.agent-context/sidecar/hallucination.md
.agent-context/sidecar/regression.md
.agent-context/traces/opencode-sidecar-events.jsonl
.agent-context/traces/opencode-session-<id>.json
```

`.agent-context/traces/opencode-sidecar-events.jsonl` is the low-level event stream. `.agent-context/traces/opencode-session-<id>.json` is the normalized execution trace consumed by Evidence Guard and Policy Engine.

## Common Commands

```bash
ocpp
ocpp --pure
ocpp status
ocpp report
ocpp doctor
ocpp sidecar verify
```

`ocpp --pure` launches plain OpenCode without generating context or injecting the sidecar.

`ocpp status` checks whether the sidecar plugin, event log, and latest report exist.

`ocpp report` opens `.agent-context/sidecar/latest.md`.

`ocpp doctor` checks OpenCode, auth, git, context, plugin, and sidecar readiness.

`ocpp sidecar verify` runs the shared guard stack and writes the latest sidecar report. It is also what the plugin runs automatically on idle when the repository is dirty.

## Difference From Batch Mode

| Mode                | Command                                      | Best for                                                   | Who drives the loop                                             |
| ------------------- | -------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------- |
| Transparent Sidecar | `ocpp`                                       | Daily OpenCode-style chat coding                           | OpenCode drives editing; OpenCode++ quietly guards and verifies |
| Batch Harness       | `ocpp oc "task"`                             | Benchmark, CI-like runs, scripted repair, repeatable demos | OpenCode++ drives plan / execute / evaluate / repair            |
| Core Harness        | `opencode-plusplus verify/policy/impact/...` | Advanced manual verification and automation                | User or CI calls specific guard commands                        |

Transparent Sidecar mode optimizes for a natural interactive coding experience. Batch Harness mode optimizes for repeatability and stronger OpenCode++ control.

## Troubleshooting

```bash
ocpp doctor
ocpp status
ocpp report
ocpp sidecar verify .
```

If the plugin is stale or missing, rerun:

```bash
ocpp tui . --force-plugin --dry-run
ocpp
```

If you want to use OpenCode without OpenCode++ for a session:

```bash
ocpp --pure
```
