import type { Command } from "commander";
import { readFileSync } from "node:fs";
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
    .option("--tool <tool>", "OpenCode tool name that just executed")
    .option("--command <command>", "command executed by the tool")
    .option("--exit-code <code>", "tool or command exit code", parseNullableInteger)
    .option("--started-at <iso>", "tool start timestamp")
    .option("--finished-at <iso>", "tool finish timestamp")
    .option("--stdout <text>", "captured stdout text")
    .option("--stderr <text>", "captured stderr text")
    .option("--stdout-hash <sha256>", "stdout content hash")
    .option("--stderr-hash <sha256>", "stderr content hash")
    .option("--stdout-preview <text>", "sanitized stdout preview")
    .option("--stderr-preview <text>", "sanitized stderr preview")
    .option("--stdout-truncated", "stdout preview was truncated")
    .option("--stderr-truncated", "stderr preview was truncated")
    .option("--stdout-redacted", "stdout preview was redacted")
    .option("--stderr-redacted", "stderr preview was redacted")
    .option("--working-tree-hash-before <sha256>", "working tree hash before tool execution")
    .option("--working-tree-hash-after <sha256>", "working tree hash after tool execution")
    .option("--session-id <id>", "OpenCode session id")
    .option("--path <path...>", "path(s) touched by the tool")
    .option("--input-json <path>", "JSON evidence payload path produced by the OpenCode++ sidecar plugin")
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
          stdoutPreview?: string;
          stderrPreview?: string;
          stdoutTruncated?: boolean;
          stderrTruncated?: boolean;
          stdoutRedacted?: boolean;
          stderrRedacted?: boolean;
          workingTreeHashBefore?: string;
          workingTreeHashAfter?: string;
          sessionId?: string;
          path?: string[];
          inputJson?: string;
          json?: boolean;
        }
      ) => {
        const payload = readRecordToolInput(options.inputJson);
        const result = recordOpencodeSidecarTool(repo, {
          ...payload,
          tool: options.tool ?? payload.tool,
          command: options.command ?? payload.command,
          exitCode: options.exitCode ?? payload.exitCode,
          startedAt: options.startedAt ?? payload.startedAt,
          finishedAt: options.finishedAt ?? payload.finishedAt,
          stdout: options.stdout ?? payload.stdout,
          stderr: options.stderr ?? payload.stderr,
          stdoutHash: options.stdoutHash ?? payload.stdoutHash,
          stderrHash: options.stderrHash ?? payload.stderrHash,
          stdoutPreview: options.stdoutPreview ?? payload.stdoutPreview,
          stderrPreview: options.stderrPreview ?? payload.stderrPreview,
          stdoutTruncated: options.stdoutTruncated ?? payload.stdoutTruncated,
          stderrTruncated: options.stderrTruncated ?? payload.stderrTruncated,
          stdoutRedacted: options.stdoutRedacted ?? payload.stdoutRedacted,
          stderrRedacted: options.stderrRedacted ?? payload.stderrRedacted,
          workingTreeHashBefore: options.workingTreeHashBefore ?? payload.workingTreeHashBefore,
          workingTreeHashAfter: options.workingTreeHashAfter ?? payload.workingTreeHashAfter,
          sessionId: options.sessionId ?? payload.sessionId,
          paths: options.path ?? payload.paths
        });
        console.log(options.json ? JSON.stringify(result, null, 2) : renderOpencodeSidecarToolRecord(result));
      }
    );
}

function readRecordToolInput(inputJson?: string): RecordToolInputPayload {
  if (!inputJson) return {};
  const parsed = JSON.parse(readFileSync(inputJson, "utf8")) as Record<string, unknown>;
  return {
    tool: stringValue(parsed.tool),
    command: stringValue(parsed.command),
    exitCode: numberOrNull(parsed.exitCode),
    startedAt: stringValue(parsed.startedAt),
    finishedAt: stringValue(parsed.finishedAt),
    stdout: stringValue(parsed.stdout),
    stderr: stringValue(parsed.stderr),
    stdoutHash: stringValue(parsed.stdoutHash),
    stderrHash: stringValue(parsed.stderrHash),
    stdoutPreview: stringValue(parsed.stdoutPreview),
    stderrPreview: stringValue(parsed.stderrPreview),
    stdoutTruncated: booleanValue(parsed.stdoutTruncated),
    stderrTruncated: booleanValue(parsed.stderrTruncated),
    stdoutRedacted: booleanValue(parsed.stdoutRedacted),
    stderrRedacted: booleanValue(parsed.stderrRedacted),
    workingTreeHashBefore: stringValue(parsed.workingTreeHashBefore),
    workingTreeHashAfter: stringValue(parsed.workingTreeHashAfter),
    sessionId: stringValue(parsed.sessionId),
    paths: Array.isArray(parsed.paths) ? parsed.paths.filter((item): item is string => typeof item === "string") : undefined
  };
}

interface RecordToolInputPayload {
  tool?: string;
  command?: string;
  exitCode?: number | null;
  startedAt?: string;
  finishedAt?: string;
  stdout?: string;
  stderr?: string;
  stdoutHash?: string;
  stderrHash?: string;
  stdoutPreview?: string;
  stderrPreview?: string;
  stdoutTruncated?: boolean;
  stderrTruncated?: boolean;
  stdoutRedacted?: boolean;
  stderrRedacted?: boolean;
  workingTreeHashBefore?: string;
  workingTreeHashAfter?: string;
  sessionId?: string;
  paths?: string[];
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function numberOrNull(value: unknown): number | null | undefined {
  if (typeof value === "number") return value;
  if (value === null) return null;
  return undefined;
}
