# Executor CLI Integration

Use this path when Code Agent++ should drive a bounded harness-led loop while an external coding agent performs edits.

## Generic Command Adapter

```bash
code-agent-plusplus orchestrate "fix login timeout bug" . \
  --executor opencode \
  --executor-command "opencode run --format json {prompt}" \
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

- `{prompt}`: path or content supplied by Code Agent++.
- `{task}`: original task text.
- `{repo}`: repository path.
- `{runDir}`: `.agent-context/runs/<task-id>/`.

## Sandbox

`--checkpoint git-worktree` runs the executor in a temporary worktree and exports patches back to the run directory. Code Agent++ records rollback decisions and checkpoint evidence, but it does not destructively reset the user's working tree.
