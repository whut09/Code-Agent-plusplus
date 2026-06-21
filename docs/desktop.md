# OpenCode++ Desktop MVP

OpenCode++ Desktop is a lightweight Electron UI for running the existing OpenCode++ harness from a desktop window. It does not embed the OpenCode TUI.

## Why Not Embed The OpenCode TUI

OpenCode is already a terminal-native coding agent runtime. Embedding its TUI inside Electron would add a second terminal layer, which makes clipboard handling, keyboard shortcuts, shell behavior, focus, and platform-specific terminal emulation harder to make reliable.

The Desktop MVP avoids that problem:

```txt
Desktop UI
  -> child_process
  -> opencode-plusplus.cmd oc run "<task>" --repo "<repo>" --max-loops 2
  -> stdout/stderr stream
  -> generated report
```

OpenCode++ remains the harness. The desktop app only gives users a visual control surface for selecting a repository, entering a task, starting or stopping the run, watching output, and opening the generated report.

## What It Does

- Select a local repository directory.
- Enter a task in a desktop form.
- Run `opencode-plusplus.cmd oc run "<task>" --repo "<repo>" --max-loops 2`.
- Stream stdout and stderr in real time.
- Stop the current task.
- Open the latest `.agent-context/orchestrator/<task-id>/orchestrator.md` report.

## What It Does Not Do

- It does not embed OpenCode's TUI.
- It does not replace OpenCode.
- It does not modify guard, policy, trace, impact, or orchestrator logic.
- It does not implement a separate agent runtime.

## Project Layout

```txt
apps/desktop/
  package.json
  src/main/main.ts        Electron main process and child_process runner
  src/main/preload.ts     Safe IPC bridge
  src/renderer/src/       React UI
```

## Development

Install the desktop app dependencies:

```bash
cd apps/desktop
npm install
```

Build the desktop app:

```bash
npm run build
```

Run the built shell:

```bash
npm run start
```

The desktop app expects the `opencode-plusplus.cmd` command to be available on Windows. During source development, build the root CLI and run `npm link` from the repository root before starting the desktop app.
