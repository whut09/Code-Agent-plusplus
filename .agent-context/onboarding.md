# Agent Onboarding

## First Reads
- `AGENTS.md`
- `.agent-context/repo-summary.md`
- `.agent-context/key-files.md`
- `.agent-context/module-map.md`
- `.agent-context/dependency-graph.md`

## Suggested Workflow
- Identify the task area and match it to a module in `module-map.md`.
- Open the relevant key files and nearby tests.
- Check dependency direction before changing exported APIs.
- Run the detected test/check command after edits when available.

## Detected Commands
- Run: `npm run dev`
- Test: `npm run check`, `npm run test`
