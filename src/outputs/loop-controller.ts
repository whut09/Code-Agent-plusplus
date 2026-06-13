import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ContextPackage, TaskType } from "../core/types.js";
import { changedFilesSince, runGit } from "../core/git.js";
import { assessDrift, assessFreshness } from "../core/freshness.js";
import { buildChangeImpactReport } from "./impact.js";
import { validateContracts } from "./contract-validator.js";
import { buildTaskPack } from "./task-context.js";
import { buildTestSelection } from "./test-selector.js";
import { bullet, code, heading, table } from "./markdown.js";

export type LoopPhase = "preflight" | "after-edit" | "repair";
export type LoopStatus = "ready" | "needs-context" | "needs-repair" | "needs-validation" | "blocked";
export type LoopAction =
  | "start-agent"
  | "rebuild-context"
  | "replan"
  | "expand-context"
  | "repair-contracts"
  | "add-or-update-tests"
  | "run-tests"
  | "ready-for-review";

export interface LoopControllerOptions {
  phase?: LoopPhase;
  base?: string;
  type?: TaskType;
  tokenBudget?: number;
}

export interface LoopDecision {
  action: LoopAction;
  priority: "high" | "medium" | "low";
  reason: string;
  command?: string;
}

export interface LoopControllerReport {
  task: string;
  phase: LoopPhase;
  base: string;
  status: LoopStatus;
  changedFiles: string[];
  risk: "Low" | "Medium" | "High";
  context: {
    freshness: string;
    drift: string;
    taskPackTokens: number;
    taskPackBudget: number;
  };
  checks: {
    contracts: "passed" | "failed";
    contractViolations: number;
    minimalTests: number;
    regressionTests: number;
    impactDependents: number;
  };
  decisions: LoopDecision[];
}

export interface LoopWriteResult {
  taskId: string;
  dir: string;
  files: string[];
  report: LoopControllerReport;
}

export function buildLoopControllerReport(context: ContextPackage, task: string, options: LoopControllerOptions = {}): LoopControllerReport {
  const base = options.base ?? "main";
  const phase = options.phase ?? "after-edit";
  const freshness = assessFreshness(context);
  const drift = assessDrift(context);
  const contracts = validateContracts(context, { base, diff: true });
  const actionableContractViolations = contracts.violations.filter((violation) => !isGeneratedContextState(violation.file));
  const actionableContractsPassed = !actionableContractViolations.some((violation) => violation.severity === "error");
  const impact = buildChangeImpactReport(context, { base });
  const changedFiles = changedFilesForLoop(context, base);
  const tests = buildTestSelection(context, { diff: true, base });
  const taskPack = buildTaskPack(context, task, { type: options.type ?? "auto", tokenBudget: options.tokenBudget });
  const decisions = decideNextSteps({
    task,
    phase,
    base,
    freshnessStatus: freshness.status,
    driftStatus: drift.status,
    changedFiles,
    contractsPassed: actionableContractsPassed,
    contractViolations: actionableContractViolations.length,
    impactRisk: impact.risk,
    minimalCommands: tests.minimalCommands,
    regressionCommands: tests.recommendedCommands,
    taskPackOverBudget: taskPack.estimatedTokens > taskPack.tokenBudget,
    missingTestSignals: actionableContractViolations.filter((violation) => /test/i.test(`${violation.rule} ${violation.reason}`)).length
  });

  return {
    task,
    phase,
    base,
    status: statusFor(decisions),
    changedFiles,
    risk: impact.risk,
    context: {
      freshness: freshness.status,
      drift: drift.status,
      taskPackTokens: taskPack.estimatedTokens,
      taskPackBudget: taskPack.tokenBudget
    },
    checks: {
      contracts: actionableContractsPassed ? "passed" : "failed",
      contractViolations: actionableContractViolations.length,
      minimalTests: tests.minimalTests.length,
      regressionTests: tests.recommendedRegressionTests.length,
      impactDependents: impact.directDependents.length + impact.transitiveDependents.length
    },
    decisions
  };
}

export function renderLoopControllerReport(report: LoopControllerReport): string {
  return [
    heading(1, "Loop Controller"),
    "",
    `Task: ${report.task}`,
    `Phase: ${report.phase}`,
    `Status: ${report.status}`,
    `Base: ${report.base}`,
    `Risk: ${report.risk}`,
    "",
    heading(2, "Loop Checks"),
    table(
      ["Check", "Result"],
      [
        ["Context freshness", report.context.freshness],
        ["Context drift", report.context.drift],
        ["Contracts", `${report.checks.contracts} (${report.checks.contractViolations} violation${report.checks.contractViolations === 1 ? "" : "s"})`],
        ["Minimal tests", String(report.checks.minimalTests)],
        ["Regression tests", String(report.checks.regressionTests)],
        ["Impact dependents", String(report.checks.impactDependents)],
        ["Task pack budget", `${report.context.taskPackTokens.toLocaleString()} / ${report.context.taskPackBudget.toLocaleString()} estimated tokens`]
      ]
    ),
    "",
    heading(2, "Changed Files"),
    bullet(report.changedFiles.map(code)),
    "",
    heading(2, "Next Decisions"),
    bullet(report.decisions.map(formatDecision)),
    "",
    heading(2, "Loop Rule"),
    "Do not treat generated context as the source of truth. Inspect source files before edits, then rerun this loop after changes."
  ].join("\n");
}

export function writeLoopControllerReport(context: ContextPackage, task: string, options: LoopControllerOptions = {}): LoopWriteResult {
  const report = buildLoopControllerReport(context, task, options);
  const taskId = taskSlug(task);
  const dir = path.join(context.scan.root, ".agent-context", "loops", taskId);
  mkdirSync(dir, { recursive: true });

  const files = [write(path.join(dir, "loop.md"), renderLoopControllerReport(report)), write(path.join(dir, "loop.json"), JSON.stringify(report, null, 2))];

  return { taskId, dir, files, report };
}

function decideNextSteps(input: {
  task: string;
  phase: LoopPhase;
  base: string;
  freshnessStatus: string;
  driftStatus: string;
  changedFiles: string[];
  contractsPassed: boolean;
  contractViolations: number;
  impactRisk: "Low" | "Medium" | "High";
  minimalCommands: string[];
  regressionCommands: string[];
  taskPackOverBudget: boolean;
  missingTestSignals: number;
}): LoopDecision[] {
  const decisions: LoopDecision[] = [];

  if (input.freshnessStatus !== "fresh" || input.driftStatus !== "clean") {
    decisions.push({
      action: "rebuild-context",
      priority: "high",
      reason: "Generated context is missing, stale, or drifted from the current repository state.",
      command: "repo-context update ."
    });
  }

  if (input.taskPackOverBudget) {
    decisions.push({
      action: "replan",
      priority: "medium",
      reason: "The task pack exceeds its context budget; shrink or split the task before handing it to an agent.",
      command: `repo-context plan "${input.task}" .`
    });
  }

  if (!input.changedFiles.length && input.phase === "preflight") {
    decisions.push({
      action: "start-agent",
      priority: "high",
      reason: "No edits are detected yet; create a fresh task run before agent execution.",
      command: `repo-context run "${input.task}" . --base ${input.base}`
    });
  }

  if (!input.contractsPassed) {
    decisions.push({
      action: "repair-contracts",
      priority: "high",
      reason: `${input.contractViolations} contract violation${input.contractViolations === 1 ? "" : "s"} detected in the current diff.`,
      command: `repo-context validate-contracts . --base ${input.base}`
    });
  }

  if (input.missingTestSignals > 0) {
    decisions.push({
      action: "add-or-update-tests",
      priority: "medium",
      reason: "Changed source files have contract signals indicating missing related tests.",
      command: `repo-context tests . --diff --base ${input.base}`
    });
  }

  if (input.impactRisk === "High") {
    decisions.push({
      action: "expand-context",
      priority: "medium",
      reason: "High impact risk means the next agent turn should include dependents, related tests, and contract violations.",
      command: `repo-context impact . --base ${input.base}`
    });
  }

  if (input.changedFiles.length) {
    decisions.push({
      action: "run-tests",
      priority: input.impactRisk === "High" ? "high" : "medium",
      reason: "The loop cannot close until the recommended focused tests and verification commands have been run.",
      command: firstUsefulCommand([...input.minimalCommands, ...input.regressionCommands], input.task) ?? `repo-context tests . --diff --base ${input.base}`
    });
  }

  if (!decisions.length) {
    decisions.push({
      action: "ready-for-review",
      priority: "low",
      reason: "No stale context, contract failures, changed files, or high-risk impact signals were detected."
    });
  }

  return dedupeDecisions(decisions);
}

function statusFor(decisions: LoopDecision[]): LoopStatus {
  if (decisions.some((decision) => decision.action === "repair-contracts")) return "needs-repair";
  if (decisions.some((decision) => decision.action === "rebuild-context" || decision.action === "replan" || decision.action === "expand-context"))
    return "needs-context";
  if (decisions.some((decision) => decision.action === "run-tests" || decision.action === "add-or-update-tests")) return "needs-validation";
  if (decisions.some((decision) => decision.action === "start-agent" || decision.action === "ready-for-review")) return "ready";
  return "blocked";
}

function changedFilesForLoop(context: ContextPackage, base: string): string[] {
  const files = new Set<string>();
  for (const file of changedFilesSince(context.scan.root, base)) {
    if (!isGeneratedContextState(file)) files.add(file);
  }
  try {
    for (const line of runGit(context.scan.root, ["status", "--porcelain", "--untracked-files=all"]).split(/\r?\n/)) {
      if (line.length <= 3) continue;
      const file = line.slice(3).trim().replace(/\\/g, "/").split(" -> ").pop();
      if (file && !isGeneratedContextState(file)) files.add(file);
    }
  } catch {
    return [...files].sort();
  }
  return [...files].sort();
}

function isGeneratedContextState(file: string): boolean {
  return file.startsWith(".agent-context/") || file === "AGENTS.md";
}

function firstUsefulCommand(commands: string[], task: string): string | undefined {
  const useful = commands.filter((command) => !/^No .*detected/i.test(command));
  const terms =
    task
      .toLowerCase()
      .match(/[a-z0-9_-]+/g)
      ?.filter((term) => term.length >= 4) ?? [];
  return (
    useful.find((command) => terms.some((term) => command.toLowerCase().includes(term))) ??
    useful.find((command) => !command.includes("benchmarks/fixtures/") && /(^|\s)(test|tests)\//i.test(command)) ??
    useful.find((command) => !command.includes("benchmarks/fixtures/")) ??
    useful[0]
  );
}

function formatDecision(decision: LoopDecision): string {
  const command = decision.command ? ` Command: ${code(decision.command)}.` : "";
  return `${decision.priority.toUpperCase()} ${decision.action}: ${decision.reason}${command}`;
}

function write(filePath: string, content: string): string {
  writeFileSync(filePath, `${content.trim()}\n`, "utf8");
  return filePath;
}

function dedupeDecisions(decisions: LoopDecision[]): LoopDecision[] {
  const seen = new Set<string>();
  return decisions.filter((decision) => {
    const key = `${decision.action}:${decision.command ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function taskSlug(task: string): string {
  const normalized = task
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
  return normalized || `task-${hashTask(task)}`;
}

function hashTask(task: string): string {
  let hash = 0;
  for (const char of task) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  return Math.abs(hash).toString(36);
}
