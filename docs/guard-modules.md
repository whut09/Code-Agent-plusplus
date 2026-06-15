# Guard Modules

Code Agent++ Guard modules are external enhancement components designed around coding-agent failure modes. Each Guard maps to one engineering problem and turns prompt-only requirements into generated, checkable, recorded, and auditable harness behavior.

## Overview

| Guard                               | Problem                                       | Status                 |
| ----------------------------------- | --------------------------------------------- | ---------------------- |
| Context Guard                       | Wrong context, irrelevant search, token waste | implemented foundation |
| Hallucination Guard                 | Invented APIs, commands, config, conventions  | implemented foundation |
| Boundary Guard                      | Edit scope expansion and protected path edits | implemented foundation |
| Regression Guard                    | Reintroducing historical bugs                 | planned                |
| Evidence Guard                      | Untrustworthy or stale test evidence          | implemented foundation |
| Impact Guard                        | Invisible blast radius and review risk        | implemented foundation |
| Loop Guard                          | Repair loops that cannot converge             | implemented foundation |
| Executor Adapter + Trace Normalizer | Inconsistent agent event formats              | partial                |

## Context Guard

Context Guard builds task-level context. It does not stuff the whole repository into the prompt; it scans, indexes, graphs, ranks, and packs the minimum useful context for the task.

Inputs:

- repository files
- config
- package scripts
- dependency graph
- task text
- git diff

Outputs:

- `AGENTS.md`
- `.agent-context/repo-summary.md`
- `.agent-context/key-files.md`
- `.agent-context/module-map.md`
- `.agent-context/tasks/`
- `.agent-context/runs/<task-id>/pack.md`
- future: `CLAUDE.md`, Cursor rules, OpenCode instructions

Goals:

- Reduce blind file search.
- Reduce token waste.
- Make agents inspect the right entrypoints, modules, tests, and constraints first.

## Hallucination Guard

Hallucination Guard reduces engineering hallucination by checking whether the agent referenced objects that are not backed by repository evidence.

MVP checks:

- missing files
- missing functions, classes, types, or exports
- missing CLI commands, npm scripts, or test commands
- missing config keys or environment variables
- missing dependencies

Inputs:

- execution trace / normalized executor events
- git diff and changed files
- package scripts and dependency declarations
- env examples and config files
- symbol/export index

Outputs:

- `.agent-context/hallucination/<task-id>.json`
- `.agent-context/runs/<task-id>/hallucination.md`
- evidence references
- repair suggestions
- items that require existence verification

Policy mapping:

- missing command -> required failure
- missing symbol in modified code -> forbidden failure
- missing local import file in modified code -> forbidden failure
- missing dependency -> risk warning
- missing config key -> risk warning
- missing file mentioned by transcript or diff explanation -> warning

Goal:

- Turn “the model thinks this should exist” into “repository evidence proves this exists.”

## Boundary Guard

Boundary Guard constrains the edit surface so a local task does not become a broad refactor.

Inputs:

- task pack
- file classification
- contracts
- protected path rules
- changed files

Outputs:

- allowed edit paths
- denied edit paths
- protected path findings
- generated / lockfile / migration / CI / deploy risk findings

Current implementation:

- `.agent-context/contracts/safety.contract.json`
- `.agent-context/contracts/module-boundaries.json`
- `code-agent-plusplus validate-contracts`
- `code-agent-plusplus policy`
- `.agent-context/runs/<task-id>/edit-boundary.md`

Goals:

- Prevent accidental edits to generated files, lockfiles, migrations, CI, deploy, infra, and env files.
- Make scope expansion visible during review.

## Regression Guard

Regression Guard prevents old problems from returning. It injects fix history, known issues, and fragile modules into task context and checks whether a new change steps back into old failure patterns.

Planned inputs:

- fix history
- issue / PR notes
- previous bug patterns
- regression tests
- fragile modules
- known failure cases

Planned outputs:

- anti-regression notes
- required regression tests
- historical-risk findings
- repair suggestions

Goal:

- Make agents remember already-fixed problems and require stronger checks on risky modules.

## Evidence Guard

Evidence Guard validates test and command evidence. It does not trust natural-language summaries alone; it reads structured traces.

Checks:

- which commands actually ran
- whether exit code was 0
- whether stdout/stderr records or hashes exist
- whether startedAt / finishedAt happened after the last edit
- whether workingTreeHashBefore / workingTreeHashAfter match the current diff
- whether code changed again after tests passed

Current implementation:

- `.agent-context/traces/<trace-id>.json`
- `code-agent-plusplus trace run`
- `code-agent-plusplus policy --trace <trace-id>`
- `code-agent-plusplus loop --trace <trace-id>`

Goals:

- Turn “tests passed” into auditable evidence.
- Prevent stale evidence from finalizing a task.

## Impact Guard

Impact Guard analyzes the engineering blast radius of a diff.

Inputs:

- changed files
- dependency graph
- module map
- related tests
- key file ranking

Outputs:

- directly affected files
- transitive dependents
- affected modules
- related tests
- risk level
- required verification

Current implementation:

- `code-agent-plusplus impact`
- `code-agent-plusplus tests`
- `code-agent-plusplus verify`
- `.agent-context/runs/<task-id>/impact.md`

Goals:

- Show agents and reviewers what the change affects.
- Move test selection from nearby files to dependency-impact-aware tests.

## Loop Guard

Loop Guard controls repair/finalize decisions. It does not accept “done” from the agent by default; it uses state, evidence, policy, and impact analysis to choose the next action.

Decisions:

- finalize
- rerun tests
- repair code
- repair tests
- repack context
- block
- rollback
- require human review

Current implementation:

- `code-agent-plusplus loop`
- `code-agent-plusplus orchestrate`
- `.agent-context/loops/`
- `.agent-context/runs/<task-id>/state.json`

Goals:

- Prevent infinite repair loops.
- Prevent premature finalization.
- Make each next action explainable, auditable, and repeatable.

## Executor Adapter + Trace Normalizer

Executor Adapter lets Code Agent++ treat OpenCode, Codex CLI, Claude Code, Cursor, MiMoCode, and other tools as replaceable executors.

Current capabilities:

- `mock` executor
- generic `--executor-command`
- changed file collection
- trace and verification artifacts

Planned capabilities:

- OpenCode JSON stdout / transcript / fallback normalizer (implemented foundation)
- MiMoCode event normalizer
- Codex JSONL normalizer
- Claude Code transcript normalizer
- unified execution trace schema

Goal:

- Coding agents can differ, but Code Agent++ consumes a unified diff, trace, command evidence, and final state.
