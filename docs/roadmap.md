# Roadmap

Repo-to-Agent-Context should evolve from "generate files that help an agent read a repo" into "generate the context and guardrails an agent needs to safely complete a task in a repo." Future work should prioritize task context, impact analysis, test selection, edit boundaries, verification loops, and measurable context quality over more generic summary documents.

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
- VS Code/Cursor extension
- Codex and Claude Code adapters
- Web graph viewer
- Unified retriever adapters for static, ripgrep, LightRAG, embedding, and hybrid retrieval

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
