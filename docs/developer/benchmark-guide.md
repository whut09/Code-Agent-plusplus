# Benchmark Guide

Code Agent++ benchmarks compare context and harness modes.

## Static Benchmark

```bash
code-agent-plusplus benchmark benchmarks --top-k 8
```

Measures retrieval quality such as relevant files and required tests.

## Agent Behavior Benchmark

```bash
code-agent-plusplus benchmark-agent benchmarks --executor mock --dry-run
```

Modes:

- `no-context`
- `agents-md`
- `context-pack`
- `loop-enabled-harness`

Metrics:

- `wrong_files_changed`
- `forbidden_files_changed`
- `tests_missing`
- `tests_failed`
- `hallucinated_commands`
- `iterations_to_finish`
- `final_decision_accuracy`
- `human_review_needed`

Use the generic executor hook for real-agent comparisons:

```bash
code-agent-plusplus benchmark-agent benchmarks \
  --executor opencode \
  --executor-command "opencode run --format json {prompt}" \
  --max-loops 3 \
  --fail-on required
```
