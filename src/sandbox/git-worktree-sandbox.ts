import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { runGit } from "../core/git.js";
import { runSafeCommand, runSafeCommandStreaming } from "../core/safe-command.js";
import type { ExecResult, SandboxAdapter, SandboxExecuteOptions, SandboxHandle } from "./sandbox-adapter.js";

export class GitWorktreeSandboxAdapter implements SandboxAdapter {
  private handle?: SandboxHandle;

  async prepare(runId: string, repo: string): Promise<SandboxHandle> {
    const gatewayDir = path.join(repo, ".agent-context", "worktrees", safeSegment(runId));
    const root = path.join(gatewayDir, "worktree");
    rmSync(gatewayDir, { recursive: true, force: true });
    mkdirSync(gatewayDir, { recursive: true });
    runGit(repo, ["worktree", "add", "--detach", root, "HEAD"]);

    const initialPatch = initialSourcePatch(repo);
    if (initialPatch.trim()) {
      const patchFile = path.join(gatewayDir, "initial.patch");
      writeFileSync(patchFile, initialPatch, "utf8");
      try {
        runGit(root, ["apply", "--whitespace=nowarn", patchFile]);
      } catch (error) {
        throw new Error(`Unable to apply current source diff to sandbox gateway: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const manifestPath = path.join(gatewayDir, "manifest.json");
    const patchPath = path.join(gatewayDir, "diff.patch");
    this.handle = {
      mode: "git-worktree",
      runId,
      hostRepo: repo,
      root,
      createdAt: new Date().toISOString(),
      initialPatch: initialPatch.trim() ? initialPatch : undefined,
      gatewayDir,
      manifestPath,
      patchPath,
      applyCommand: `git apply ${quotePath(path.relative(repo, patchPath).replaceAll("\\", "/"))}`
    };
    writeManifest(this.handle, "prepared");
    return this.handle;
  }

  async execute(command: string, options: SandboxExecuteOptions = {}): Promise<ExecResult> {
    const handle = this.requireHandle();
    const commandOptions = {
      cwd: handle.root,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      onStdout: options.onStdout,
      onStderr: options.onStderr
    } as const;
    return options.onStdout || options.onStderr ? runSafeCommandStreaming(command, commandOptions) : runSafeCommand(command, commandOptions);
  }

  async diff(): Promise<string> {
    const handle = this.requireHandle();
    markUntrackedForDiff(handle.root);
    const diff = runGit(handle.root, ["diff", "--binary", "--", ".", ":(exclude).agent-context/**", ":(exclude)AGENTS.md"]);
    writePatch(handle, diff);
    return diff;
  }

  async changedFiles(): Promise<string[]> {
    const handle = this.requireHandle();
    const files = new Set<string>();
    for (const line of runGit(handle.root, ["diff", "--name-only"]).split(/\r?\n/)) {
      const file = line.trim().replace(/\\/g, "/");
      if (file) files.add(file);
    }
    for (const line of runGit(handle.root, ["ls-files", "--others", "--exclude-standard"]).split(/\r?\n/)) {
      const file = line.trim().replace(/\\/g, "/");
      if (file) files.add(file);
    }
    return [...files].sort();
  }

  async discard(): Promise<void> {
    const handle = this.handle;
    if (!handle) return;
    const gatewayDir = requireGatewayDir(handle);
    const resolvedRoot = path.resolve(handle.root);
    const resolvedGateway = path.resolve(gatewayDir);
    if (!isInside(resolvedRoot, resolvedGateway)) {
      throw new Error(`Refusing to remove sandbox outside gateway: ${resolvedRoot}`);
    }
    try {
      runGit(handle.hostRepo, ["worktree", "remove", "--force", handle.root]);
    } catch {
      rmSync(handle.root, { recursive: true, force: true });
    }
    writeManifest(handle, "discarded");
    this.handle = undefined;
  }

  async exportPatch(): Promise<string> {
    return this.diff();
  }

  private requireHandle(): SandboxHandle {
    if (!this.handle) throw new Error("Sandbox gateway has not been prepared.");
    return this.handle;
  }
}

function initialSourcePatch(repo: string): string {
  try {
    return runGit(repo, ["diff", "--binary", "--", ".", ":(exclude).agent-context/**", ":(exclude)AGENTS.md"]);
  } catch {
    return "";
  }
}

function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80) || "run";
}

function isInside(child: string, parent: string): boolean {
  const relative = path.relative(parent, child);
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function markUntrackedForDiff(root: string): void {
  const files = runGit(root, ["ls-files", "--others", "--exclude-standard"])
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\\/g, "/"))
    .filter((file) => file && !file.startsWith(".agent-context/") && file !== "AGENTS.md");
  if (!files.length) return;
  runGit(root, ["add", "-N", "--", ...files]);
}

function writePatch(handle: SandboxHandle, diff: string): void {
  if (!handle.patchPath) return;
  writeFileSync(handle.patchPath, diff, "utf8");
  writeManifest(handle, "patch-exported");
}

function writeManifest(handle: SandboxHandle, status: "prepared" | "patch-exported" | "discarded"): void {
  if (!handle.manifestPath) return;
  const gatewayDir = requireGatewayDir(handle);
  mkdirSync(gatewayDir, { recursive: true });
  const patchRelative = handle.patchPath ? path.relative(handle.hostRepo, handle.patchPath).replaceAll("\\", "/") : undefined;
  const manifest = {
    schemaVersion: "opencode-plusplus.sandbox-gateway.v1",
    kind: "sandbox-gateway",
    status,
    runId: handle.runId,
    mode: handle.mode,
    hostRepo: handle.hostRepo,
    gatewayDir: path.relative(handle.hostRepo, gatewayDir).replaceAll("\\", "/"),
    worktreeRoot: path.relative(handle.hostRepo, handle.root).replaceAll("\\", "/"),
    patch: patchRelative,
    applyCommand: handle.applyCommand,
    createdAt: handle.createdAt,
    updatedAt: new Date().toISOString(),
    initialPatch: Boolean(handle.initialPatch)
  };
  writeFileSync(handle.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function requireGatewayDir(handle: SandboxHandle): string {
  if (!handle.gatewayDir) throw new Error("Sandbox gateway directory is missing.");
  return handle.gatewayDir;
}

function quotePath(value: string): string {
  return /[\s"'`$]/.test(value) ? JSON.stringify(value) : value;
}
