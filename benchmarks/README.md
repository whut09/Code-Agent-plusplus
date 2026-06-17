# Loop Behavior Benchmark

This demo benchmark measures whether the project changes agent behavior, not just whether it produces attractive context files. It compares four modes:

- A. `no-context`: the agent receives only the task.
- B. `agents-md`: the agent receives the minimal root `AGENTS.md`.
- C. `context-pack`: the agent receives the task-aware context pack.
- D. `loop-enabled-harness`: the agent receives context pack plus policy, contract, trace, and verify-loop signals.

Run:

```bash
npm run benchmark
npm run benchmark:agent
# or
code-agent-plusplus benchmark benchmarks --top-k 8
code-agent-plusplus benchmark benchmarks --json
code-agent-plusplus benchmark-agent benchmarks --executor mock --dry-run
```

Fixtures:

- `small-ts-app`: TypeScript auth/session flow.
- `react-app`: React auth state UI.
- `fastapi-app`: FastAPI route/schema flow.
- `monorepo`: shared config package used by API and web packages.

Phase 6 task set:

- 3 bugfix tasks: `fix-login-timeout`, `fix-react-auth-state`, `fix-fastapi-user-default`.
- 2 feature tasks: `add-api-field`, `add-auth-audit-event`.
- 2 refactor tasks: `refactor-config-loader`, `refactor-session-expiry`.
- 1 hallucinated API / command task: `hallucinated-auth-command`.
- 1 protected path task: `protected-lockfile-edit`.
- 1 regression task: `regression-session-ttl`.

Metrics:

- `wrong_files_changed`: files changed outside the expected edit surface.
- `forbidden_files_changed`: protected or forbidden files changed.
- `tests_missing`: required test evidence missing.
- `tests_failed`: executor or test command failure count.
- `hallucinated_commands`: missing package scripts or commands claimed by the agent.
- `iterations_to_finish`: loop iterations or agent turns needed to reach the final decision.
- `final_decision_accuracy`: whether the gate decision matches the observed evidence.
- `human_review_needed`: whether the run should stop for human review.
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

## Real Agent Behavior Benchmark

`benchmark-agent` runs the same task through the same executor across four modes:

- A. `no-context`: task only.
- B. `agents-md`: task plus root `AGENTS.md`.
- C. `context-pack`: task plus task-aware pack and edit boundary.
- D. `loop-enabled-harness`: Code Agent++ owns the loop and the code agent is only the executor.

Minimal dry run:

```bash
code-agent-plusplus benchmark-agent benchmarks --executor mock --dry-run
```

OpenCode example:

```bash
code-agent-plusplus benchmark-agent benchmarks \
  --executor opencode \
  --executor-command "opencode run --format json {prompt}" \
  --max-loops 3 \
  --fail-on required
```

Focused task example:

```bash
code-agent-plusplus benchmark-agent benchmarks \
  --task fix-login-timeout \
  --modes no-context,agents-md,context-pack,loop-enabled-harness \
  --executor opencode \
  --executor-command "opencode run --format json {prompt}" \
  --keep-workdirs
```

The output table is designed to show behavior, not just static retrieval quality:

| Mode            | Wrong edits | Stale evidence | Test pass | Loops   | Final gate |
| --------------- | ----------- | -------------- | --------- | ------- | ---------- |
| A. no context   | higher      | higher         | weaker    | higher  | weak       |
| B. AGENTS.md    | lower       | medium         | better    | medium  | weak       |
| C. context pack | lower       | lower          | better    | lower   | medium     |
| D. harness-led  | lowest      | lowest         | strongest | bounded | strong     |

Metrics collected per run:

- `changedFiles`
- `unrelatedChanges`
- `forbiddenFilesChanged`
- `passedTests`
- `missingEvidence`
- `testsMissing`
- `testsFailed`
- `hallucinatedCommands`
- `loopCount`
- `iterationsToFinish`
- `finalDecision`
- `finalDecisionAccuracy`
- `humanReviewNeeded`
- `hallucinationFindings`
- `regressionFindings`
