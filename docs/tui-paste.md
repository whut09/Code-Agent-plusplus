# TUI Paste Guide

OpenCode++ continues to use the native OpenCode TUI on Windows. It does not build a Desktop replacement and does not embed the TUI in another terminal surface.

Use one of three input paths.

## 1. Direct Input

Use direct input for short prompts:

```txt
Fix the login timeout bug and add a regression test.
```

This keeps the normal OpenCode TUI experience unchanged.

## 2. `/editor` or `Ctrl+X E`

For long prompts, use OpenCode's editor flow:

```bash
opencode-plusplus setup-editor
opencode-plusplus
```

On Windows, `setup-editor` writes a user-level `EDITOR` environment variable. It chooses the first available editor in this order:

1. `code --wait`
2. `cursor --wait`
3. `notepad`

Restart the terminal after running `setup-editor`, then open the editor from OpenCode TUI with `/editor` or `Ctrl+X E`.

On non-Windows platforms, `setup-editor` prints an `export EDITOR="..."` line for your shell profile instead of changing the environment.

## 3. `/clip`

Use `/clip` when you want to move a large prompt through the system clipboard without fighting terminal paste behavior.

Install the slash command once per repository:

```bash
opencode-plusplus install-commands
```

Copy your long prompt, then write it into the OpenCode++ clipboard file:

```bash
opencode-plusplus clip
```

Or pipe text directly:

```bash
Get-Content .\prompt.md -Raw | opencode-plusplus clip
```

The payload is written to:

```txt
.opencode-plusplus/clipboard/latest.md
```

Then open OpenCode TUI and run:

```txt
/clip
```

The slash command asks OpenCode to read `.opencode-plusplus/clipboard/latest.md` as the long-form user input.

## Notes

- `.opencode-plusplus/clipboard/` is ignored by git.
- `opencode-plusplus tui` prints a Windows hint when `EDITOR` is not set: use `/editor` or `Ctrl+X E` for long text.
- `opencode-plusplus clip` is a helper around the native TUI; it does not modify OpenCode source code.
