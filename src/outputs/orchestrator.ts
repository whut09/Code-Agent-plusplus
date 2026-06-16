import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ContextPackage, TaskType } from "../core/types.js";
import { buildContextPackage } from "../core/context-builder.js";
import { changedFilesSince, runGit } from "../core/git.js";
import { runSafeCommand, shellQuote } from "../core/safe-command.js";
import { normalizeAgentEvents, type AgentEvent } from "./agent-events.js";
import { writeContextPackage } from "./writer.js";
import { buildHallucinationReport, renderHallucinationReport, writeHallucinationReport, type HallucinationGuardReport } from "./hallucination-guard.js";
import { renderChangeImpactReport } from "./impact.js";
import { buildRegressionReport, renderRegressionReport, writeRegressionReport, type RegressionGuardReport } from "./regression-guard.js";
import { buildLoopControllerReport, renderLoopControllerReport, type LoopControllerReport } from "./loop-controller.js";
import { buildPolicyReport, renderPolicyReport, type PolicyFailOn, type PolicyEngineReport } from "./policy-engine.js";
import { renderTaskVerify } from "./task-harness.js";
import { writeTaskRun, type TaskRunWriteResult } from "./task-run.js";
import { appendExecutionTraceStep, currentWorkingTreeHash, readExecutionTrace } from "./execution-trace.js";
import { buildGuardFindingsArtifact, type GuardFindingsArtifact } from "./guard-finding.js";
import { bullet, code, heading, table } from "./markdown.js";

export type AgentExecutorName = "codex" | "claude-code" | "opencode" | "mimocode" | "cursor" | "mock";
export type OrchestratorDecision = "finalize" | "repair" | "repack" | "block" | "rollback" | "require-human-review";
export type OrchestratorCheckpointMode = "none" | "git-worktree";

export const ORCHESTRATOR_DECISION_PRIORITY: Record<OrchestratorDecision, number> = {
  rollback: 100,
  block: 90,
  repack: 80,
  repair: 70,
  "require-human-review": 60,
  finalize: 10
};

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
  checkpoint?: OrchestratorCheckpointMode;
  opencodeTranscript?: string;
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
  normalizedEventsPath?: string;
  normalizedEventsCount?: number;
  normalizerSource?: string;
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
  iterations: OrchestratorIterationReport[];
  policy: Pick<PolicyEngineReport, "passed" | "failOn" | "summary">;
  loop: Pick<LoopControllerReport, "status" | "risk" | "trace" | "checks" | "decisions">;
  decision: {
    action: OrchestratorDecision;
    priority: number;
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
    iterationFiles: string[];
    checkpointFile?: string;
    diffFile?: string;
  };
}

export interface OrchestratorIterationReport {
  index: number;
  dir: string;
  promptFile: string;
  executorResult: AgentExecutorResult;
  changedFiles: string[];
  policy: Pick<PolicyEngineReport, "passed" | "failOn" | "summary">;
  loop: Pick<LoopControllerReport, "status" | "risk" | "trace" | "checks" | "decisions">;
  decision: HarnessOrchestratorReport["decision"];
  files: string[];
}

export interface HarnessOrchestratorWriteResult {
  report: HarnessOrchestratorReport;
  files: string[];
}

type AgentExecutor = (input: AgentExecutorInput) => AgentExecutorResult;

interface IterationArtifactInput {
  runId: string;
  iteration: number;
  promptFile: string;
  executorResult: AgentExecutorResult;
  agentEvents: AgentEvent[];
  hallucination: HallucinationGuardReport;
  regression: RegressionGuardReport;
  policy: PolicyEngineReport;
  verify: string;
  loop: LoopControllerReport;
  decision: HarnessOrchestratorReport["decision"];
  guardFindings: GuardFindingsArtifact;
}

export async function runHarnessOrchestrator(repo: string, task: string, options: HarnessOrchestratorOptions = {}): Promise<HarnessOrchestratorWriteResult> {
  const base = options.base ?? "main";
  const executorName = options.executor ?? "mock";
  const maxLoops = Math.max(1, options.maxLoops ?? 1);
  const root = path.resolve(repo);

  const preContext = await buildContextPackage(root);
  const contextWrite = writeContextPackage(preContext);
  const executor = createAgentExecutor(executorName);
  const taskRun = writeTaskRun(preContext, task, { base, type: options.type ?? "auto", tokenBudget: options.tokenBudget, preserveTrace: true });
  const dir = path.join(root, ".agent-context", "orchestrator", taskRun.runId);
  mkdirSync(dir, { recursive: true });
  const checkpoint = createCheckpoint(root, taskRun.runId, taskRun.dir, options.checkpoint ?? "none");
  const iterations: OrchestratorIterationReport[] = [];
  let previousDecision: HarnessOrchestratorReport["decision"] | undefined;
  let latestContext = preContext;
  let latestExecutorResult: AgentExecutorResult | undefined;
  let latestPolicy: PolicyEngineReport | undefined;
  let latestLoop: LoopControllerReport | undefined;
  let latestChangedFiles: string[] = [];
  let latestDecision: HarnessOrchestratorReport["decision"] | undefined;

  for (let loopIndex = 1; loopIndex <= maxLoops; loopIndex += 1) {
    if (loopIndex > 1 || previousDecision?.action === "repack") {
      latestContext = await buildContextPackage(root);
      writeContextPackage(latestContext);
      writeTaskRun(latestContext, task, { base, type: options.type ?? "auto", tokenBudget: options.tokenBudget, preserveTrace: true });
    }

    const iterationDir = path.join(taskRun.dir, "iterations", String(loopIndex).padStart(3, "0"));
    mkdirSync(iterationDir, { recursive: true });
    const prompt = buildExecutorPrompt(latestContext, taskRun, executorName, options, previousDecision, loopIndex);
    const promptFile = write(path.join(iterationDir, "prompt.md"), prompt);
    const executorResult = executor({
      repo: root,
      task,
      prompt,
      runDir: iterationDir,
      runId: taskRun.runId,
      base,
      agent: options.agent,
      executorCommand: options.executorCommand,
      dryRun: options.dryRun
    });

    const normalized = normalizeAgentEvents({
      executor: executorName,
      stdout: executorResult.stdout,
      stderr: executorResult.stderr,
      repo: root,
      transcriptPath: options.opencodeTranscript,
      startedAt: executorResult.startedAt,
      finishedAt: executorResult.finishedAt,
      exitCode: executorResult.exitCode
    });
    const normalizedEventsPath = writeAgentEvents(iterationDir, normalized.events);
    executorResult.normalizedEventsPath = path.relative(root, normalizedEventsPath).replaceAll("\\", "/");
    executorResult.normalizedEventsCount = normalized.events.length;
    executorResult.normalizerSource = normalized.source;

    appendAgentEventsToTrace(root, taskRun.runId, executorName, normalized.events);
    appendExecutorTrace(root, taskRun.runId, executorName, executorResult, loopIndex, normalized.warnings);

    const postContext = await buildContextPackage(root);
    const hallucination = buildHallucinationReport(postContext, { base, traceId: taskRun.runId, task });
    writeHallucinationReport(postContext, hallucination);
    const regression = buildRegressionReport(postContext, { base, traceId: taskRun.runId, task });
    writeRegressionReport(postContext, regression);
    const changedFiles = collectChangedFiles(root, base);
    const policy = buildPolicyReport(postContext, { base, traceId: taskRun.runId, failOn: options.failOn ?? "required" });
    const verify = renderTaskVerify(postContext, { base, diff: true });
    const loop = buildLoopControllerReport(postContext, task, {
      phase: loopIndex === 1 ? "after-edit" : previousDecision?.action === "repair" ? "repair" : "after-edit",
      base,
      type: options.type ?? "auto",
      tokenBudget: options.tokenBudget,
      traceId: taskRun.runId
    });
    const guardFindings = buildGuardFindingsArtifact({
      runId: taskRun.runId,
      iteration: loopIndex,
      policy,
      hallucination,
      regression
    });
    const decision = decideOrchestratorAction({
      executorResult,
      changedFiles,
      policy,
      loop,
      checkpointMode: options.checkpoint ?? "none"
    });
    if (
      loopIndex === maxLoops &&
      decision.action !== "finalize" &&
      decision.action !== "block" &&
      decision.action !== "rollback" &&
      decision.action !== "require-human-review"
    ) {
      latestDecision = maxLoopDecision(maxLoops, decision);
    } else {
      latestDecision = decision;
    }

    const iterationFiles = writeIterationArtifacts(root, iterationDir, {
      runId: taskRun.runId,
      iteration: loopIndex,
      promptFile,
      executorResult,
      agentEvents: normalized.events,
      hallucination,
      regression,
      policy,
      verify,
      loop,
      decision: latestDecision,
      guardFindings
    });
    const iterationReport: OrchestratorIterationReport = {
      index: loopIndex,
      dir: path.relative(root, iterationDir).replaceAll("\\", "/"),
      promptFile: path.relative(root, promptFile).replaceAll("\\", "/"),
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
        trace: loop.trace,
        checks: loop.checks,
        decisions: loop.decisions
      },
      decision: latestDecision,
      files: iterationFiles.map((file) => path.relative(root, file).replaceAll("\\", "/"))
    };
    iterations.push(iterationReport);

    latestContext = postContext;
    latestExecutorResult = executorResult;
    latestPolicy = policy;
    latestLoop = loop;
    latestChangedFiles = changedFiles;
    previousDecision = latestDecision;

    if (
      latestDecision.action === "finalize" ||
      latestDecision.action === "block" ||
      latestDecision.action === "rollback" ||
      latestDecision.action === "require-human-review"
    ) {
      break;
    }
  }

  if (!latestExecutorResult || !latestPolicy || !latestLoop || !latestDecision) {
    throw new Error("Orchestrator loop did not produce an iteration.");
  }

  const report: HarnessOrchestratorReport = {
    task,
    taskId: taskRun.runId,
    repo: root,
    base,
    executor: executorName,
    runDir: path.relative(root, taskRun.dir).replaceAll("\\", "/"),
    traceId: taskRun.runId,
    maxLoops,
    dryRun: Boolean(options.dryRun),
    phases: ["plan", "pack", "execute", "collect", "evaluate", "decision"],
    executorResult: latestExecutorResult,
    changedFiles: latestChangedFiles,
    iterations,
    policy: {
      passed: latestPolicy.passed,
      failOn: latestPolicy.failOn,
      summary: latestPolicy.summary
    },
    loop: {
      status: latestLoop.status,
      risk: latestLoop.risk,
      trace: latestLoop.trace,
      checks: latestLoop.checks,
      decisions: latestLoop.decisions
    },
    decision: latestDecision,
    artifacts: {
      contextFiles: contextWrite.files.map((file) => path.relative(root, file).replaceAll("\\", "/")),
      runFiles: taskRun.files.map((file) => path.relative(root, file).replaceAll("\\", "/")),
      orchestratorFiles: [],
      iterationFiles: iterations.flatMap((iteration) => iteration.files),
      checkpointFile: checkpoint?.relativePath,
      diffFile: latestExecutorResult.diffPath
    }
  };

  const files = [
    write(path.join(dir, "orchestrator.md"), renderOrchestratorReport(report)),
    write(path.join(dir, "orchestrator.json"), JSON.stringify(report, null, 2)),
    write(path.join(dir, "policy.md"), renderPolicyReport(latestPolicy)),
    write(path.join(dir, "impact.md"), renderChangeImpactReport(latestContext, { base })),
    write(path.join(dir, "verify.md"), renderTaskVerify(latestContext, { base, diff: true })),
    write(path.join(dir, "loop.md"), renderLoopControllerReport(latestLoop))
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
        "Code Agent++ plan / pack",
        `Executor: ${report.executor}`,
        "Agent execution",
        "Diff / trace / test evidence collection",
        "Policy / contracts / tests / impact / verify evaluation",
        `Decision: ${report.decision.action}`
      ].map((item) => item)
    ),
    "",
    heading(2, "Evidence Summary"),
    table(
      ["Question", "Answer"],
      [
        ["Which agent executed?", report.executor],
        ["Which files changed?", report.changedFiles.length ? report.changedFiles.map(code).join(", ") : "none"],
        ["Which executor command ran?", report.executorResult.command ? code(report.executorResult.command) : "none"],
        ["Normalized executor events", String(report.executorResult.normalizedEventsCount ?? 0)],
        ["Trusted test evidence", report.loop.trace.passedTestEvidence],
        ["Trace loaded", report.loop.trace.loaded ? "yes" : "no"],
        [
          "Boundary / contract check",
          `${report.loop.checks.contracts} (${report.loop.checks.contractViolations} violation${report.loop.checks.contractViolations === 1 ? "" : "s"})`
        ],
        ["Policy gate", report.policy.passed ? "passed" : "failed"],
        ["Missing required evidence", String(report.policy.summary.requiredMissing)],
        ["Forbidden findings", String(report.policy.summary.forbidden)],
        ["Impact risk", report.loop.risk],
        ["Final decision", `${report.decision.action} - ${report.decision.reason}`]
      ]
    ),
    "",
    heading(2, "Decision"),
    table(
      ["Field", "Value"],
      [
        ["Action", report.decision.action],
        ["Priority", String(report.decision.priority)],
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
    heading(2, "Loop Iterations"),
    table(
      ["Loop", "Decision", "Exit", "Changed files", "Directory"],
      report.iterations.map((iteration) => [
        String(iteration.index),
        iteration.decision.action,
        String(iteration.executorResult.exitCode ?? "unknown"),
        String(iteration.changedFiles.length),
        code(iteration.dir)
      ])
    ),
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
    bullet(
      [...report.artifacts.orchestratorFiles, ...report.artifacts.iterationFiles, report.artifacts.checkpointFile ? report.artifacts.checkpointFile : ""]
        .filter(Boolean)
        .map(code)
    )
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
  let result: ReturnType<typeof runSafeCommand>;
  try {
    result = runSafeCommand(command, {
      cwd: input.repo,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024
    });
  } catch (error) {
    result = {
      command,
      file: "",
      args: [],
      stdout: "",
      stderr: error instanceof Error ? error.message : String(error),
      status: 2,
      error: error instanceof Error ? error : undefined
    };
  }
  const finishedAt = new Date().toISOString();
  const finishedHash = currentWorkingTreeHash(input.repo);
  const stdout = result.stdout;
  const stderr = result.stderr;
  const exitCode = result.status;
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
  options: HarnessOrchestratorOptions,
  previousDecision: HarnessOrchestratorReport["decision"] | undefined,
  loopIndex: number
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
    "- Code Agent++ owns context, boundaries, trace evidence, policy, impact, verify, and final gate decisions.",
    "- The selected code agent owns reading source files, editing code, and running commands.",
    "- Inspect relevant source files before behavior-changing edits.",
    "- Keep changes inside the edit boundary unless the task cannot be completed otherwise.",
    "- Prefer command evidence for tests and verification.",
    `- Executor: ${executorName}`,
    `- Loop iteration: ${loopIndex} / ${options.maxLoops ?? 1}`,
    ...(previousDecision
      ? [
          "",
          "Previous harness decision:",
          `- Action: ${previousDecision.action}`,
          `- Reason: ${previousDecision.reason}`,
          previousDecision.nextCommand ? `- Suggested command: ${previousDecision.nextCommand}` : "",
          ...previousDecision.signals.map((signal) => `- Signal: ${signal}`)
        ].filter(Boolean)
      : [])
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
  checkpointMode: OrchestratorCheckpointMode;
}): HarnessOrchestratorReport["decision"] {
  if (input.executorResult.exitCode !== 0) {
    return decision("block", true, 0.94, "The selected executor failed before the harness could trust the result.", [
      `executor exit code: ${input.executorResult.exitCode ?? "unknown"}`,
      input.executorResult.stderr ? "executor stderr captured" : "executor stderr empty"
    ]);
  }

  if (input.policy.summary.forbidden > 0) {
    return decision(input.checkpointMode === "git-worktree" ? "rollback" : "block", true, 0.96, "Forbidden policy findings were detected in the diff.", [
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

function appendExecutorTrace(
  root: string,
  traceId: string,
  executorName: AgentExecutorName,
  executorResult: AgentExecutorResult,
  loopIndex: number,
  warnings: string[] = []
): void {
  appendExecutionTraceStep(root, traceId, {
    agent: executorName,
    action: "agent-execute",
    files: executorResult.changedFiles,
    command: executorResult.command,
    reason: `Loop ${loopIndex}: ${executorName} executor returned exit code ${executorResult.exitCode ?? "unknown"}.`,
    result: executorResult.exitCode === 0 ? "passed" : "failed",
    finalState: executorResult.exitCode === 0 ? "partial_success" : "blocked",
    evidenceSource: executorResult.command ? "command" : "manual",
    capturedBy: executorResult.command ? "code-agent-plusplus" : "external",
    exitCode: executorResult.exitCode,
    output: summarizeOutput(executorResult.stdout, executorResult.stderr, warnings),
    startedAt: executorResult.startedAt,
    finishedAt: executorResult.finishedAt,
    stdoutHash: executorResult.stdoutHash,
    stderrHash: executorResult.stderrHash,
    workingTreeHashBefore: executorResult.workingTreeHashBefore,
    workingTreeHashAfter: executorResult.workingTreeHashAfter
  });
}

function appendAgentEventsToTrace(root: string, traceId: string, executorName: AgentExecutorName, events: AgentEvent[]): void {
  for (const event of events) {
    if (event.type === "message") {
      appendExecutionTraceStep(root, traceId, {
        at: event.ts,
        agent: executorName,
        action: "message",
        reason: event.role,
        output: event.text,
        evidenceSource: "manual"
      });
    } else if (event.type === "tool_call") {
      appendExecutionTraceStep(root, traceId, {
        at: event.ts,
        agent: executorName,
        action: "tool-call",
        reason: event.tool,
        output: safeStringify(event.args),
        evidenceSource: "manual"
      });
    } else if (event.type === "file_read") {
      appendExecutionTraceStep(root, traceId, {
        at: event.ts,
        agent: executorName,
        action: "file-read",
        files: [event.path],
        evidenceSource: "manual"
      });
    } else if (event.type === "file_edit") {
      appendExecutionTraceStep(root, traceId, {
        at: event.ts,
        agent: executorName,
        action: "edit",
        files: [event.path],
        evidenceSource: "manual"
      });
    } else if (event.type === "command_run" || event.type === "test_run") {
      appendExecutionTraceStep(root, traceId, {
        at: event.ts,
        agent: executorName,
        action: event.type === "test_run" ? "run-test" : "run-command",
        command: event.command,
        result: event.exitCode === undefined ? "unknown" : event.exitCode === 0 ? "passed" : "failed",
        evidenceSource: "command",
        capturedBy: "external",
        exitCode: event.exitCode,
        startedAt: event.ts,
        finishedAt: event.ts
      });
    } else if (event.type === "error") {
      appendExecutionTraceStep(root, traceId, {
        at: event.ts,
        agent: executorName,
        action: "error",
        result: "failed",
        output: event.message,
        evidenceSource: "manual"
      });
    }
  }
}

function writeIterationArtifacts(root: string, iterationDir: string, input: IterationArtifactInput): string[] {
  const generatedAt = new Date().toISOString();
  const trace = readExecutionTrace(root, input.runId);
  const executorArtifact = {
    schemaVersion: "code-agent-plusplus.executor-result.v1",
    kind: "executor-result",
    generatedAt,
    runId: input.runId,
    iteration: input.iteration,
    summary: {
      executor: input.executorResult.executor,
      exitCode: input.executorResult.exitCode,
      command: input.executorResult.command,
      changedFiles: input.executorResult.changedFiles,
      events: input.executorResult.normalizedEventsCount ?? input.agentEvents.length,
      normalizerSource: input.executorResult.normalizerSource ?? "unknown"
    },
    executorResult: input.executorResult
  };
  const traceArtifact = {
    schemaVersion: "code-agent-plusplus.trace-artifact.v1",
    kind: "trace",
    generatedAt,
    runId: input.runId,
    iteration: input.iteration,
    summary: {
      traceLoaded: Boolean(trace),
      steps: trace?.steps.length ?? 0,
      commandEvidence: trace?.steps.filter((step) => step.evidenceSource === "command").length ?? 0,
      filesTouched: [...new Set(trace?.steps.flatMap((step) => step.files) ?? [])].sort()
    },
    trace
  };
  const decisionArtifact = {
    schemaVersion: "code-agent-plusplus.decision.v1",
    kind: "decision",
    generatedAt,
    runId: input.runId,
    iteration: input.iteration,
    priorityOrder: ORCHESTRATOR_DECISION_PRIORITY,
    inputs: {
      executorExitCode: input.executorResult.exitCode,
      changedFiles: input.executorResult.changedFiles,
      policy: input.policy.summary,
      loopStatus: input.loop.status,
      loopRisk: input.loop.risk,
      guardFindings: input.guardFindings.summary
    },
    decision: input.decision
  };
  const iterationArtifact = {
    schemaVersion: "code-agent-plusplus.iteration.v1",
    kind: "iteration",
    generatedAt,
    runId: input.runId,
    iteration: input.iteration,
    directory: path.relative(root, iterationDir).replaceAll("\\", "/"),
    artifacts: {
      prompt: "prompt.md",
      executorEvents: "executor.events.jsonl",
      executorResult: "executor.result.json",
      diff: "diff.patch",
      trace: "trace.json",
      guardFindings: "guard.findings.json",
      policy: "policy.json",
      verify: "verify.json",
      loop: "loop.json",
      decision: "decision.json"
    },
    summary: {
      executor: input.executorResult.executor,
      exitCode: input.executorResult.exitCode,
      changedFiles: input.executorResult.changedFiles.length,
      guardFindings: input.guardFindings.summary.total,
      policyPassed: input.policy.passed,
      loopStatus: input.loop.status,
      decision: input.decision.action
    }
  };
  const files = [
    input.promptFile,
    write(path.join(iterationDir, "iteration.json"), JSON.stringify(iterationArtifact, null, 2)),
    write(path.join(iterationDir, "executor.events.jsonl"), formatAgentEvents(input.agentEvents)),
    write(path.join(iterationDir, "executor.result.json"), JSON.stringify(executorArtifact, null, 2)),
    write(path.join(iterationDir, "hallucination.json"), JSON.stringify(input.hallucination, null, 2)),
    write(path.join(iterationDir, "hallucination.md"), renderHallucinationReport(input.hallucination)),
    write(path.join(iterationDir, "regression.json"), JSON.stringify(input.regression, null, 2)),
    write(path.join(iterationDir, "regression.md"), renderRegressionReport(input.regression)),
    write(path.join(iterationDir, "guard.findings.json"), JSON.stringify(input.guardFindings, null, 2)),
    write(path.join(iterationDir, "policy.json"), JSON.stringify(input.policy, null, 2)),
    write(path.join(iterationDir, "verify.json"), JSON.stringify({ markdown: input.verify }, null, 2)),
    write(path.join(iterationDir, "loop.json"), JSON.stringify(input.loop, null, 2)),
    write(path.join(iterationDir, "decision.json"), JSON.stringify(decisionArtifact, null, 2)),
    write(path.join(iterationDir, "trace.json"), JSON.stringify(traceArtifact, null, 2))
  ];

  if (input.executorResult.diffPath) {
    const diffSource = path.join(root, input.executorResult.diffPath);
    const diffTarget = path.join(iterationDir, "diff.patch");
    if (existsSync(diffSource)) {
      copyFileSync(diffSource, diffTarget);
    } else {
      writeFileSync(diffTarget, "", "utf8");
    }
    files.push(diffTarget);
  }

  return files;
}

function writeAgentEvents(iterationDir: string, events: AgentEvent[]): string {
  const filePath = path.join(iterationDir, "executor.events.jsonl");
  writeFileSync(filePath, formatAgentEvents(events), "utf8");
  return filePath;
}

function formatAgentEvents(events: AgentEvent[]): string {
  return events.map((event) => JSON.stringify(event)).join("\n") + (events.length ? "\n" : "");
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function maxLoopDecision(maxLoops: number, lastDecision: HarnessOrchestratorReport["decision"]): HarnessOrchestratorReport["decision"] {
  return decision(
    "require-human-review",
    true,
    0.9,
    `Maximum orchestrator loop count (${maxLoops}) reached before the harness could finalize.`,
    [`max loops: ${maxLoops}`, `last action: ${lastDecision.action}`, ...lastDecision.signals],
    lastDecision.nextCommand
  );
}

function createCheckpoint(root: string, runId: string, runDir: string, mode: OrchestratorCheckpointMode): { relativePath: string } | undefined {
  if (mode === "none") return undefined;
  const filePath = path.join(runDir, "checkpoint.patch");
  let patch = "";
  try {
    patch = runGit(root, ["diff", "--binary", "--", ".", ":(exclude).agent-context/**", ":(exclude)AGENTS.md"]);
  } catch (error) {
    patch = `Unable to create checkpoint patch: ${error instanceof Error ? error.message : String(error)}\n`;
  }
  writeFileSync(
    filePath,
    [
      `# checkpoint for ${runId}`,
      "# mode: git-worktree",
      "# This file captures the source diff before executor loops. Code Agent++ does not run destructive rollback commands automatically.",
      "",
      patch
    ].join("\n"),
    "utf8"
  );
  return { relativePath: path.relative(root, filePath).replaceAll("\\", "/") };
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
    priority: ORCHESTRATOR_DECISION_PRIORITY[action],
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
  return shellQuote(value);
}

function summarizeOutput(stdout: string, stderr: string, warnings: string[] = []): string {
  const combined = [stdout.trim(), stderr.trim(), ...warnings.map((warning) => `normalizer warning: ${warning}`)].filter(Boolean).join("\n--- stderr ---\n");
  if (!combined) return "";
  return combined.length > 2000 ? `${combined.slice(0, 2000)}\n... truncated ...` : combined;
}

function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
