import type { Command } from "commander";
import {
  checkOpencodeSidecarCommand,
  recordOpencodeSidecarTool,
  renderOpencodeSidecarCommandCheck,
  renderOpencodeSidecarToolRecord,
  renderOpencodeSidecarVerifyReport,
  verifyOpencodeSidecar,
  writeOpencodeSidecarLatest
} from "../../integrations/opencode/sidecar.js";
import { parseNullableInteger } from "../parsers/options.js";

export function registerSidecarCommands(program: Command): void {
  const sidecar = program.command("sidecar").description("Inspect and verify OpenCode++ sidecar integrations.");

  sidecar
    .command("verify")
    .argument("[repo]", "repository path", ".")
    .option("--json", "print machine-readable sidecar verification report")
    .option("--quiet", "write latest artifacts and only print when blocked")
    .description("Verify the OpenCode sidecar plugin and event log readiness.")
    .action(async (repo: string, options: { json?: boolean; quiet?: boolean }) => {
      const result = await verifyOpencodeSidecar(repo);
      writeOpencodeSidecarLatest(result);
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else if (!options.quiet || !result.ok) {
        console.log(renderOpencodeSidecarVerifyReport(result));
      }
      if (!result.ok) process.exitCode = 1;
    });

  sidecar
    .command("check-command")
    .argument("[repo]", "repository path", ".")
    .requiredOption("--command <command>", "command the coding agent is about to execute")
    .option("--path <path...>", "path(s) the coding agent is about to edit or touch")
    .option("--json", "print machine-readable command guard result")
    .description("Preflight-check a command or edit path before OpenCode executes it.")
    .action((repo: string, options: { command: string; path?: string[]; json?: boolean }) => {
      const result = checkOpencodeSidecarCommand(repo, { command: options.command, paths: options.path });
      console.log(options.json ? JSON.stringify(result, null, 2) : renderOpencodeSidecarCommandCheck(result));
      if (!result.allowed) process.exitCode = 1;
    });

  sidecar
    .command("record-tool")
    .argument("[repo]", "repository path", ".")
    .requiredOption("--tool <tool>", "OpenCode tool name that just executed")
    .option("--command <command>", "command executed by the tool")
    .option("--exit-code <code>", "tool or command exit code", parseNullableInteger)
    .option("--started-at <iso>", "tool start timestamp")
    .option("--finished-at <iso>", "tool finish timestamp")
    .option("--stdout <text>", "captured stdout text")
    .option("--stderr <text>", "captured stderr text")
    .option("--stdout-hash <sha256>", "stdout content hash")
    .option("--stderr-hash <sha256>", "stderr content hash")
    .option("--working-tree-hash-before <sha256>", "working tree hash before tool execution")
    .option("--working-tree-hash-after <sha256>", "working tree hash after tool execution")
    .option("--session-id <id>", "OpenCode session id")
    .option("--path <path...>", "path(s) touched by the tool")
    .option("--json", "print machine-readable tool record result")
    .description("Record OpenCode tool.execute.after evidence into sidecar event logs and execution traces.")
    .action(
      (
        repo: string,
        options: {
          tool: string;
          command?: string;
          exitCode?: number | null;
          startedAt?: string;
          finishedAt?: string;
          stdout?: string;
          stderr?: string;
          stdoutHash?: string;
          stderrHash?: string;
          workingTreeHashBefore?: string;
          workingTreeHashAfter?: string;
          sessionId?: string;
          path?: string[];
          json?: boolean;
        }
      ) => {
        const result = recordOpencodeSidecarTool(repo, {
          tool: options.tool,
          command: options.command,
          exitCode: options.exitCode,
          startedAt: options.startedAt,
          finishedAt: options.finishedAt,
          stdout: options.stdout,
          stderr: options.stderr,
          stdoutHash: options.stdoutHash,
          stderrHash: options.stderrHash,
          workingTreeHashBefore: options.workingTreeHashBefore,
          workingTreeHashAfter: options.workingTreeHashAfter,
          sessionId: options.sessionId,
          paths: options.path
        });
        console.log(options.json ? JSON.stringify(result, null, 2) : renderOpencodeSidecarToolRecord(result));
      }
    );
}
