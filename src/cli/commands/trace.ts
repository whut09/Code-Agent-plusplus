import path from "node:path";
import type { Command } from "commander";
import {
  appendExecutionTraceStep,
  executionTracePath,
  readExecutionTrace,
  renderExecutionTrace,
  runTraceCommand,
  startExecutionTrace,
  type ExecutionEvidenceSource,
  type ExecutionFinalState,
  type ExecutionStepResult
} from "../../harness/observability/execution-trace.js";
import { resolveTaskArguments } from "../task-args.js";
import { parseEvidenceSource, parseNonNegativeInteger, parseTraceFinalState, parseTraceResult, splitCsv } from "../parsers/options.js";

export function registerTraceCommands(program: Command): void {
  const trace = program.command("trace").description("Record and inspect structured agent execution traces.");

  trace
    .command("start")
    .argument("<args...>", "task description and optional repository path")
    .option("--repo <repo...>", "repository path; accepts multiple words when the path contains spaces or non-ASCII characters")
    .option("--agent <agent>", "agent name, for example codex, claude, cursor")
    .option("--id <id>", "trace id; defaults to a task slug")
    .option("--json", "print machine-readable execution trace")
    .description("Create .agent-context/traces/<trace-id>.json for a task.")
    .action((args: string[], options: { repo?: string | string[]; agent?: string; id?: string; json?: boolean }) => {
      const { task, repo } = resolveTaskArguments(args, options.repo);
      const root = path.resolve(repo);
      const item = startExecutionTrace(root, task, { id: options.id, agent: options.agent });
      console.log(options.json ? JSON.stringify(item, null, 2) : renderExecutionTrace(item));
      console.log(`Trace file: ${path.relative(root, executionTracePath(root, item.id)).replaceAll("\\", "/")}`);
    });

  trace
    .command("add")
    .argument("<traceId>", "trace id")
    .argument("[repo]", "repository path", ".")
    .requiredOption("--action <action>", "step action, for example edit, run-test, verify, repair")
    .option("--agent <agent>", "agent name")
    .option("--files <files>", "comma-separated files touched by this step")
    .option("--reason <reason>", "why the step was taken")
    .option("--command <command>", "command that was run")
    .option("--test <test>", "test file or test target")
    .option("--result <result>", "result: passed, failed, skipped, unknown", parseTraceResult)
    .option("--output <output>", "short command output or observation")
    .option("--evidence-source <source>", "evidence source: manual, command, ci", parseEvidenceSource, "manual")
    .option("--exit-code <code>", "command or CI exit code", parseNonNegativeInteger)
    .option("--started-at <iso>", "command or CI start timestamp")
    .option("--finished-at <iso>", "command or CI finish timestamp")
    .option("--stdout-hash <sha256>", "stdout content hash")
    .option("--stderr-hash <sha256>", "stderr content hash")
    .option("--working-tree-hash-before <sha256>", "working tree hash before command")
    .option("--working-tree-hash-after <sha256>", "working tree hash after command")
    .option("--final-state <state>", "final state: planned, in_progress, partial_success, success, failed, blocked", parseTraceFinalState)
    .option("--json", "print machine-readable execution trace")
    .description("Append one structured step to an execution trace.")
    .action(
      (
        traceId: string,
        repo: string,
        options: {
          action: string;
          agent?: string;
          files?: string;
          reason?: string;
          command?: string;
          test?: string;
          result?: ExecutionStepResult;
          output?: string;
          evidenceSource: ExecutionEvidenceSource;
          exitCode?: number;
          startedAt?: string;
          finishedAt?: string;
          stdoutHash?: string;
          stderrHash?: string;
          workingTreeHashBefore?: string;
          workingTreeHashAfter?: string;
          finalState?: ExecutionFinalState;
          json?: boolean;
        }
      ) => {
        const root = path.resolve(repo);
        const item = appendExecutionTraceStep(root, traceId, {
          action: options.action,
          agent: options.agent,
          files: splitCsv(options.files),
          reason: options.reason,
          command: options.command,
          test: options.test,
          result: options.result,
          output: options.output,
          evidenceSource: options.evidenceSource,
          exitCode: options.exitCode,
          startedAt: options.startedAt,
          finishedAt: options.finishedAt,
          stdoutHash: options.stdoutHash,
          stderrHash: options.stderrHash,
          workingTreeHashBefore: options.workingTreeHashBefore,
          workingTreeHashAfter: options.workingTreeHashAfter,
          finalState: options.finalState
        });
        console.log(options.json ? JSON.stringify(item, null, 2) : renderExecutionTrace(item));
      }
    );

  trace
    .command("run")
    .argument("<traceId>", "trace id")
    .argument("[repo]", "repository path", ".")
    .requiredOption("--command <command>", "command to execute and record as harness-captured evidence")
    .option("--action <action>", "step action, for example run-test, verify, validate-contracts", "run-test")
    .option("--agent <agent>", "agent name")
    .option("--files <files>", "comma-separated files touched or verified by this command")
    .option("--reason <reason>", "why the command was run")
    .option("--test <test>", "test file or test target")
    .option("--final-state <state>", "final state: planned, in_progress, partial_success, success, failed, blocked", parseTraceFinalState)
    .option("--json", "print machine-readable execution trace plus command output")
    .description("Run a command through the harness and append command evidence to an execution trace.")
    .action(
      (
        traceId: string,
        repo: string,
        options: {
          command: string;
          action: string;
          agent?: string;
          files?: string;
          reason?: string;
          test?: string;
          finalState?: ExecutionFinalState;
          json?: boolean;
        }
      ) => {
        const root = path.resolve(repo);
        const result = runTraceCommand(root, traceId, {
          action: options.action,
          agent: options.agent,
          command: options.command,
          files: splitCsv(options.files),
          reason: options.reason,
          test: options.test,
          finalState: options.finalState
        });
        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(renderExecutionTrace(result.trace));
        }
        if (result.exitCode !== 0) process.exitCode = result.exitCode ?? 1;
      }
    );

  trace
    .command("show")
    .argument("<traceId>", "trace id")
    .argument("[repo]", "repository path", ".")
    .option("--json", "print machine-readable execution trace")
    .description("Show a structured execution trace.")
    .action((traceId: string, repo: string, options: { json?: boolean }) => {
      const root = path.resolve(repo);
      const item = readExecutionTrace(root, traceId);
      if (!item) {
        console.error(`Execution trace not found: ${traceId}`);
        process.exitCode = 1;
        return;
      }
      console.log(options.json ? JSON.stringify(item, null, 2) : renderExecutionTrace(item));
    });
}
