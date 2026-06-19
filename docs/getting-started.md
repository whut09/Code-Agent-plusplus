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

Use the OpenCode preset when Code Agent++ should call OpenCode and evaluate the result:

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
