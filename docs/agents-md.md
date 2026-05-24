# Using AGENTS.md

[中文](agents-md.zh-CN.md) | English

`AGENTS.md` is a plain Markdown guide for coding agents. It usually contains repository structure, commands, conventions, safety notes, and links to generated context files.

Repo-to-Agent-Context writes a root `AGENTS.md` plus deeper context under `.agent-context/`.

## Does the Model Read It Automatically?

The model does not magically read local files by itself. The agent client decides which files to load and then passes their contents into the model context.

## Codex

Codex supports `AGENTS.md` directly. According to the Codex documentation, Codex reads `AGENTS.md` files before doing work.

Recommended usage:

```bash
repo-context build . --target codex
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
Before editing, read AGENTS.md and the relevant files under .agent-context/.
```

## What To Put In AGENTS.md

Good content:

- How to run, test, and build the project
- Important files and modules
- Architecture constraints
- Code style and naming conventions
- Safety rules, generated file warnings, and dependency rules
- Links to deeper context files

Avoid:

- Secrets or credentials
- Long generated dumps
- Vague instructions like "write good code"
- Duplicating the entire repository

## References

- [OpenAI Codex: Custom instructions with AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- [Claude Code: How Claude remembers your project](https://code.claude.com/docs/en/memory)
- [Cursor Docs: Rules and AGENTS.md](https://docs.cursor.com/en/context)
