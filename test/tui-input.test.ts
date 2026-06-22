import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  CLIPBOARD_LATEST_PATH,
  CLIP_COMMAND_PATH,
  detectEditor,
  installClipCommand,
  readClipboardInput,
  setupEditor,
  windowsEditorHint,
  writeClipboardLatest
} from "../src/cli/tui-input.js";

test("setup-editor prefers code, then cursor, then notepad", () => {
  assert.equal(detectEditor({ commandExists: (command) => command === "code" }).editor, "code --wait");
  assert.equal(detectEditor({ commandExists: (command) => command === "cursor" }).editor, "cursor --wait");
  assert.equal(detectEditor({ commandExists: () => false }).editor, "notepad");
});

test("setup-editor writes Windows user EDITOR and prints export elsewhere", () => {
  const written: Array<[string, string]> = [];
  const windows = setupEditor({
    platform: "win32",
    commandExists: (command) => command === "code",
    setUserEnvironmentVariable: (name, value) => written.push([name, value])
  });
  const linux = setupEditor({ platform: "linux", commandExists: (command) => command === "cursor" });

  assert.deepEqual(written, [["EDITOR", "code --wait"]]);
  assert.equal(windows.persisted, true);
  assert.equal(linux.persisted, false);
  assert.equal(linux.command, 'export EDITOR="cursor --wait"');
});

test("Windows TUI hint appears only when EDITOR is missing", () => {
  const hint = windowsEditorHint({ platform: "win32", env: {} }) ?? "";
  assert.equal(hint.includes("/editor"), true);
  assert.equal(hint.includes("Ctrl+X E"), true);
  assert.equal(windowsEditorHint({ platform: "win32", env: { EDITOR: "code --wait" } }), null);
  assert.equal(windowsEditorHint({ platform: "linux", env: {} }), null);
});

test("clip writes latest clipboard markdown under opencode-plusplus state", () => {
  const root = mkdtempSync(path.join(tmpdir(), "opencode-plusplus-clip-"));
  try {
    const result = writeClipboardLatest(root, "long prompt");

    assert.equal(path.relative(root, result.path).replaceAll("\\", "/"), CLIPBOARD_LATEST_PATH);
    assert.equal(readFileSync(result.path, "utf8"), "long prompt\n");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("clip input prefers piped stdin over clipboard", () => {
  assert.equal(readClipboardInput({ readStdin: () => "from stdin", readClipboard: () => "from clipboard" }), "from stdin");
  assert.equal(readClipboardInput({ readStdin: () => "", readClipboard: () => "from clipboard" }), "from clipboard");
});

test("install-commands writes OpenCode clip slash command", () => {
  const root = mkdtempSync(path.join(tmpdir(), "opencode-plusplus-install-commands-"));
  try {
    const result = installClipCommand(root);
    const relative = path.relative(root, result.path).replaceAll("\\", "/");
    const content = readFileSync(result.path, "utf8");

    assert.equal(relative, CLIP_COMMAND_PATH);
    assert.equal(existsSync(path.join(root, ".opencode", "commands", "clip.md")), true);
    assert.match(content, /\.opencode-plusplus\/clipboard\/latest\.md/);
    assert.match(content, /\$ARGUMENTS/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
