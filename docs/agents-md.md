# Using AGENTS.md

[中文](agents-md.zh-CN.md) | English

`AGENTS.md` is a plain Markdown guide for coding agents. OpenCode++ now defaults to generating it as a short operating-constraints file: mandatory rules, entrypoints, commands, and links to generated context.

OpenCode++ writes a root `AGENTS.md` plus deeper context under `.agent-context/`.

In the OpenCode++ architecture, `AGENTS.md` is a Context Guard output. It is intentionally small; Boundary, Evidence, Impact, Regression, Hallucination, and Loop checks live in contracts, traces, policy reports, verify reports, and task runs under `.agent-context/`.

The root guide now has explicit ownership and loading layers:

- `AGENTS.md`: L0, shortest always-loaded operating rules and default workflow
- `AGENTS.manual.md`: manual environment/deployment/runbook notes, loaded only for operations tasks
- `.agent-context/AGENTS.generated.md`: generated L0 code-facing instructions used to compose the root guide
- `.agent-context/context-layers.md`: L1 map that explains when to load L1, L2, and L3 files

Default configuration:

```yaml
agents:
  mode: minimal # minimal | balanced | full
  maxTokens: 1200
  manualSources:
    - AGENTS.manual.md
  include:
    - commands
    - safety
    - entrypoints
    - contextLinks
```

Prefer `minimal`. Longer root instruction files do not automatically improve coding-agent success. Use the generated layers instead:

- L0: read `AGENTS.md` only by default.
- L1: read `.agent-context/repo-summary.md`, `.agent-context/onboarding.md`, and `.agent-context/context-layers.md` when a task starts.
- L2: read `.agent-context/tasks/<task>/` only for the concrete task.
- L3: read `.agent-context/key-files.md`, `index/`, `evidence/`, `graphs/`, and `rag/` only for targeted deep analysis.

Manual environment and deployment content is kept in `AGENTS.manual.md`; the composed root guide points to it instead of inlining the whole runbook.

Do not edit the final `AGENTS.md` by hand. Edit `AGENTS.manual.md` or other files listed in `agents.manualSources`.

## Legacy Migration

If a repository already contains a hand-written legacy `AGENTS.md`, the first generated build migrates these sections into `AGENTS.manual.md` before composing the new root file:

- Environment dependencies
- Installation steps
- `.env` / config requirements
- Docker / Compose / PM2 / systemd deployment
- Start commands
- Data and log directories
- Common failures and recovery steps

If those headings are not found, the tool falls back to moving the whole legacy file into `AGENTS.manual.md`.

## Generate It With an AI Agent

You do not have to run the CLI by hand. You can ask a coding agent to use [whut09/OpenCode-plusplus](https://github.com/whut09/opencode-plusplus) against another repository:

```txt
Use https://github.com/whut09/opencode-plusplus to generate AGENTS.md and a .agent-context package for the xxx project. Inspect the target repository first, then install or clone the tool if needed. Force LLM summaries: create or update opencode-plusplus.local.yml in the target repo, do not commit that file, and prefer the model API configuration available in the current AI tool environment or the key/baseUrl/model I provide; if configuration is missing, ask me first. Then run opencode-plusplus build <target-repo> --target codex --llm, run opencode-plusplus validate <target-repo>, and summarize the generated files plus whether LLM summary mode succeeded.
```

Replace `xxx project` with a local path, GitHub repository, or workspace name. This works especially well in Codex because Codex can run commands in the workspace and then read the generated `AGENTS.md` before making later edits.

The agent should handle the local LLM configuration for the user. Real credentials belong in `opencode-plusplus.local.yml`, which is ignored by git. If the current AI tool does not expose its own model through a callable API, the agent should ask for the provider, base URL, model, and key before running `--llm`.

## Does the Model Read It Automatically?

The model does not magically read local files by itself. The agent client decides which files to load and then passes their contents into the model context.

## Codex

Codex supports `AGENTS.md` directly. According to the Codex documentation, Codex reads `AGENTS.md` files before doing work.

Recommended usage:

```bash
opencode-plusplus build . --target codex
codex "Summarize the current repository instructions."
```

Common placement:

- `~/.codex/AGENTS.md` for personal global instructions
- `AGENTS.md` at the repository root for project instructions
- Nested `AGENTS.md` or `AGENTS.override.md` files for more specific directory guidance

Codex combines instruction files from broader scope to narrower scope. Keep the root file concise and link to `.agent-context/` for deeper details.

## Claude Code

Claude Code uses `CLAUDE.md` as its main project instruction file. It does not directly treat `AGENTS.md` as the primary memory file.

To reuse the generated `AGENTS.md`, create a root `CLAUDE.md`:

```md
@AGENTS.md

## Claude Code

- Use the generated `.agent-context/` files when you need deeper repository context.
- Prefer the detected test commands before finishing code changes.
```

This keeps `AGENTS.md` as the shared, tool-agnostic source while allowing Claude-specific notes.

## Cursor

Cursor supports `AGENTS.md` as a simple Markdown instruction file at the project root. It is useful for straightforward project-wide guidance.

Use `.cursor/rules` instead when you need:

- Path-scoped rules
- Conditional attachment
- Multiple rule files
- Cursor-specific metadata

## Other Tools

Support varies across tools. If your tool does not automatically load `AGENTS.md`, reference it explicitly:

```txt
Before editing, read AGENTS.md. For a concrete task, inspect the matching .agent-context/tasks/<task>/ files or the L1 summaries; do not load the full .agent-context directory unless needed.
```

## What To Put In AGENTS.md

Good content:

- Mandatory editing and safety rules
- Required or preferred validation commands
- Entrypoints or a few highest-value anchor files
- The L0-L3 loading workflow and links to layer-specific files
- Environment and deployment notes in `AGENTS.manual.md`, referenced but not inlined

Avoid:

- Secrets or credentials
- Long generated dumps
- Vague instructions like "write good code"
- Duplicating the entire repository
- Full module summaries, long dependency graphs, or large onboarding documents
- Hand-editing the final composed `AGENTS.md`

## References

- [OpenAI Codex: Custom instructions with AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- [Claude Code: How Claude remembers your project](https://code.claude.com/docs/en/memory)
- [Cursor Docs: Rules and AGENTS.md](https://docs.cursor.com/en/context)
