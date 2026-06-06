# Architecture

Repo-to-Agent-Context turns a repository into a compact context package through a six-stage pipeline.

```mermaid
graph TD
  CLI --> Scanner
  Scanner --> Indexer
  Indexer --> GraphBuilder
GraphBuilder --> Ranker
Ranker --> SummaryEngine
SummaryEngine --> ContextComposer
ContextComposer --> Outputs
ContextComposer --> RagAdapter
RagAdapter --> LightRAG
```

## Scanner

The scanner walks the repository while respecting `.gitignore` and built-in excludes for dependency folders, build artifacts, generated output, virtual environments, and common caches.

It detects:

- Languages
- Frameworks
- Package managers
- Config files
- Entrypoints
- Run and test commands
- Token estimates

## Indexer

The indexer reads source files and applies analyzers with explicit confidence and evidence:

- TypeScript Compiler API for TypeScript/JavaScript imports, exports, symbols, routes, barrel exports, and path aliases
- Python local absolute/relative import resolution plus lightweight symbol extraction
- Generic metadata for all other files

Fallback analysis is marked low-confidence. Evidence is exported to `.agent-context/evidence/file-evidence.json`.

## Graph Builder

The graph builder creates:

- File-level dependency edges
- Module-level dependency edges

Module names are inferred from path structure. For example, `src/auth/session.ts` belongs to the `auth` module.

## Ranker

The ranker scores files using repository signals:

- Entrypoint weight
- Configuration weight
- README/docs signal
- Exported symbol weight
- Symbol count
- Import centrality
- Test signal
- Generated/asset/lockfile penalty
- Analysis confidence

## Task Context

Task packs use lexical retrieval, dependency graph expansion, related tests/entrypoints/configuration, and token-budgeted packing. Bugfix, feature, and refactor tasks use different priorities.

## Readiness

Readiness is a diagnostic, not a success guarantee. Low-level signal categories still include structure, commands, tests, architecture, task context, and safety. They roll up into Operational, Context Quality, and Agent Safety dimensions, then hard caps prevent easy 100s when important trust signals are missing, such as CI, real tokenizer accounting, high-confidence AST/compiler analysis, benchmark fixtures, or generated output validation.

## Composer

The composer writes both human-friendly Markdown and machine-readable JSON:

- `AGENTS.md`
- `.agent-context/repo-summary.md`
- `.agent-context/key-files.md`
- `.agent-context/module-map.md`
- `.agent-context/dependency-graph.md`
- `.agent-context/architecture.md`
- `.agent-context/onboarding.md`
- `.agent-context/readiness.md`
- `.agent-context/tasks/*.md`
- `.agent-context/index/*.json`
- `.agent-context/graphs/*.json`
- `.agent-context/graphs/*.mmd`

## Summary Engine

The summary engine has two modes:

- Offline mode: uses static repository signals and never calls an external model.
- LLM mode: uses a local private `repo-context.local.yml` with an OpenAI-compatible `baseUrl`, `apiKey`, and `model`.

Committed examples must keep `baseUrl`, `apiKey`, and `model` as `xx`. Real credentials belong only in `repo-context.local.yml`, which is ignored by git.

## RAG Adapter

RAG is introduced as an optional adapter, not as a required core dependency.

The core package always produces deterministic static context first. The RAG adapter then exports agent-ready documents to `.agent-context/rag/documents.jsonl` for LightRAG ingestion.

This keeps the CLI fast and portable while still supporting semantic retrieval for large repositories.

Recommended LightRAG flow:

1. Run `repo-context build`.
2. Import `.agent-context/rag/documents.jsonl` into LightRAG.
3. Query LightRAG for task-specific context.
4. Feed retrieved snippets plus `AGENTS.md` into the coding agent.

## Design Principle

The MVP avoids LLM dependency. It should produce useful context in offline CI, local dev, and open-source workflows. LLM summaries can be layered on later as an optional enhancement.

Optional output groups are controlled by `outputs.*`. Disabling a group removes its previously generated artifacts. Core summaries, key files, token savings, onboarding, and machine-readable indexes are always generated.

## Verification

```bash
npm run build
npm run check
npm test
```
