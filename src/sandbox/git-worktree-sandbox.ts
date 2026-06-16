import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { runGit } from "../core/git.js";
import { runSafeCommand } from "../core/safe-command.js";
import type { ExecResult, SandboxAdapter, SandboxHandle } from "./sandbox-adapter.js";

export class GitWorktreeSandboxAdapter implements SandboxAdapter {
  private handle?: SandboxHandle;
  private tempBase = path.join(tmpdir(), "code-agent-plusplus");

  async prepare(runId: string, repo: string): Promise<SandboxHandle> {
    mkdirSync(this.tempBase, { recursive: true });
    const root = path.join(this.tempBase, `${safeSegment(runId)}-${Date.now()}`);
    runGit(repo, ["worktree", "add", "--detach", root, "HEAD"]);

    const initialPatch = initialSourcePatch(repo);
    if (initialPatch.trim()) {
      const patchFile = path.join(root, ".code-agent-plusplus-initial.patch");
      writeFileSync(patchFile, initialPatch, "utf8");
      try {
        runGit(root, ["apply", "--whitespace=nowarn", patchFile]);
      } catch (error) {
        throw new Error(`Unable to apply current source diff to sandbox: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        rmSync(patchFile, { force: true });
      }
    }

    this.handle = {
      mode: "git-worktree",
      runId,
      hostRepo: repo,
      root,
      createdAt: new Date().toISOString(),
      initialPatch: initialPatch.trim() ? initialPatch : undefined
    };
    return this.handle;
  }

  async execute(command: string): Promise<ExecResult> {
    const handle = this.requireHandle();
    return runSafeCommand(command, {
      cwd: handle.root,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024
    });
  }

  async diff(): Promise<string> {
    const root = this.requireHandle().root;
    markUntrackedForDiff(root);
    return runGit(root, ["diff", "--binary", "--", ".", ":(exclude).agent-context/**", ":(exclude)AGENTS.md"]);
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
    const resolvedRoot = path.resolve(handle.root);
    const resolvedBase = path.resolve(this.tempBase);
    if (!isInside(resolvedRoot, resolvedBase)) {
      throw new Error(`Refusing to remove sandbox outside temp base: ${resolvedRoot}`);
    }
    try {
      runGit(handle.hostRepo, ["worktree", "remove", "--force", handle.root]);
    } catch {
      rmSync(handle.root, { recursive: true, force: true });
    }
    this.handle = undefined;
  }

  async exportPatch(): Promise<string> {
    return this.diff();
  }

  private requireHandle(): SandboxHandle {
    if (!this.handle) throw new Error("Sandbox has not been prepared.");
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
