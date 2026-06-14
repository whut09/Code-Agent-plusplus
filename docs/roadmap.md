# Roadmap

Code Agent++ is evolving from "generate files that help an agent read a repo" into a Code Agent Enhancement / Agent Reliability Layer: it generates the context, boundaries, evidence requirements, regression guards, and repair/finalize decisions an existing code agent needs to safely complete a task in a repo.

The project is not another coding agent. Codex, Claude Code, Cursor, OpenCode, and MiMoCode own the execution side: model providers, tool calling, shell/edit/read/grep, sessions, subagents, workflow runtimes, and memory. Code Agent++ owns the control plane: repository analysis, task-aware context, edit boundaries, contracts, diff impact, test recommendations, evidence validation, policy gates, freshness/drift, context delta, and repair/finalize decisions. OpenCode and MiMoCode are priority executor targets because they are open-source code-agent runtimes.

## v0.2: Task Context Enhancement

- `repo-context plan`
- Task pack directory under `.agent-context/tasks/<task-id>/`
- Related tests detection
- Risk score for task and diff contexts
- Change impact report
- `prompt.md` generation for task-specific agent handoff

## v0.3: Verification Loop

- `repo-context verify --diff`
- Recommended tests for changed files and modules
- Changed-module blast radius
- CI command detection
- GitHub Action for context validation and verification recommendations
- Regression guard output that states required checks before merge

## v0.4: Context Quality Benchmark

- Benchmark fixtures for small TypeScript, React, FastAPI, and monorepo projects
- `Recall@K` and `Precision@K` for task-relevant file selection
- Token budget benchmark and compression reporting
- Required-test recommendation accuracy
- With-context vs no-context agent comparison harness
- Repeatable benchmark report suitable for CI

## v0.5: Integration Layer

- Incremental cache for file hashes, index entries, dependency graphs, and tokenizer counts

- MCP server
- MCP tools for code agents: build, plan, pack, retrieve, tests, impact, verify, evaluate, repair, finalize
- OpenCode / MiMoCode / MiMoCodex MCP usage guide
- Agent-led mode documentation: code agent calls Code Agent++ tools, with documented limitations that gates are advisory unless the host agent follows them
- VS Code/Cursor extension
- Codex and Claude Code adapters
- Web graph viewer
- Unified retriever adapters for static, ripgrep, LightRAG, embedding, and hybrid retrieval

## v0.6: Agent Executor Wrappers

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

- `repo-context agent run "<task>" . --executor opencode`
- `repo-context agent run "<task>" . --executor mimocode`
- Mock executor for CI and deterministic tests: implemented
- Generic `--executor-command` adapter for Codex, Claude Code, Cursor, OpenCode, MiMoCode, and other scriptable code agents: implemented
- Event normalizer for OpenCode JSON events, MiMoCode events, Codex JSONL, and Claude Code transcripts
- One-shot flow: `pack -> run agent -> collect diff -> policy/tests/impact/verify`
- Harness-led one-shot mode: Code Agent++ invokes the executor and owns verification: implemented through `repo-context agent run`

## v0.7: Orchestrator Loop

- `repo-context orchestrate "<task>" . --executor opencode --max-loops 3 --fail-on required`
- `repo-context orchestrate "<task>" . --executor mimocode --max-loops 3 --fail-on required`
- Loop flow: `user task -> plan/pack -> choose executor -> execute -> collect diff/trace/test evidence -> policy/contracts/tests/impact/verify -> decision`
- Decisions: `finalize`, `repair`, `repack`, `block`, `require human review`
- Harness-led one-pass orchestrator with `mock` executor and generic command adapter: implemented
- Runtime state persisted under `.agent-context/runs/<task-id>/state.json`
- Repair planner that can repack context, request missing tests, or stop on policy failure: partially implemented through loop decisions
- Finalize gate that requires fresh context, valid contracts, current test evidence, and no forbidden edits: partially implemented through policy and loop reports

## v0.8: Agent Harness Benchmark

- Compare no context, AGENTS.md only, context pack, and orchestrated external-agent loop
- Measure wrong file edits, test failures, steps per task, token usage, stale evidence reuse, and repair loops
- First targets: OpenCode, MiMoCode / MiMoCodex, Codex CLI, Claude Code, Cursor

## Longer-Term Language Analysis

- Keep TypeScript/JavaScript on the TypeScript Compiler API for project-aware semantics.
- Strengthen Python with Tree-sitter plus stdlib `ast` fallback.
- Add Go through `tree-sitter-go` plus `go.mod` metadata.
- Add Rust through `tree-sitter-rust` plus `Cargo.toml` metadata.
- Add Java through `tree-sitter-java` plus Maven/Gradle metadata.
- Add C/C++ through `tree-sitter-cpp` plus `compile_commands.json`.

## Completed Foundation

- Repository scanner
- Static file index
- Symbol and dependency extraction
- File and module dependency graph
- Importance ranking
- `AGENTS.md` generation
- Manual/generate/composed AGENTS architecture
- Readiness score
- Token savings
- RAG export and retrieval protocol
- Task context, impact, test selection, and benchmark foundations
- Incremental cache for repeated builds and MCP/editor sessions
- Harness-led `orchestrate` command
- `agent run` executor wrapper
- Mock executor and generic executor command adapter
