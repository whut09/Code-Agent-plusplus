# Getting Started

This guide gets Code Agent++ running in OpenCode chat mode in about five minutes.

## Install

```bash
npm i -g code-agent-plusplus opencode-ai
cd your-repo
capp
```

Then chat normally:

```txt
Fix the login timeout bug.
Add tests for this module.
Refactor this function while preserving behavior.
```

## Daily Commands

```bash
capp
capp report
capp status
capp doctor
capp --pure
```

`capp` runs preflight, ensures `.agent-context`, writes `.opencode/plugins/code-agent-plusplus.ts`, prepares OpenCode commands/agent files, prints a compact readiness summary, and launches `opencode .`.

The sidecar listens for `tool.execute.before`, `tool.execute.after`, `file.edited`, and `session.idle` events. Before a tool runs, it blocks dangerous commands, hallucinated package scripts / Makefile targets, and protected / secret paths. After a tool runs, it records command evidence under `.agent-context/traces/`, including exit code, timestamps, stdout/stderr hashes, working-tree hashes, and touched files. On idle, it runs dirty/debounced incremental verification.

The latest sidecar result is written to:

```txt
.agent-context/sidecar/latest.json
.agent-context/sidecar/latest.md
```

The TUI only receives a sidecar message when blockers are detected.

## Local Development

Inside this repository:

```bash
npm install
npm run build
node dist/cli/index.js tui . --dry-run
```

## Advanced: Build Repository Context

Use this when you only want generated context files without launching OpenCode:

```bash
code-agent-plusplus build .
code-agent-plusplus validate .
```

This writes `AGENTS.md` and `.agent-context/`.

## Advanced: Task Run

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

## Advanced: Verify After Edits

```bash
code-agent-plusplus tests . --diff --base main
code-agent-plusplus impact . --base main
code-agent-plusplus verify --diff .
code-agent-plusplus policy . --base main --fail-on required
```

## Advanced: Batch Harness Mode

Use the OpenCode preset when Code Agent++ should call OpenCode in batch mode and evaluate the result:

```bash
capp oc init .
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
