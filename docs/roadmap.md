# Roadmap

## Phase 1: Offline MVP

- Repository scanner
- Lightweight language analyzers
- File and module dependency graph
- Importance ranking
- `AGENTS.md`
- Markdown and JSON context outputs

## Phase 2: Better Context Selection

- Token budget aware selection
- Task context mode with graph expansion and typed task packs
- Diff/PR context mode
- More language analyzers
- Incremental cache
- Agent readiness report
- Safe local LLM configuration
- Strict config validation and `repo-context validate`

## Phase 3: Smarter Summaries

- Optional Tree-sitter analyzer backend for Python
- Go analyzer using `tree-sitter-go` plus `go.mod` package metadata
- Rust analyzer using `tree-sitter-rust` plus `Cargo.toml` crate metadata
- Java analyzer using `tree-sitter-java` plus Maven/Gradle metadata
- C/C++ analyzer using `tree-sitter-cpp` plus `compile_commands.json`
- Optional LLM provider interface
- Evidence-linked summaries
- Architecture drift detection

## Phase 4: Distribution

- GitHub Action
- MCP server
- VS Code/Cursor integration
- Web demo and graph viewer
- Agent readiness score badge
