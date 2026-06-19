# Executor CLI Integration

Use this path when OpenCode++ should drive a bounded harness-led loop while an external coding agent performs edits.

## OpenCode TUI Sidecar

```bash
npm i -g opencode-ai
git clone https://github.com/whut09/opencode-plusplus.git
cd opencode-plusplus
npm install
npm run build
npm link
cd your-repo
ocpp
```

`ocpp` starts the OpenCode TUI for the current repository after preflight and injects the OpenCode++ sidecar plugin. It is the default transparent chat mode for daily coding. `capp` remains available as a legacy alias.

Read the full sidecar flow in [OpenCode Transparent Sidecar Mode](opencode-sidecar.md).

## OpenCode Preset

```bash
ocpp oc init .
opencode-plusplus opencode doctor .
opencode-plusplus opencode run "fix login timeout bug" .
ocpp oc "fix login timeout bug" .
ocpp oc report --last
ocpp oc repair
```

The preset uses the built-in command template:

```bash
opencode run --format json --dir {repo} --file {prompt} "Follow the attached OpenCode++ task prompt."
```

`opencode doctor` checks OpenCode installation, `opencode run`, `opencode auth list`, git repository status, `.agent-context`, and working-tree cleanliness.

`oc init` creates OpenCode-native commands and an agent profile:

```txt
.opencode/commands/ocpp.md
.opencode/commands/ocpp-verify.md
.opencode/agents/opencode-plusplus.md
.opencode/commands/capp.md
.opencode/commands/capp-verify.md
.opencode/agents/code-agent-plusplus.md
```

Inside OpenCode, use `/ocpp <task>` to start an OpenCode++ harness-led run and `/ocpp-verify` before finalizing. `/capp` and `/capp-verify` remain as legacy aliases.

OpenCode preset runs print a compact terminal summary by default:

```txt
OpenCode++ OpenCode Run

Task: fix login timeout bug
Decision: repair
Confidence: 0.72

Changed files:
- src/auth/session.ts
- test/auth/session.test.ts

Blocking gates:
- Evidence Guard: no test command after last edit

Next:
  ocpp oc repair
  ocpp oc report --last
```

## Generic Command Adapter

```bash
opencode-plusplus orchestrate "fix login timeout bug" . \
  --executor opencode \
  --executor-command "opencode run --format json --dir {repo} --file {prompt} \"Follow the attached OpenCode++ task prompt.\"" \
  --max-loops 3 \
  --checkpoint git-worktree \
  --fail-on required
```

## Recommended Flow

```txt
task
  -> plan / pack
  -> build prompt
  -> run external executor
  -> collect diff / trace / events
  -> hallucination / regression / policy / impact / verify
  -> decision report
```

## Placeholders

- `{prompt}`: path to the per-iteration prompt file supplied by OpenCode++.
- `{task}`: original task text.
- `{repo}`: repository path.
- `{runDir}`: `.agent-context/runs/<task-id>/`.

## Sandbox

`--checkpoint git-worktree` runs the executor in a temporary worktree and exports patches back to the run directory. OpenCode++ records rollback decisions and checkpoint evidence, but it does not destructively reset the user's working tree.
