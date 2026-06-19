# Getting Started

This guide gets Code Agent++ running against a repository in about five minutes.

## Install

Use `npx` for one-off runs:

```bash
npx code-agent-plusplus build .
```

For the OpenCode TUI sidecar flow:

```bash
npm i -g code-agent-plusplus opencode-ai
cd your-repo
capp
```

Daily commands:

```bash
capp
capp report
capp status
capp doctor
capp --pure
```

`capp` runs preflight, ensures `.agent-context`, writes `.opencode/plugins/code-agent-plusplus.ts`, prepares OpenCode commands/agent files, and launches `opencode .`. The sidecar listens for `tool.execute.before`, `file.edited`, and `session.idle` events. Before a tool runs, it blocks dangerous commands, hallucinated package scripts / Makefile targets, and protected / secret paths. On idle, it records a minimal event log under `.agent-context/traces/` and runs incremental verification. The latest sidecar result is written to:

```txt
.agent-context/sidecar/latest.json
.agent-context/sidecar/latest.md
```

The TUI only receives a sidecar message when blockers are detected.

Before finalizing a task from the chat flow, verify the sidecar:

```bash
capp sidecar verify .
capp sidecar check-command . --command "npm run test"
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

Use the OpenCode preset when Code Agent++ should call OpenCode in batch mode and evaluate the result:

```bash
capp oc init .
code-agent-plusplus opencode doctor .
code-agent-plusplus opencode run "fix login timeout bug" .
capp oc "fix login timeout bug" .
capp oc report --last
capp oc repair
```

`capp oc init .` writes OpenCode-native helpers:

```txt
.opencode/commands/capp.md
.opencode/commands/capp-verify.md
.opencode/agents/code-agent-plusplus.md
```

The preset internally runs:

```bash
opencode run --format json --dir {repo} --file {prompt} "Follow the attached Code Agent++ task prompt."
```

The default terminal output is a compact decision summary with task, decision, confidence, changed files, blocking gates, and next commands. Use `capp oc report --last` for the full orchestrator report.

Use `orchestrate --executor-command` when you need a custom executor command.
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
