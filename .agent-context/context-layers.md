# Context Layers

Generated context is intentionally layered. Start small, then open deeper files only when the task needs stronger evidence.

## L0 Always Loaded
- `AGENTS.md` - shortest operating rules and default workflow
- `AGENTS.manual.md` - manual environment/deployment notes; load only for operations tasks

## L1 Task Start
- `.agent-context/repo-summary.md` - repository overview, stack, entrypoints, and command summary
- `.agent-context/onboarding.md` - first-read workflow, task entrypoints, and validation guidance

## L2 Task Pack
- `.agent-context/tasks/<task>/task.md` - concrete task intent, suspected modules, and validation commands
- `.agent-context/tasks/<task>/relevant-files.md` - task-specific files to inspect first
- `.agent-context/tasks/<task>/dependency-neighbors.md` - direct dependency context
- `.agent-context/tasks/<task>/tests.md` - tests related to the task
- `.agent-context/tasks/<task>/risk.md` - edit boundaries and regression watchpoints

## L3 Deep Evidence
- `.agent-context/key-files.md` - ranked evidence index; not a default prompt payload
- `.agent-context/index/files.json` - indexed file metadata
- `.agent-context/index/symbols.json` - symbol lookup
- `.agent-context/index/modules.json` - module index
- `.agent-context/index/chunks.json` - source chunks for targeted retrieval
- `.agent-context/evidence/file-evidence.json` - analyzer confidence and evidence
- `.agent-context/module-map.md` - module ownership and responsibility map
- `.agent-context/architecture.md` - architecture notes with evidence
- `.agent-context/dependency-graph.md` - dependency report
- `.agent-context/graphs/` - dependency graph data
- `.agent-context/readiness.md` - readiness gaps and supporting evidence
- `.agent-context/rag/` - RAG-ready chunk export

## Loading Policy
- Do not load the full `.agent-context/` directory by default.
- Prefer source files over generated summaries when implementation behavior matters.
- Use L3 files for targeted evidence, symbol lookup, graph tracing, or RAG retrieval after the task scope is known.
