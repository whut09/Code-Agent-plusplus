# Executor CLI Integration

Use this path when Code Agent++ should drive a bounded harness-led loop while an external coding agent performs edits.

## OpenCode TUI Sidecar

```bash
npm i -g code-agent-plusplus opencode-ai
cd your-repo
capp
```

`capp` starts OpenCode TUI for the current repository after preflight. It ensures `.agent-context`, `.opencode/plugins/code-agent-plusplus.ts`, `.opencode/commands/capp.md`, `.opencode/commands/capp-verify.md`, and `.opencode/agents/code-agent-plusplus.md`.

## OpenCode Preset

```bash
capp oc init .
code-agent-plusplus opencode doctor .
code-agent-plusplus opencode run "fix login timeout bug" .
capp oc "fix login timeout bug" .
capp oc report --last
capp oc repair
```

The preset uses the built-in command template:

```bash
opencode run --format json --dir {repo} --file {prompt} "Follow the attached Code Agent++ task prompt."
```

`opencode doctor` checks OpenCode installation, `opencode run`, `opencode auth list`, git repository status, `.agent-context`, and working-tree cleanliness.

`oc init` creates OpenCode-native commands and an agent profile:

```txt
.opencode/commands/capp.md
.opencode/commands/capp-verify.md
.opencode/agents/code-agent-plusplus.md
```

Inside OpenCode, use `/capp <task>` to start a Code Agent++ harness-led run and `/capp-verify` before finalizing.

OpenCode preset runs print a compact terminal summary by default:

```txt
Code Agent++ OpenCode Run

Task: fix login timeout bug
Decision: repair
Confidence: 0.72

Changed files:
- src/auth/session.ts
- test/auth/session.test.ts

Blocking gates:
- Evidence Guard: no test command after last edit

Next:
  capp oc repair
  capp oc report --last
```

## Generic Command Adapter

```bash
code-agent-plusplus orchestrate "fix login timeout bug" . \
  --executor opencode \
  --executor-command "opencode run --format json --dir {repo} --file {prompt} \"Follow the attached Code Agent++ task prompt.\"" \
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

- `{prompt}`: path to the per-iteration prompt file supplied by Code Agent++.
- `{task}`: original task text.
- `{repo}`: repository path.
- `{runDir}`: `.agent-context/runs/<task-id>/`.

## Sandbox

`--checkpoint git-worktree` runs the executor in a temporary worktree and exports patches back to the run directory. Code Agent++ records rollback decisions and checkpoint evidence, but it does not destructively reset the user's working tree.
