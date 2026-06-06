<!-- generated-by: repo-to-agent-context -->

# AGENTS.md

This file is intentionally short. Treat it as operating constraints plus links to deeper generated context.

## Must-Read Rules
- Inspect relevant source files before behavior-changing edits; generated summaries are not a source-of-truth replacement.
- Before finishing, run the relevant detected checks: `npm run build`, `npm run check`, `npm run test`.
- Do not commit secrets, local config, dependency folders, or generated build output such as `repo-context.local.yml`, API keys, `node_modules/`, `dist/`, or coverage artifacts.
- Preserve existing project conventions and command patterns unless the source code clearly requires a change.

## Project Entrypoints
- Entrypoint: `src/cli/index.ts`
- Anchor: `src/core/token-estimator.ts` - 5 exports, 9 symbols
- Anchor: `src/core/context-builder.ts` - 2 exports, 11 symbols
- Anchor: `src/core/types.ts` - 32 exports, 32 symbols

## Commands
- Run: `npm run dev`
- Typecheck: `npm run build`
- Typecheck: `npm run check`
- Test: `npm run test`

## Deep Context
- `.agent-context/key-files.md` - highest-signal files to inspect first
- `.agent-context/repo-summary.md` - compact repository overview
- `.agent-context/onboarding.md` - first-read path for new agents
- `.agent-context/token-savings.md` - estimated and actual context size
- `.agent-context/module-map.md` - module responsibilities
- `.agent-context/architecture.md` - architecture notes and evidence
- `.agent-context/dependency-graph.md` - file and module dependency graph
- `.agent-context/readiness.md` - agent-readiness gaps and evidence
- `.agent-context/tasks/` - bugfix, feature, and refactor task packs
- `.agent-context/rag/` - RAG-ready export documents
