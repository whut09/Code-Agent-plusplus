import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const CLIPBOARD_LATEST_PATH = ".opencode-plusplus/clipboard/latest.md";
export const CLIP_COMMAND_PATH = ".opencode/commands/clip.md";

export interface EditorCandidate {
  executable: string;
  editor: string;
}

export interface EditorSetupResult {
  platform: NodeJS.Platform;
  editor: string;
  command: string;
  persisted: boolean;
}

export interface CliInputRuntime {
  platform?: NodeJS.Platform;
  env?: NodeJS.ProcessEnv;
  commandExists?: (command: string) => boolean;
  setUserEnvironmentVariable?: (name: string, value: string) => void;
}

export interface ClipboardRuntime {
  platform?: NodeJS.Platform;
  readStdin?: () => string;
  readClipboard?: () => string;
}

export interface FileWriteResult {
  path: string;
  bytes: number;
}

export function setupEditor(runtime: CliInputRuntime = {}): EditorSetupResult {
  const platform = runtime.platform ?? process.platform;
  const candidate = detectEditor(runtime);
  if (platform === "win32") {
    const setUserEnvironmentVariable = runtime.setUserEnvironmentVariable ?? setWindowsUserEnvironmentVariable;
    setUserEnvironmentVariable("EDITOR", candidate.editor);
    return { platform, editor: candidate.editor, command: "setx EDITOR", persisted: true };
  }
  return { platform, editor: candidate.editor, command: `export EDITOR="${candidate.editor}"`, persisted: false };
}

export function detectEditor(runtime: CliInputRuntime = {}): EditorCandidate {
  const commandExists = runtime.commandExists ?? commandExistsOnPath;
  const candidates: EditorCandidate[] = [
    { executable: "code", editor: "code --wait" },
    { executable: "cursor", editor: "cursor --wait" },
    { executable: "notepad", editor: "notepad" }
  ];
  return candidates.find((candidate) => commandExists(candidate.executable)) ?? candidates.at(-1)!;
}

export function windowsEditorHint(runtime: CliInputRuntime = {}): string | null {
  const platform = runtime.platform ?? process.platform;
  const env = runtime.env ?? process.env;
  if (platform !== "win32" || env.EDITOR) return null;
  return "Windows \u8f93\u5165\u63d0\u793a\uff1a\u957f\u6587\u672c\u8bf7\u7528 /editor \u6216 Ctrl+X E\u3002\u53ef\u8fd0\u884c `opencode-plusplus setup-editor` \u6301\u4e45\u5316 EDITOR\u3002";
}

export function writeClipboardLatest(repo: string, text: string): FileWriteResult {
  const target = path.join(path.resolve(repo), CLIPBOARD_LATEST_PATH);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, text.endsWith("\n") ? text : `${text}\n`, "utf8");
  return { path: target, bytes: Buffer.byteLength(text, "utf8") };
}

export function readClipboardInput(runtime: ClipboardRuntime = {}): string {
  const stdin = runtime.readStdin?.() ?? readPipedStdin();
  if (stdin.trim()) return stdin;
  const clipboard = runtime.readClipboard ?? (() => readSystemClipboard(runtime.platform ?? process.platform));
  return clipboard();
}

export function installClipCommand(repo: string): FileWriteResult {
  const target = path.join(path.resolve(repo), CLIP_COMMAND_PATH);
  const content = renderClipCommand();
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, content, "utf8");
  return { path: target, bytes: Buffer.byteLength(content, "utf8") };
}

export function renderClipCommand(): string {
  return `---
description: Use the latest OpenCode++ clipboard payload
---

# OpenCode++ Clipboard

Read \`.opencode-plusplus/clipboard/latest.md\` and use it as the user's long-form input.

User request:

$ARGUMENTS
`;
}

function commandExistsOnPath(command: string): boolean {
  try {
    if (process.platform === "win32") {
      execFileSync("where", [command], { stdio: "ignore" });
    } else {
      execFileSync("sh", ["-c", 'command -v "$1"', "opencode-plusplus", command], { stdio: "ignore" });
    }
    return true;
  } catch {
    return false;
  }
}

function setWindowsUserEnvironmentVariable(name: string, value: string): void {
  execFileSync("setx", [name, value], { stdio: "ignore" });
}

function readPipedStdin(): string {
  if (process.stdin.isTTY) return "";
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function readSystemClipboard(platform: NodeJS.Platform): string {
  if (platform === "win32") return execFileSync("powershell.exe", ["-NoProfile", "-Command", "Get-Clipboard -Raw"], { encoding: "utf8" });
  if (platform === "darwin") return execFileSync("pbpaste", { encoding: "utf8" });
  return execFileSync("sh", ["-c", "xclip -selection clipboard -o 2>/dev/null || wl-paste 2>/dev/null || xsel --clipboard --output 2>/dev/null"], {
    encoding: "utf8"
  });
}
