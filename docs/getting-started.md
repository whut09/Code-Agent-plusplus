# Getting Started

This guide gets Code Agent++ running against a repository in about five minutes.

## Install

Use `npx` for one-off runs:

```bash
npx code-agent-plusplus build .
```

For local development inside this repository:

```bash
npm install
npm run build
node dist/cli/index.js build .
```

## Build Repository Context

```bash
code-agent-plusplus build .
code-agent-plusplus validate .
```

This writes `AGENTS.md` and `.agent-context/`.

## Create A Task Run

```bash
code-agent-plusplus run "fix login timeout bug" .
```

Read the generated run directory:

```txt
.agent-context/runs/<task-id>/
  plan.md
  pack.md
  edit-boundary.md
  tests.md
  impact.md
  verify.md
  prompt.codex.md
```

## Verify After Edits

```bash
code-agent-plusplus tests . --diff --base main
code-agent-plusplus impact . --base main
code-agent-plusplus verify --diff .
code-agent-plusplus policy . --base main --fail-on required
```

## Harness-Led Executor Flow

Use this when Code Agent++ should call an external coding agent and evaluate the result:

```bash
code-agent-plusplus orchestrate "fix login timeout bug" . \
  --executor opencode \
  --executor-command "opencode run --format json {prompt}" \
  --max-loops 3 \
  --checkpoint git-worktree \
  --fail-on required
```

Start with `--executor mock` when testing CI or demos.

## LLM Summaries

LLM summaries use a local file that must not be committed:

```yaml
# code-agent-plusplus.local.yml
llm:
  enabled: true
  baseUrl: "xx"
  apiKey: "xx"
  model: "xx"
```

Then run:

```bash
code-agent-plusplus build . --llm
```
