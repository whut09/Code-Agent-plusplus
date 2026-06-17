# Roadmap

Code Agent++ is evolving from “generate files that help an agent read a repo” into a **Code Agent Enhancement Layer / Agent Reliability Layer**. It does not compete with Codex, Claude Code, Cursor, OpenCode, or MiMoCode. Those tools own code execution. Code Agent++ owns the external reliability layer around them: context, boundaries, evidence, impact, regression protection, hallucination checks, and repair/finalize decisions.

The roadmap is organized around the harness lifecycle:

```txt
Before execution -> During execution -> After execution -> Loop improvement
```

## North Star

Make existing coding agents safer, more verifiable, and less regression-prone in complex repositories.

The long-term product shape:

```txt
User task
  -> Code Agent++ Context / Boundary / Regression preparation
  -> choose executor: Codex / Claude Code / Cursor / OpenCode / MiMoCode
  -> code agent edits code
  -> Code Agent++ collects diff / trace / test evidence
  -> Guard modules evaluate the run
  -> Loop Guard decides finalize / repair / repack / block / human review
```

## v0.2: Context Guard Foundation

Goal: make agents guess less before editing.

- Repository scanner.
- Static file index.
- Symbol and dependency extraction.
- File and module dependency graph.
- Importance ranking.
- Minimal `AGENTS.md` generation.
- Manual/generated/composed `AGENTS.md` architecture.
- Task plan and task pack.
- Related tests detection.
- Token savings and actual output token reports.
- Readiness score with dimensions and hard caps.

Status: implemented foundation.

## v0.3: Boundary / Evidence / Impact Guards

Goal: make edits bounded, reviewable, and verifiable.

- Contracts for architecture, module boundaries, commands, tests, and safety.
- `code-agent-plusplus validate-contracts`.
- `code-agent-plusplus policy --fail-on forbidden|required|risk`.
- Execution trace with manual / command / CI evidence.
- `code-agent-plusplus trace run` for command-captured evidence.
- Exit code and command evidence recording.
- Test selection for files and diffs.
- Change impact report with direct and transitive dependents.
- `code-agent-plusplus verify --diff`.
- Freshness / drift / manifest checks.

Status: implemented foundation.

## v0.4: Loop Guard and Runtime State

Goal: stop trusting the agent’s “done” claim and make the next action explicit.

- Runtime state persisted under `.agent-context/runs/<task-id>/state.json`.
- Loop decisions with priority, confidence, blocking state, and signals.
- Trace-aware loop controller.
- Stale evidence detection after later edits.
- Repair planner that can request missing tests, contract repair, context refresh, or wider impact analysis.
- Finalize gate through policy and loop reports.

Status: implemented foundation; `orchestrate` now runs multiple bounded iterations, while richer autonomous repair planning remains ongoing.

## v0.5: Executor Adapter Layer

Goal: make Code Agent++ work as an external control plane for multiple code agents.

- `AgentExecutor` interface for external coding agents:

```ts
export interface AgentExecutor {
  name: "opencode" | "mimocode" | "codex" | "claude-code" | "cursor" | "mock";
  run(input: { repo: string; task: string; prompt: string; agent?: string; outputDir: string; env?: Record<string, string> }): Promise<{
    exitCode: number;
    eventsPath?: string;
    finalText?: string;
    changedFiles: string[];
    diffPath: string;
  }>;
}
```

- `code-agent-plusplus agent run "<task>" . --executor opencode`
- `code-agent-plusplus agent run "<task>" . --executor mimocode`
- Mock executor for CI and deterministic tests.
- Generic `--executor-command` adapter for Codex, Claude Code, Cursor, OpenCode, MiMoCode, and other scriptable code agents.
- One-shot flow through `code-agent-plusplus agent run`: `pack -> run agent -> collect diff -> policy/tests/impact/verify`.
- Multi-loop harness flow through `code-agent-plusplus orchestrate`: `pack -> run agent -> evaluate -> repair/repack/finalize/block`.

Status: mock executor, generic command adapter, and OpenCode stdout/transcript/fallback event normalizer implemented; MiMoCode, Codex, and Claude native event normalizers planned.

## v0.6: Hallucination Guard

Goal: make repository evidence the source of truth for APIs, commands, config, and conventions.

Implemented MVP checks:

- Missing file references.
- Missing symbols or exports.
- Nonexistent package scripts or test commands.
- Nonexistent config keys and environment variables.
- Missing dependencies.

Implemented outputs:

- `.agent-context/hallucination/<task-id>.json`
- `.agent-context/runs/<task-id>/hallucination.md`
- policy findings for missing commands, missing symbols, missing local import files, missing dependencies, missing config keys, and missing file references.
- evidence references and repair suggestions.
- “verify existence first” prompts

Planned expansion:

- APIs or paths that contradict local conventions.
- Framework-specific route/config checks.
- Agent-specific transcript parsers beyond the current OpenCode foundation.

Status: deterministic Hallucination Guard MVP implemented; semantic convention checks remain planned.

## v0.7: Regression Guard

Goal: prevent agents from reintroducing old bugs.

Implemented MVP inputs:

- `.agent-context/regression/known-issues.json`
- `.agent-context/regression/fix-history.json`
- `.agent-context/regression/fragile-modules.json`
- `.agent-context/regression/anti-regression-tests.json`
- task text, changed files, affected modules, and trace evidence

Implemented MVP outputs:

- anti-regression notes in task packs
- required regression tests
- historical risk findings
- `.agent-context/runs/<task-id>/regression.md`
- `.agent-context/regression/<task-id>.json`
- policy required failure when matched memory lacks required regression test evidence

Planned expansion:

- import issue / PR notes automatically
- richer pattern matching over historical failures
- repair prompts when old bug patterns reappear

Status: structured Regression Guard MVP implemented; richer history ingestion remains planned.

## v0.8: MCP and Agent-Native Runtime

Goal: let coding agents call Code Agent++ as a native reliability backend.

- MCP tools for build, plan, pack, retrieve, tests, impact, verify, evaluate, repair, finalize.
- Verifiable MCP runtime fields: `nextAction`, `blocking`, `requiredCommands`, `mustInspect`, `allowedEditGlobs`, `avoidEditGlobs`, and `missingEvidence`.
- Client usage guides for Codex, OpenCode, Claude Code, and Cursor under `docs/integrations/`.
- OpenCode / MiMoCode / MiMoCodex MCP usage guide and native event validation.
- Agent-led mode documentation: code agent calls Code Agent++ tools, with documented limitations that gates are advisory unless the host agent follows them.
- Harness-led mode documentation: Code Agent++ invokes the executor and owns verification.
- Codex and Claude Code adapters.
- Cursor integration guide.
- Unified retriever adapters for static, ripgrep, LightRAG, embedding, and hybrid retrieval.

Status: MCP scaffold, core tools, structured runtime gate fields, and Codex/OpenCode/Claude Code/Cursor integration guides implemented; per-client end-to-end validation and native event normalization remain planned.

## v0.9: Orchestrator Loop

Goal: make Code Agent++ the runtime controller and the code agent a replaceable executor.

- `code-agent-plusplus orchestrate "<task>" . --executor opencode --executor-command "opencode run --format json {prompt}" --max-loops 3 --checkpoint git-worktree --fail-on required`
- `code-agent-plusplus orchestrate "<task>" . --executor mimocode --executor-command "mimocode run {prompt}" --max-loops 3 --checkpoint git-worktree --fail-on required`
- Flow: `user task -> plan/pack -> choose executor -> execute -> collect diff/trace/test evidence -> guards -> decision`.
- Decisions: `finalize`, `repair`, `repack`, `block`, `rollback`, `require human review`.
- Multi-iteration loop runner with per-iteration artifacts under `.agent-context/runs/<task-id>/iterations/<nnn>/`.
- Native OpenCode event parsing for `opencode run --format json`, transcript files, and stdout/stderr fallback.
- Native MiMoCode / Codex / Claude event parsing.
- Git worktree sandbox integration through `--checkpoint git-worktree`; executors run in an isolated worktree, patches are exported back to the host run directory, and destructive rollback is intentionally not automatic.

Status: multi-loop orchestrator implemented with mock executor, generic command adapter, OpenCode event normalizer, per-iteration artifacts, decision gates, checkpoint patch output, and git-worktree executor sandbox; MiMoCode, Codex, and Claude event normalizers remain planned.

## v1.0: Agent Harness Benchmark

Goal: prove the reliability layer improves coding-agent behavior.

Compare:

- no context
- `AGENTS.md` only
- context pack
- loop-enabled harness
- harness + Guard modules

Measure:

- wrong file edits
- test failures
- steps per task
- token usage
- stale evidence reuse
- hallucinated APIs / commands
- regression reintroduction
- repair loops
- human-review blocks

First targets:

- OpenCode
- MiMoCode / MiMoCodex
- Codex CLI
- Claude Code
- Cursor

Current MVP:

- `code-agent-plusplus benchmark-agent benchmarks --executor mock --dry-run`
- Real executor command hook through `--executor opencode|mimocode|codex|claude-code|cursor`.
- Same task, same executor, same fixture, four modes: `no-context`, `agents-md`, `context-pack`, `loop-enabled-harness`.
- Phase 6 task set: 10 tasks covering 3 bugfix, 2 feature, 2 refactor, 1 hallucinated-command trigger, 1 protected-path trigger, and 1 regression trigger.
- Per-run metrics: `wrong_files_changed`, `forbidden_files_changed`, `tests_missing`, `tests_failed`, `hallucinated_commands`, `iterations_to_finish`, `final_decision_accuracy`, and `human_review_needed`.
- Mode summary table: wrong files, forbidden files, missing tests, failed tests, hallucinated commands, iterations, decision accuracy, human review rate, and final gate strength.
- `benchmarks/agent-runs/*.json` supports manual or automated OpenCode/Codex/Claude/Cursor/MiMoCode run records for repeatable behavior comparison.

OpenCode example:

```bash
code-agent-plusplus benchmark-agent benchmarks \
  --executor opencode \
  --executor-command "opencode run --format json {prompt}" \
  --max-loops 3 \
  --fail-on required
```

Status: deterministic benchmark harness implemented; Phase 6 10-task value benchmark implemented with mock/generic executor support and manual four-mode records; repeated OpenCode/MiMoCode/Codex/Claude real-agent data collection remains ongoing.

## v1.1: Runtime Codebase Refactor

Goal: keep the harness maintainable as real executors, guards, and normalizers grow.

Target module boundaries:

```txt
src/
  guards/
    boundary/
    evidence/
    impact/
    hallucination/
    regression/
    loop/
  runtime/
    state-machine.ts
    orchestrator.ts
    decision-router.ts
    checkpoint.ts
    iteration-store.ts
  executors/
    index.ts
    mock.ts
    generic-command.ts
    opencode.ts
    codex.ts
    claude-code.ts
  normalizers/
    opencode.ts
    codex.ts
    claude.ts
    generic.ts
  integrations/
    mcp/
    codegraph/
    lightrag/
  outputs/
    markdown/
    json/
```

Rationale:

- `outputs/` should eventually focus on rendering.
- `runtime/` should own loop orchestration and decisions.
- `guards/` should own checks and findings.
- `executors/` should own external code-agent invocation.
- `normalizers/` should own event and transcript parsing.

Status: planned refactor. Current implementation keeps compatibility while new behavior lands.

## Longer-Term Language Analysis

- Keep TypeScript/JavaScript on the TypeScript Compiler API for project-aware semantics.
- Strengthen Python with Tree-sitter plus stdlib `ast` fallback.
- Add Go through `tree-sitter-go` plus `go.mod` metadata.
- Add Rust through `tree-sitter-rust` plus `Cargo.toml` metadata.
- Add Java through `tree-sitter-java` plus Maven/Gradle metadata.
- Add C/C++ through `tree-sitter-cpp` plus `compile_commands.json`.

## Completed Foundation

- Repository scanner.
- Static file index.
- Symbol and dependency extraction.
- File and module dependency graph.
- Importance ranking.
- `AGENTS.md` generation.
- Manual/generated/composed AGENTS architecture.
- Readiness score.
- Token savings.
- RAG export and retrieval protocol.
- Task context, impact, test selection, and benchmark foundations.
- Incremental cache for repeated builds and MCP/editor sessions.
- Harness-led `orchestrate` command.
- `agent run` executor wrapper.
- Mock executor and generic executor command adapter.
- Multi-loop orchestrator iterations with prompt, executor events, diff, trace, policy, verify, loop, and decision artifacts.
