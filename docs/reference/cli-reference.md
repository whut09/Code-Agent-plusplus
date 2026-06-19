# CLI Reference

## Recommended Commands

`capp` is the user-facing product entrypoint. Use it for daily OpenCode-style interactive coding:

```bash
capp
capp report
capp status
capp doctor
capp --pure
```

`code-agent-plusplus` is the advanced / kernel entrypoint. Use it for scriptable context, verification, and harness workflows:

```bash
code-agent-plusplus build .
code-agent-plusplus verify --diff .
code-agent-plusplus orchestrate "task" .
```

In short:

```txt
capp = user entrypoint / product entrypoint
code-agent-plusplus = advanced command / kernel entrypoint
```

## Core

```bash
code-agent-plusplus build [repo]
code-agent-plusplus validate [repo]
code-agent-plusplus init [repo]
code-agent-plusplus update [repo] --since main
```

## Task Context

```bash
code-agent-plusplus plan "<task>" [repo]
code-agent-plusplus pack "<task>" [repo]
code-agent-plusplus run "<task>" [repo]
code-agent-plusplus task "<task>" [repo]
```

## Verification

```bash
code-agent-plusplus tests [repo] --diff --base main
code-agent-plusplus impact [repo] --base main
code-agent-plusplus verify --diff [repo]
code-agent-plusplus policy [repo] --base main --fail-on required
code-agent-plusplus validate-contracts [repo] --base main
```

## Loop And Runtime

```bash
capp
capp --pure
capp report [repo]
capp status [repo]
capp doctor [repo]
capp tui [repo] --dry-run
capp sidecar verify [repo]
capp sidecar check-command [repo] --command "npm run test" --path src/app.ts
capp sidecar record-tool [repo] --tool bash --command "npm test" --exit-code 0
code-agent-plusplus loop "<task>" [repo] --phase after-edit --write
code-agent-plusplus agent run "<task>" [repo] --executor mock
code-agent-plusplus orchestrate "<task>" [repo] --executor mock --max-loops 3
```

When invoked as `capp` with no arguments, OpenCode++ runs OpenCode TUI preflight, ensures `.agent-context`, writes `.opencode/plugins/code-agent-plusplus.ts`, prepares OpenCode commands/agent files, and launches `opencode <repo>`.

`capp --pure` launches plain OpenCode without generating `.agent-context` or injecting the sidecar.

`capp report` reads `.agent-context/sidecar/latest.md`.

`capp status` summarizes whether the plugin, context, sidecar event log, and latest report exist.

`capp doctor` checks OpenCode, `opencode auth list`, git, `.agent-context`, the sidecar plugin, and latest report readiness.

`capp sidecar verify` checks that the OpenCode sidecar plugin exists, listens for `tool.execute.after`, `file.edited`, and `session.idle`, and can write/read its event log at `.agent-context/traces/opencode-sidecar-events.jsonl`. It then runs the shared OpenCode++ guard stack: contracts, hallucination guard, regression guard, impact analysis, test selection, task verify, and policy engine. The current result is written to:

```txt
.agent-context/sidecar/latest.json
.agent-context/sidecar/latest.md
.agent-context/sidecar/policy.md
.agent-context/sidecar/task-verify.md
.agent-context/sidecar/hallucination.md
.agent-context/sidecar/regression.md
```

Use `--quiet` for sidecar automation; it only prints when blockers are found.

`capp sidecar check-command` is the pre-execution command guard used by the OpenCode sidecar `tool.execute.before` hook. It checks package scripts from `package.json`, Makefile targets, dangerous shell patterns, and protected / secret paths. It exits non-zero when execution should be blocked.

`capp sidecar record-tool` is an internal post-execution evidence recorder used by the OpenCode sidecar `tool.execute.after` hook. It writes `.agent-context/traces/opencode-sidecar-events.jsonl` and `.agent-context/traces/opencode-session-<id>.json` with command, exit code, timestamps, stdout/stderr hashes, working-tree hashes, and touched files. Users normally do not call it manually.

## OpenCode Preset

```bash
code-agent-plusplus opencode init [repo]
code-agent-plusplus opencode doctor [repo]
code-agent-plusplus opencode run "<task>" [repo]
capp oc init [repo]
capp oc doctor [repo]
capp oc "<task>" [repo]
capp oc report --last
capp oc repair
```

`opencode init` / `oc init` writes:

```txt
.opencode/commands/capp.md
.opencode/commands/capp-verify.md
.opencode/agents/code-agent-plusplus.md
```

`opencode run` and `oc` default to:

```bash
opencode run --format json --dir {repo} --file {prompt} "Follow the attached OpenCode++ task prompt."
```

`opencode run` and `oc` print a compact summary by default. Use `--full-report` for the full report, `--json` for machine-readable output, or `oc report --last` after a run.

## Guard Commands

```bash
code-agent-plusplus hallucination [repo] --trace <trace-id> --base main
code-agent-plusplus regression [repo] --trace <trace-id> --base main
code-agent-plusplus memory learn-from-pr [repo] --task "<summary>"
code-agent-plusplus memory add-fix [repo] --candidate <file>
```

## Retrieval And Graph

```bash
code-agent-plusplus retrieve "<query>" [repo] --provider hybrid
code-agent-plusplus graph [repo]
code-agent-plusplus explain <path-or-module> [repo]
code-agent-plusplus rag export [repo]
```

## Health

```bash
code-agent-plusplus freshness [repo]
code-agent-plusplus drift [repo]
code-agent-plusplus delta [repo] --base main
code-agent-plusplus evolve [repo] --base main
code-agent-plusplus savings [repo] --actual
code-agent-plusplus readiness [repo]
```

## Benchmark

```bash
code-agent-plusplus benchmark benchmarks --top-k 8
code-agent-plusplus benchmark-agent benchmarks --executor mock --dry-run
```

Run `code-agent-plusplus <command> --help` for command-specific options.
