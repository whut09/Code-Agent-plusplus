import { spawnSync } from "node:child_process";
import { runCommandGuard } from "./command-guard.js";
import { createSidecarRecorder, type OpenCodeSidecarRuntimeContext } from "./events.js";
import { exitCodeFromOutput, outputText, toolKey } from "./evidence.js";
import { createIdleVerifier } from "./idle-verify.js";
import { commandFromTool, pathsFromTool } from "./paths.js";
import { currentSidecarWorkingTreeHash } from "./worktree-hash.js";

export async function OpenCodePlusPlusSidecar(context: OpenCodeSidecarRuntimeContext): Promise<Record<string, unknown>> {
  return createOpenCodePlusPlusSidecar(context);
}

export async function createOpenCodePlusPlusSidecar(context: OpenCodeSidecarRuntimeContext): Promise<Record<string, unknown>> {
  const recorder = createSidecarRecorder(context);
  const idle = createIdleVerifier(context.directory, recorder);
  const toolStarts = new Map<string, { startedAt: string; workingTreeHashBefore: string }>();

  function rememberToolStart(tool: unknown, args: unknown): void {
    toolStarts.set(toolKey(tool, args), {
      startedAt: new Date().toISOString(),
      workingTreeHashBefore: currentSidecarWorkingTreeHash(context.directory)
    });
  }

  function recordToolAfter(input: unknown, output: unknown): void {
    try {
      const inputRecord = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
      const outputRecord = output && typeof output === "object" ? (output as Record<string, unknown>) : {};
      const tool = inputRecord.tool ?? inputRecord.name ?? "unknown";
      const args = inputRecord.args ?? inputRecord.arguments ?? {};
      const command = commandFromTool(tool, args);
      const paths = pathsFromTool(args);
      const key = toolKey(tool, args);
      const started = toolStarts.get(key) ?? {
        startedAt: new Date().toISOString(),
        workingTreeHashBefore: currentSidecarWorkingTreeHash(context.directory)
      };
      toolStarts.delete(key);

      const cliArgs = [
        "sidecar",
        "record-tool",
        context.directory,
        "--json",
        "--tool",
        String(tool),
        "--exit-code",
        String(exitCodeFromOutput(output) ?? 0),
        "--started-at",
        started.startedAt,
        "--finished-at",
        new Date().toISOString(),
        "--working-tree-hash-before",
        started.workingTreeHashBefore,
        "--working-tree-hash-after",
        currentSidecarWorkingTreeHash(context.directory)
      ];
      if (command) cliArgs.push("--command", command);
      const sessionId = inputRecord.sessionID ?? inputRecord.sessionId ?? outputRecord.sessionID ?? outputRecord.sessionId;
      if (sessionId) cliArgs.push("--session-id", String(sessionId));
      const stdout = outputText(output, ["stdout", "output", "text"]);
      const stderr = outputText(output, ["stderr", "error"]);
      if (stdout) cliArgs.push("--stdout", stdout);
      if (stderr) cliArgs.push("--stderr", stderr);
      for (const file of paths) cliArgs.push("--path", file);

      const recordResult = spawnSync("opencode-plusplus", cliArgs, {
        cwd: context.directory,
        encoding: "utf8",
        shell: process.platform === "win32",
        maxBuffer: 10 * 1024 * 1024
      });
      recorder.record("sidecar.record-tool", { tool, command, paths, exitCode: recordResult.status ?? 1 });
      if ((recordResult.status ?? 1) !== 0) {
        recorder.log("debug", "tool evidence record failed", { tool, command, status: recordResult.status ?? 1 });
      }
    } catch (error) {
      recorder.log("debug", "tool evidence record failed", { message: error instanceof Error ? error.message : String(error) });
    }
  }

  return {
    name: "opencode-plusplus-sidecar",
    "tool.execute.before": async ({ tool, args }: { tool: unknown; args: unknown }) => {
      rememberToolStart(tool, args);
      runCommandGuard(context.directory, recorder, tool, args);
    },
    "tool.execute.after": async (input: unknown, output: unknown) => {
      recordToolAfter(input, output);
    },
    event: async ({ event }: { event?: Record<string, unknown> }) => {
      const eventRecord = event ?? {};
      const type = eventRecord.type;
      if (type === "session.created") {
        recorder.record("session.created");
        recorder.log("debug", "sidecar active", { directory: context.directory, worktree: context.worktree });
      }

      if (type === "file.edited") {
        const properties = eventRecord.properties && typeof eventRecord.properties === "object" ? (eventRecord.properties as Record<string, unknown>) : {};
        const file = properties.file ?? properties.path ?? eventRecord.file ?? eventRecord.path ?? "unknown";
        idle.markDirty("file.edited", { file });
      }

      if (type === "file.watcher.updated") {
        const properties = eventRecord.properties && typeof eventRecord.properties === "object" ? (eventRecord.properties as Record<string, unknown>) : {};
        const file = properties.file ?? properties.path ?? eventRecord.file ?? eventRecord.path ?? "unknown";
        idle.markDirty("file.watcher.updated", { file });
      }

      if (type === "session.idle") {
        recorder.record("session.idle");
        idle.maybeVerifyOnIdle();
      }
    }
  };
}
