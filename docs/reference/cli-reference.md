# CLI Reference

The recommended command is `code-agent-plusplus`.

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
capp tui [repo] --dry-run
code-agent-plusplus loop "<task>" [repo] --phase after-edit --write
code-agent-plusplus agent run "<task>" [repo] --executor mock
code-agent-plusplus orchestrate "<task>" [repo] --executor mock --max-loops 3
```

When invoked as `capp` with no arguments, Code Agent++ runs OpenCode TUI preflight, ensures `.agent-context`, writes `.opencode/plugins/code-agent-plusplus.ts`, prepares OpenCode commands/agent files, and launches `opencode <repo>`.

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
opencode run --format json --dir {repo} --file {prompt} "Follow the attached Code Agent++ task prompt."
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
