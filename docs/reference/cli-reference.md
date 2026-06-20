# CLI Reference

## Recommended Commands

`opencode-plusplus` is the user-facing product entrypoint. Use it for daily OpenCode-style interactive coding:

```bash
opencode-plusplus
opencode-plusplus report
opencode-plusplus status
opencode-plusplus doctor
opencode-plusplus --pure
```

The same binary also exposes advanced / kernel commands for scriptable context, verification, and harness workflows:

```bash
opencode-plusplus build .
opencode-plusplus verify --diff .
opencode-plusplus orchestrate "task" .
```

In short:

```txt
opencode-plusplus = user entrypoint / product entrypoint
opencode-plusplus <command> = advanced command / kernel workflow
```

## Core

```bash
opencode-plusplus build [repo]
opencode-plusplus validate [repo]
opencode-plusplus init [repo]
opencode-plusplus update [repo] --since main
```

## Task Context

```bash
opencode-plusplus plan "<task>" [repo]
opencode-plusplus pack "<task>" [repo]
opencode-plusplus run "<task>" [repo]
opencode-plusplus task "<task>" [repo]
```

## Verification

```bash
opencode-plusplus tests [repo] --diff --base main
opencode-plusplus impact [repo] --base main
opencode-plusplus verify --diff [repo]
opencode-plusplus policy [repo] --base main --fail-on required
opencode-plusplus validate-contracts [repo] --base main
```

## Loop And Runtime

```bash
opencode-plusplus
opencode-plusplus --pure
opencode-plusplus report [repo]
opencode-plusplus status [repo]
opencode-plusplus doctor [repo]
opencode-plusplus tui [repo] --dry-run
opencode-plusplus sidecar verify [repo]
opencode-plusplus sidecar check-command [repo] --command "npm run test" --path src/app.ts
opencode-plusplus sidecar record-tool [repo] --tool bash --command "npm test" --exit-code 0
opencode-plusplus loop "<task>" [repo] --phase after-edit --write
opencode-plusplus agent run "<task>" [repo] --executor mock
opencode-plusplus orchestrate "<task>" [repo] --executor mock --max-loops 3
```

When invoked as `opencode-plusplus` with no arguments, OpenCode++ runs OpenCode TUI preflight, ensures `.agent-context`, writes `.opencode/plugins/opencode-plusplus.ts`, prepares OpenCode commands/agent files, and launches `opencode <repo>`.

`opencode-plusplus --pure` launches plain OpenCode without generating `.agent-context` or injecting the sidecar.

`opencode-plusplus report` reads `.agent-context/sidecar/latest.md`.

`opencode-plusplus status` summarizes whether the plugin, context, sidecar event log, and latest report exist.

`opencode-plusplus doctor` checks OpenCode, `opencode auth list`, git, `.agent-context`, the sidecar plugin, and latest report readiness.

`opencode-plusplus sidecar verify` checks that the OpenCode sidecar plugin exists, listens for `tool.execute.after`, `file.edited`, and `session.idle`, and can write/read its event log at `.agent-context/traces/opencode-sidecar-events.jsonl`. It then runs the shared OpenCode++ guard stack: contracts, hallucination guard, regression guard, impact analysis, test selection, task verify, and policy engine. The current result is written to:

```txt
.agent-context/sidecar/latest.json
.agent-context/sidecar/latest.md
.agent-context/sidecar/policy.md
.agent-context/sidecar/task-verify.md
.agent-context/sidecar/hallucination.md
.agent-context/sidecar/regression.md
```

Use `--quiet` for sidecar automation; it only prints when blockers are found.

`opencode-plusplus sidecar check-command` is the pre-execution command guard used by the OpenCode sidecar `tool.execute.before` hook. It checks package scripts from `package.json`, Makefile targets, dangerous shell patterns, and protected / secret paths. It exits non-zero when execution should be blocked.

`opencode-plusplus sidecar record-tool` is an internal post-execution evidence recorder used by the OpenCode sidecar `tool.execute.after` hook. The sidecar normally calls it with `--input-json <path>` so long stdout/stderr is not exposed through command-line arguments. It writes `.agent-context/traces/opencode-sidecar-events.jsonl`, `.agent-context/traces/tool-evidence/opencode-tool-*.json`, and `.agent-context/traces/opencode-session-<id>.json` with command, exit code when available, timestamps, stdout/stderr hashes, sanitized/truncated output previews, working-tree hashes, and touched files. Missing exit code is recorded as `unknown`, not success. Users normally do not call it manually.

## OpenCode Preset

```bash
opencode-plusplus opencode init [repo]
opencode-plusplus opencode doctor [repo]
opencode-plusplus opencode run "<task>" [repo]
opencode-plusplus oc init [repo]
opencode-plusplus oc doctor [repo]
opencode-plusplus oc "<task>" [repo]
opencode-plusplus oc report --last
opencode-plusplus oc repair
```

`opencode init` / `oc init` writes:

```txt
.opencode/commands/opencode-plusplus.md
.opencode/commands/opencode-plusplus-verify.md
.opencode/agents/opencode-plusplus.md
```

`opencode run` and `oc` default to:

```bash
opencode run --format json --dir {repo} --file {prompt} "Follow the attached OpenCode++ task prompt."
```

`opencode run` and `oc` print a compact summary by default. Use `--full-report` for the full report, `--json` for machine-readable output, or `oc report --last` after a run.

## Guard Commands

```bash
opencode-plusplus hallucination [repo] --trace <trace-id> --base main
opencode-plusplus regression [repo] --trace <trace-id> --base main
opencode-plusplus memory learn-from-pr [repo] --task "<summary>"
opencode-plusplus memory add-fix [repo] --candidate <file>
```

## Retrieval And Graph

```bash
opencode-plusplus retrieve "<query>" [repo] --provider hybrid
opencode-plusplus graph [repo]
opencode-plusplus explain <path-or-module> [repo]
opencode-plusplus rag export [repo]
```

## Health

```bash
opencode-plusplus freshness [repo]
opencode-plusplus drift [repo]
opencode-plusplus delta [repo] --base main
opencode-plusplus evolve [repo] --base main
opencode-plusplus savings [repo] --actual
opencode-plusplus readiness [repo]
```

## Benchmark

```bash
opencode-plusplus benchmark benchmarks --top-k 8
opencode-plusplus benchmark-agent benchmarks --executor mock --dry-run
```

Run `opencode-plusplus <command> --help` for command-specific options.
