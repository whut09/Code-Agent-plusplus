import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ContextPackage, TaskType } from "../core/types.js";
import { buildContextPackage } from "../core/context-builder.js";
import { changedFilesSince, runGit } from "../core/git.js";
import { writeContextPackage } from "./writer.js";
import { renderChangeImpactReport } from "./impact.js";
import { buildLoopControllerReport, renderLoopControllerReport, type LoopControllerReport } from "./loop-controller.js";
import { buildPolicyReport, renderPolicyReport, type PolicyFailOn, type PolicyEngineReport } from "./policy-engine.js";
import { renderTaskVerify } from "./task-harness.js";
import { writeTaskRun, type TaskRunWriteResult } from "./task-run.js";
import { appendExecutionTraceStep, currentWorkingTreeHash } from "./execution-trace.js";
import { bullet, code, heading, table } from "./markdown.js";

export type AgentExecutorName = "codex" | "claude-code" | "opencode" | "mimocode" | "cursor" | "mock";
export type OrchestratorDecision = "finalize" | "repair" | "repack" | "block" | "require-human-review";

export interface HarnessOrchestratorOptions {
  executor?: AgentExecutorName;
  executorCommand?: string;
  agent?: string;
  maxLoops?: number;
  failOn?: PolicyFailOn;
  type?: TaskType;
  tokenBudget?: number;
  base?: string;
  dryRun?: boolean;
}

export interface AgentExecutorInput {
  repo: string;
  task: string;
  prompt: string;
  runDir: string;
  runId: string;
  base: string;
  agent?: string;
  executorCommand?: string;
  dryRun?: boolean;
}

export interface AgentExecutorResult {
  executor: AgentExecutorName;
  exitCode: number | null;
  command?: string;
  eventsPath?: string;
  stdout: string;
  stderr: string;
  changedFiles: string[];
  diffPath?: string;
  startedAt?: string;
  finishedAt?: string;
  stdoutHash?: string;
  stderrHash?: string;
  workingTreeHashBefore?: string;
  workingTreeHashAfter?: string;
}

export interface HarnessOrchestratorReport {
  task: string;
  taskId: string;
  repo: string;
  base: string;
  executor: AgentExecutorName;
  runDir: string;
  traceId: string;
  maxLoops: number;
  dryRun: boolean;
  phases: Array<"plan" | "pack" | "execute" | "collect" | "evaluate" | "decision">;
  executorResult: AgentExecutorResult;
  changedFiles: string[];
  policy: Pick<PolicyEngineReport, "passed" | "failOn" | "summary">;
  loop: Pick<LoopControllerReport, "status" | "risk" | "decisions">;
  decision: {
    action: OrchestratorDecision;
    blocking: boolean;
    confidence: number;
    reason: string;
    nextCommand?: string;
    signals: string[];
  };
  artifacts: {
    contextFiles: string[];
    runFiles: string[];
    orchestratorFiles: string[];
    diffFile?: string;
  };
}

export interface HarnessOrchestratorWriteResult {
  report: HarnessOrchestratorReport;
  files: string[];
}

type AgentExecutor = (input: AgentExecutorInput) => AgentExecutorResult;

export async function runHarnessOrchestrator(repo: string, task: string, options: HarnessOrchestratorOptions = {}): Promise<HarnessOrchestratorWriteResult> {
  const base = options.base ?? "main";
  const executorName = options.executor ?? "mock";
  const root = path.resolve(repo);

  const preContext = await buildContextPackage(root);
  const contextWrite = writeContextPackage(preContext);
  const taskRun = writeTaskRun(preContext, task, { base, type: options.type ?? "auto", tokenBudget: options.tokenBudget });
  const prompt = buildExecutorPrompt(preContext, taskRun, executorName, options);
  const executor = createAgentExecutor(executorName);
  const executorResult = executor({
    repo: root,
    task,
    prompt,
    runDir: taskRun.dir,
    runId: taskRun.runId,
    base,
    agent: options.agent,
    executorCommand: options.executorCommand,
    dryRun: options.dryRun
  });

  appendExecutionTraceStep(root, taskRun.runId, {
    agent: executorName,
    action: "agent-execute",
    files: executorResult.changedFiles,
    command: executorResult.command,
    reason: `${executorName} executor returned exit code ${executorResult.exitCode ?? "unknown"}.`,
    result: executorResult.exitCode === 0 ? "passed" : "failed",
    finalState: executorResult.exitCode === 0 ? "partial_success" : "blocked",
    evidenceSource: executorResult.command ? "command" : "manual",
    capturedBy: executorResult.command ? "repo-context" : "external",
    exitCode: executorResult.exitCode,
    output: summarizeOutput(executorResult.stdout, executorResult.stderr),
    startedAt: executorResult.startedAt,
    finishedAt: executorResult.finishedAt,
    stdoutHash: executorResult.stdoutHash,
    stderrHash: executorResult.stderrHash,
    workingTreeHashBefore: executorResult.workingTreeHashBefore,
    workingTreeHashAfter: executorResult.workingTreeHashAfter
  });

  const postContext = await buildContextPackage(root);
  const changedFiles = collectChangedFiles(root, base);
  const policy = buildPolicyReport(postContext, { base, traceId: taskRun.runId, failOn: options.failOn ?? "required" });
  const verify = renderTaskVerify(postContext, { base, diff: true });
  const loop = buildLoopControllerReport(postContext, task, {
    phase: "after-edit",
    base,
    type: options.type ?? "auto",
    tokenBudget: options.tokenBudget,
    traceId: taskRun.runId
  });
  const decision = decideOrchestratorAction({
    executorResult,
    changedFiles,
    policy,
    loop
  });
  const dir = path.join(root, ".agent-context", "orchestrator", taskRun.runId);
  mkdirSync(dir, { recursive: true });

  const report: HarnessOrchestratorReport = {
    task,
    taskId: taskRun.runId,
    repo: root,
    base,
    executor: executorName,
    runDir: path.relative(root, taskRun.dir).replaceAll("\\", "/"),
    traceId: taskRun.runId,
    maxLoops: options.maxLoops ?? 1,
    dryRun: Boolean(options.dryRun),
    phases: ["plan", "pack", "execute", "collect", "evaluate", "decision"],
    executorResult,
    changedFiles,
    policy: {
      passed: policy.passed,
      failOn: policy.failOn,
      summary: policy.summary
    },
    loop: {
      status: loop.status,
      risk: loop.risk,
      decisions: loop.decisions
    },
    decision,
    artifacts: {
      contextFiles: contextWrite.files.map((file) => path.relative(root, file).replaceAll("\\", "/")),
      runFiles: taskRun.files.map((file) => path.relative(root, file).replaceAll("\\", "/")),
      orchestratorFiles: [],
      diffFile: executorResult.diffPath
    }
  };

  const files = [
    write(path.join(dir, "orchestrator.md"), renderOrchestratorReport(report)),
    write(path.join(dir, "orchestrator.json"), JSON.stringify(report, null, 2)),
    write(path.join(dir, "policy.md"), renderPolicyReport(policy)),
    write(path.join(dir, "impact.md"), renderChangeImpactReport(postContext, { base })),
    write(path.join(dir, "verify.md"), verify),
    write(path.join(dir, "loop.md"), renderLoopControllerReport(loop))
  ];
  report.artifacts.orchestratorFiles = files.map((file) => path.relative(root, file).replaceAll("\\", "/"));
  writeFileSync(path.join(dir, "orchestrator.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

  return { report, files };
}

export function renderOrchestratorReport(report: HarnessOrchestratorReport): string {
  return [
    heading(1, "Harness Orchestrator"),
    "",
    `Task: ${report.task}`,
    `Task id: ${report.taskId}`,
    `Executor: ${report.executor}`,
    `Decision: ${report.decision.action}`,
    `Base: ${report.base}`,
    "",
    heading(2, "Architecture Flow"),
    bullet(
      [
        "Repo-to-Agent-Context plan / pack",
        `Executor: ${report.executor}`,
        "Agent execution",
        "Diff / trace / test evidence collection",
        "Policy / contracts / tests / impact / verify evaluation",
        `Decision: ${report.decision.action}`
      ].map((item) => item)
    ),
    "",
    heading(2, "Decision"),
    table(
      ["Field", "Value"],
      [
        ["Action", report.decision.action],
        ["Blocking", report.decision.blocking ? "yes" : "no"],
        ["Confidence", report.decision.confidence.toFixed(2)],
        ["Reason", report.decision.reason.replace(/\|/g, "\\|")],
        ["Next command", report.decision.nextCommand ? code(report.decision.nextCommand) : "none"]
      ]
    ),
    "",
    heading(2, "Signals"),
    bullet(report.decision.signals),
    "",
    heading(2, "Executor Result"),
    table(
      ["Field", "Value"],
      [
        ["Exit code", String(report.executorResult.exitCode ?? "unknown")],
        ["Command", report.executorResult.command ? code(report.executorResult.command) : "none"],
        ["Events", report.executorResult.eventsPath ? code(report.executorResult.eventsPath) : "none"],
        ["Diff", report.executorResult.diffPath ? code(report.executorResult.diffPath) : "none"]
      ]
    ),
    "",
    heading(2, "Changed Files"),
    bullet(report.changedFiles.map(code)),
    "",
    heading(2, "Policy Summary"),
    table(
      ["Signal", "Count"],
      [
        ["Passed", report.policy.passed ? "yes" : "no"],
        ["Fail on", report.policy.failOn],
        ["Forbidden", String(report.policy.summary.forbidden)],
        ["Required missing", String(report.policy.summary.requiredMissing)],
        ["Risks", String(report.policy.summary.risks)],
        ["Required satisfied", String(report.policy.summary.requiredSatisfied)]
      ]
    ),
    "",
    heading(2, "Loop Decisions"),
    bullet(report.loop.decisions.map((decision) => `${decision.action}: ${decision.reason}`)),
    "",
    heading(2, "Artifacts"),
    bullet(report.artifacts.orchestratorFiles.map(code))
  ].join("\n");
}

function createAgentExecutor(name: AgentExecutorName): AgentExecutor {
  return (input) => {
    if (input.dryRun || name === "mock") return runMockExecutor(name, input);
    if (!input.executorCommand) {
      return {
        executor: name,
        exitCode: 2,
        stdout: "",
        stderr: `No executor command configured for ${name}. Pass --executor-command with placeholders such as {prompt}, {task}, {repo}, and {runDir}.`,
        changedFiles: collectChangedFiles(input.repo, input.base)
      };
    }
    return runShellExecutor(name, input);
  };
}

function runMockExecutor(name: AgentExecutorName, input: AgentExecutorInput): AgentExecutorResult {
  const startedAt = new Date().toISOString();
  const workingTreeHashBefore = currentWorkingTreeHash(input.repo);
  const eventsPath = path.join(input.runDir, "executor.mock.json");
  writeFileSync(
    eventsPath,
    `${JSON.stringify(
      {
        executor: name,
        task: input.task,
        dryRun: true,
        note: "Mock executor does not edit files. It exercises the harness-led orchestration path."
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  const diffPath = writeDiffSnapshot(input.repo, input.runDir, "mock");
  const finishedAt = new Date().toISOString();
  const workingTreeHashAfter = currentWorkingTreeHash(input.repo);
  const stdout = "mock executor completed without editing files";
  const stderr = "";
  return {
    executor: name,
    exitCode: 0,
    eventsPath: path.relative(input.repo, eventsPath).replaceAll("\\", "/"),
    stdout,
    stderr,
    changedFiles: collectChangedFiles(input.repo, input.base),
    diffPath,
    startedAt,
    finishedAt,
    stdoutHash: hashText(stdout),
    stderrHash: hashText(stderr),
    workingTreeHashBefore,
    workingTreeHashAfter
  };
}

function runShellExecutor(name: AgentExecutorName, input: AgentExecutorInput): AgentExecutorResult {
  const command = expandExecutorCommand(input.executorCommand ?? "", input);
  const startedHash = currentWorkingTreeHash(input.repo);
  const startedAt = new Date().toISOString();
  const result = spawnSync(command, {
    cwd: input.repo,
    shell: true,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024
  });
  const finishedAt = new Date().toISOString();
  const finishedHash = currentWorkingTreeHash(input.repo);
  const stdout = typeof result.stdout === "string" ? result.stdout : "";
  const rawStderr = typeof result.stderr === "string" ? result.stderr : "";
  const stderr = result.error ? `${rawStderr}${rawStderr ? "\n" : ""}${result.error.message}` : rawStderr;
  const exitCode = typeof result.status === "number" ? result.status : result.error ? 1 : null;
  const eventsPath = writeExecutorEvents(input.repo, input.runDir, name, {
    command,
    exitCode,
    startedAt,
    finishedAt,
    workingTreeHashBefore: startedHash,
    workingTreeHashAfter: finishedHash,
    stdoutHash: hashText(stdout),
    stderrHash: hashText(stderr)
  });
  const diffPath = writeDiffSnapshot(input.repo, input.runDir, name);

  return {
    executor: name,
    exitCode,
    command,
    eventsPath,
    stdout,
    stderr,
    changedFiles: collectChangedFiles(input.repo, input.base),
    diffPath,
    startedAt,
    finishedAt,
    stdoutHash: hashText(stdout),
    stderrHash: hashText(stderr),
    workingTreeHashBefore: startedHash,
    workingTreeHashAfter: finishedHash
  };
}

function buildExecutorPrompt(
  context: ContextPackage,
  taskRun: TaskRunWriteResult,
  executorName: AgentExecutorName,
  options: HarnessOrchestratorOptions
): string {
  const promptFile = promptFileFor(context.scan.root, taskRun.runId, executorName);
  const basePrompt = existsSync(promptFile)
    ? readFileSync(promptFile, "utf8")
    : [
        `Task: ${taskRun.manifest.task}`,
        `Run directory: ${path.relative(context.scan.root, taskRun.dir).replaceAll("\\", "/")}`,
        "Read plan.md, edit-boundary.md, pack.md, tests.md, impact.md, then make the minimal code change."
      ].join("\n");

  return [
    basePrompt.trim(),
    "",
    "Harness control-plane requirements:",
    "- Repo-to-Agent-Context owns context, boundaries, trace evidence, policy, impact, verify, and final gate decisions.",
    "- The selected code agent owns reading source files, editing code, and running commands.",
    "- Inspect relevant source files before behavior-changing edits.",
    "- Keep changes inside the edit boundary unless the task cannot be completed otherwise.",
    "- Prefer command evidence for tests and verification.",
    `- Executor: ${executorName}`,
    `- Max loops requested: ${options.maxLoops ?? 1}`
  ].join("\n");
}

function promptFileFor(root: string, runId: string, executorName: AgentExecutorName): string {
  const promptName = executorName === "claude-code" ? "prompt.claude.md" : executorName === "cursor" ? "prompt.cursor.md" : "prompt.codex.md";
  return path.join(root, ".agent-context", "runs", runId, promptName);
}

function decideOrchestratorAction(input: {
  executorResult: AgentExecutorResult;
  changedFiles: string[];
  policy: PolicyEngineReport;
  loop: LoopControllerReport;
}): HarnessOrchestratorReport["decision"] {
  if (input.executorResult.exitCode !== 0) {
    return decision("block", true, 0.94, "The selected executor failed before the harness could trust the result.", [
      `executor exit code: ${input.executorResult.exitCode ?? "unknown"}`,
      input.executorResult.stderr ? "executor stderr captured" : "executor stderr empty"
    ]);
  }

  if (input.policy.summary.forbidden > 0) {
    return decision("block", true, 0.96, "Forbidden policy findings were detected in the diff.", [
      `forbidden findings: ${input.policy.summary.forbidden}`,
      `policy fail-on: ${input.policy.failOn}`
    ]);
  }

  const needsContext = input.loop.decisions.find((item) => item.action === "rebuild-context" || item.action === "replan" || item.action === "expand-context");
  if (needsContext) {
    return decision(
      "repack",
      true,
      needsContext.confidence,
      "The next loop needs refreshed or expanded context before continuing.",
      needsContext.signals,
      needsContext.command
    );
  }

  const needsRepair = input.loop.decisions.find(
    (item) => item.action === "repair-contracts" || item.action === "add-or-update-tests" || item.action === "run-tests"
  );
  if (needsRepair || input.policy.summary.requiredMissing > 0) {
    return decision(
      "repair",
      true,
      needsRepair?.confidence ?? 0.88,
      needsRepair?.reason ?? "Required policy evidence is missing.",
      needsRepair?.signals ?? [`required missing: ${input.policy.summary.requiredMissing}`],
      needsRepair?.command
    );
  }

  if (input.loop.risk === "High" || input.policy.summary.risks > 0) {
    return decision("require-human-review", true, 0.82, "The diff has high-impact or risk policy signals even though hard gates passed.", [
      `impact risk: ${input.loop.risk}`,
      `policy risks: ${input.policy.summary.risks}`
    ]);
  }

  return decision("finalize", false, input.changedFiles.length ? 0.8 : 0.72, "No blocking policy, context, impact, or verification signals remain.", [
    `changed files: ${input.changedFiles.length}`,
    `loop status: ${input.loop.status}`,
    "policy: passed"
  ]);
}

function decision(
  action: OrchestratorDecision,
  blocking: boolean,
  confidence: number,
  reason: string,
  signals: string[],
  nextCommand?: string
): HarnessOrchestratorReport["decision"] {
  return {
    action,
    blocking,
    confidence: Math.round(Math.max(0, Math.min(1, confidence)) * 100) / 100,
    reason,
    nextCommand,
    signals: signals.filter(Boolean)
  };
}

function expandExecutorCommand(command: string, input: AgentExecutorInput): string {
  const promptFile = path.join(input.runDir, "executor-prompt.md");
  writeFileSync(promptFile, `${input.prompt.trim()}\n`, "utf8");
  const replacements: Record<string, string> = {
    "{prompt}": quote(promptFile),
    "{task}": quote(input.task),
    "{repo}": quote(input.repo),
    "{runDir}": quote(input.runDir),
    "{agent}": quote(input.agent ?? "")
  };
  let expanded = command;
  for (const [token, value] of Object.entries(replacements)) expanded = expanded.replaceAll(token, value);
  return expanded;
}

function writeExecutorEvents(root: string, runDir: string, executor: AgentExecutorName, event: Record<string, string | number | null>): string {
  const filePath = path.join(runDir, `executor.${executor}.json`);
  writeFileSync(filePath, `${JSON.stringify({ executor, ...event }, null, 2)}\n`, "utf8");
  return path.relative(root, filePath).replaceAll("\\", "/");
}

function writeDiffSnapshot(root: string, runDir: string, executor: AgentExecutorName): string {
  const filePath = path.join(runDir, `diff.${executor}.patch`);
  let diff = "";
  try {
    diff = runGit(root, ["diff", "--binary"]);
  } catch (error) {
    diff = `Unable to capture diff: ${error instanceof Error ? error.message : String(error)}\n`;
  }
  writeFileSync(filePath, diff, "utf8");
  return path.relative(root, filePath).replaceAll("\\", "/");
}

function collectChangedFiles(root: string, base: string): string[] {
  const files = new Set<string>();
  try {
    for (const file of changedFilesSince(root, base)) files.add(file);
  } catch {
    // Status-only collection below still captures useful local evidence.
  }
  try {
    for (const line of runGit(root, ["status", "--porcelain", "--untracked-files=all"]).split(/\r?\n/)) {
      if (line.length <= 3) continue;
      const file = line.slice(3).trim().replace(/\\/g, "/").split(" -> ").pop();
      if (file) files.add(file);
    }
  } catch {
    return [...files].sort();
  }
  return [...files].sort();
}

function write(filePath: string, content: string): string {
  writeFileSync(filePath, `${content.trim()}\n`, "utf8");
  return filePath;
}

function quote(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
}

function summarizeOutput(stdout: string, stderr: string): string {
  const combined = [stdout.trim(), stderr.trim()].filter(Boolean).join("\n--- stderr ---\n");
  if (!combined) return "";
  return combined.length > 2000 ? `${combined.slice(0, 2000)}\n... truncated ...` : combined;
}

function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
