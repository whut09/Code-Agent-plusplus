# Loop Behavior Benchmark

This demo benchmark measures whether the project changes agent behavior, not just whether it produces attractive context files. It compares four modes:

- A. `no-context`: the agent receives only the task.
- B. `agents-md`: the agent receives the minimal root `AGENTS.md`.
- C. `context-pack`: the agent receives the task-aware context pack.
- D. `loop-enabled-harness`: the agent receives context pack plus policy, contract, trace, and verify-loop signals.

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

- `Wrong file edits reduction`: unrelated-file edits reduced from A to D.
- `Test failure reduction`: failed-test rate reduced from A to D.
- `Steps per task reduction`: iterations or turns reduced from A to D.
- `Token usage reduction`: token usage reduced from A to D.
- `Repair loops reduction`: retry, repair, or re-plan cycles reduced from A to D.
- `Loop moat score`: normalized behavior improvement across wrong edits, test failures, steps, tokens, and repair loops.
- `Recall@K`: expected task-relevant files present in the task pack top K.
- `Precision@K`: top K slots occupied by expected task-relevant files.
- `Token compression ratio`: fixture token estimate divided by task-pack token estimate.
- `Test recommendation accuracy`: expected tests present in minimal or regression test recommendations.
- `Agent success delta`: average score delta from `no-context` to `loop-enabled-harness` when `benchmarks/agent-runs/*.json` records exist.
- `Agent success delta proxy`: deterministic fallback comparing task-pack coverage with non-task-aware key-file baseline coverage. It is not a live agent run; use it as a repeatable demo signal.

Agent run records:

`benchmarks/agent-runs/*.json` contains manual or automated evaluation records with this shape:

```json
{
  "task": "fix-login-timeout",
  "agent": "manual-eval",
  "mode": "context-pack",
  "changedFiles": ["src/auth/session.ts"],
  "passedTests": true,
  "unrelatedChanges": 0,
  "repairLoops": 1,
  "score": 0.86
}
```

The benchmark groups runs by task and mode across:

- `no-context`
- `agents-md`
- `context-pack`
- `loop-enabled-harness`

Legacy records using `task-pack` and `task-pack-contracts-verify` are still accepted and normalized to the new mode names.
