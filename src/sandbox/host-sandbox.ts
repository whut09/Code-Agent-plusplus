import { runGit } from "../core/git.js";
import { runSafeCommand } from "../core/safe-command.js";
import type { ExecResult, SandboxAdapter, SandboxHandle } from "./sandbox-adapter.js";

export class HostSandboxAdapter implements SandboxAdapter {
  private handle?: SandboxHandle;

  async prepare(runId: string, repo: string): Promise<SandboxHandle> {
    this.handle = {
      mode: "host",
      runId,
      hostRepo: repo,
      root: repo,
      createdAt: new Date().toISOString()
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
    return runGit(this.requireHandle().root, ["diff", "--binary", "--", ".", ":(exclude).agent-context/**", ":(exclude)AGENTS.md"]);
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
    // Host mode intentionally keeps the caller's working tree untouched.
  }

  async exportPatch(): Promise<string> {
    return this.diff();
  }

  private requireHandle(): SandboxHandle {
    if (!this.handle) throw new Error("Sandbox has not been prepared.");
    return this.handle;
  }
}
