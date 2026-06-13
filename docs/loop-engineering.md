# Loop Engineering Code Path

Repo-to-Agent-Context is moving from a context compiler into an Agent Harness Runtime Control Plane. The core loop is:

```txt
Context -> Agent -> Execution -> Trace -> Evaluation -> Context Update -> Loop
```

The project does not directly ask Codex, Claude Code, or Cursor to edit code. Instead, it provides the control plane those agents need: what to read first, what not to edit, who is affected by a change, which tests to run, whether a run can close, and whether the next turn should rebuild context, repair contracts, add tests, expand context, or move to review.

## Main Build Path

The build path starts at the CLI and flows through `buildContextPackage()`:

```txt
CLI command
  -> buildContextPackage()
  -> scanRepository()
  -> indexRepository()
  -> buildDependencyGraph()
  -> rankFiles()
  -> assessReadiness()
  -> summarizeRepository()
  -> calculateTokenSavings()
  -> writeContextPackage()
  -> AGENTS.md + .agent-context/*
```

`scanRepository()` collects repository facts, `indexRepository()` extracts imports, exports, symbols, routes, summaries, evidence, and confidence, `buildDependencyGraph()` builds file/module edges, and `rankFiles()` scores the files agents should read first.

## Edit Boundaries

Edit boundaries are built in three layers:

```txt
Task Pack relevant files
  -> Task Run allowedEditGlobs / avoidEditGlobs
  -> Contracts + validateContracts()
```

`buildTaskPack()` uses lexical retrieval, symbol/export/evidence matching, graph expansion, related tests, entrypoints, config files, and budget packing to select task-relevant context.

`writeTaskRun()` writes `.agent-context/runs/<task-id>/` with `plan.md`, `pack.md`, `edit-boundary.md`, `expected-diff.md`, `tests.md`, `verify.md`, `impact.md`, agent prompts, and `run.json`.

Contracts turn boundaries into checkable rules:

```txt
.agent-context/contracts/
  architecture.contract.json
  module-boundaries.json
  commands.contract.json
  test.contract.json
  safety.contract.json
```

`validateContracts()` checks protected/generated paths, lockfile pairing, env examples, architecture layers, module boundaries, and missing-test signals.

## Impact, Tests, And Verify

`buildChangeImpactReport()` uses git diff plus untracked files to find changed files. It then walks the dependency graph backwards to find direct and transitive dependents, computes risk, and recommends verification.

`buildTestSelection()` recommends:

- minimal tests for directly changed or related files
- regression tests for affected dependents
- full-confidence commands for broader validation

`renderTaskVerify()` combines changed files, affected modules, missing tests, recommended commands, contract checks, risk score, and risk factors. It is a validation report, not just a diff summary.

## Freshness And Drift

Every build writes `.agent-context/manifest.json` with hashes for source, config, index, graph, contracts, task packs, generated outputs, and generated files.

`assessFreshness()` reports whether generated context is fresh, stale, missing, or inconsistent with current source/config/index/graph/contracts/task packs/generated files.

`assessDrift()` focuses on generated output, dependency graph, task packs, and contract drift so agents can check whether `AGENTS.md` and `.agent-context/` are still trustworthy.

`update`, `delta`, and `evolve` have different product meanings:

- `repo-context update .` performs a full generated-context refresh with cache reuse.
- `repo-context delta .` reports changed context impact and agent re-read guidance without refreshing all outputs.
- `repo-context evolve .` currently performs a cache-aware full refresh plus `.agent-context/delta/latest.*` output. It prints cache stats and rewritten outputs so users can see what was reused. Selective writes of only affected outputs are planned.

## Loop Controller

`buildLoopControllerReport()` combines freshness, drift, contracts, impact, changed files, tests, and task-pack budget. It supports `preflight`, `after-edit`, and `repair` phases and returns decisions such as:

- `start-agent`
- `rebuild-context`
- `replan`
- `expand-context`
- `repair-contracts`
- `add-or-update-tests`
- `run-tests`
- `ready-for-review`

The controller is the bridge from static context generation to loop engineering: every turn can be evaluated against repository state and verification evidence.

## Trace And Policy

`repo-context run "<task>" .` creates a task run and trace. `repo-context trace start/add/show` can also manage traces directly. A trace records agent identity, ordered steps, touched files, reasons, commands, test results, output summaries, and final state.

`repo-context policy . --base main --trace <trace-id>` merges diff, contracts, freshness, and trace evidence. It can block forbidden edits, flag risky behavior, and require test, contract, or context-refresh evidence before a loop is considered complete.

## CLI Surface

The runtime is exposed through CLI commands, including:

```txt
build, run, loop, plan, pack, verify, task, tests, impact,
policy, validate-contracts, freshness, drift, delta, evolve,
trace start/add/show/search, benchmark, retrieve, diff, update, explain
```

The follow-up release check is to keep the npm package, `dist/`, CLI help, and docs aligned with this surface.
