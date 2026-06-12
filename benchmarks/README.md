# Context Quality Benchmark

This demo benchmark measures whether task-aware context packs select useful files and tests for small repository fixtures.

Run:

```bash
npm run benchmark
# or
repo-context benchmark benchmarks --top-k 8
repo-context benchmark benchmarks --json
```

Fixtures:

- `small-ts-app`: TypeScript auth/session flow.
- `react-app`: React auth state UI.
- `fastapi-app`: FastAPI route/schema flow.
- `monorepo`: shared config package used by API and web packages.

Metrics:

- `Recall@K`: expected task-relevant files present in the task pack top K.
- `Precision@K`: top K slots occupied by expected task-relevant files.
- `Token compression ratio`: fixture token estimate divided by task-pack token estimate.
- `Test recommendation accuracy`: expected tests present in minimal or regression test recommendations.
- `Agent success delta`: average score delta from `no-context` to `task-pack-contracts-verify` when `benchmarks/agent-runs/*.json` records exist.
- `Agent success delta proxy`: deterministic fallback comparing task-pack coverage with non-task-aware key-file baseline coverage. It is not a live agent run; use it as a repeatable demo signal.

Agent run records:

`benchmarks/agent-runs/*.json` contains manual or automated evaluation records with this shape:

```json
{
  "task": "fix-login-timeout",
  "agent": "manual-eval",
  "mode": "task-pack",
  "changedFiles": ["src/auth/session.ts"],
  "passedTests": true,
  "unrelatedChanges": 0,
  "score": 0.86
}
```

The benchmark groups runs by task and mode across:

- `no-context`
- `agents-md`
- `task-pack`
- `task-pack-contracts-verify`
