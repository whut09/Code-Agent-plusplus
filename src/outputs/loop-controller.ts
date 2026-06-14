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
  confidence: number;
  blocking: boolean;
  reason: string;
  signals: string[];
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
    minimalTests: tests.minimalTests.length,
    regressionTests: tests.recommendedRegressionTests.length,
    impactDependents: impact.directDependents.length + impact.transitiveDependents.length,
    minimalCommands: tests.minimalCommands,
    regressionCommands: tests.recommendedCommands,
    taskPackOverBudget: taskPack.estimatedTokens > taskPack.tokenBudget,
    taskPackTokens: taskPack.estimatedTokens,
    taskPackBudget: taskPack.tokenBudget,
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
  minimalTests: number;
  regressionTests: number;
  impactDependents: number;
  minimalCommands: string[];
  regressionCommands: string[];
  taskPackOverBudget: boolean;
  taskPackTokens: number;
  taskPackBudget: number;
  missingTestSignals: number;
}): LoopDecision[] {
  const decisions: LoopDecision[] = [];

  if (input.freshnessStatus !== "fresh" || input.driftStatus !== "clean") {
    decisions.push(
      decision({
        action: "rebuild-context",
        priority: "high",
        confidence: 0.95,
        blocking: true,
        reason: "Generated context is missing, stale, or drifted from the current repository state.",
        signals: [`freshness: ${input.freshnessStatus}`, `drift: ${input.driftStatus}`],
        command: "repo-context update ."
      })
    );
  }

  if (input.taskPackOverBudget) {
    decisions.push(
      decision({
        action: "replan",
        priority: "medium",
        confidence: 0.84,
        blocking: true,
        reason: "The task pack exceeds its context budget; shrink or split the task before handing it to an agent.",
        signals: [`task pack tokens: ${input.taskPackTokens}`, `task pack budget: ${input.taskPackBudget}`],
        command: `repo-context plan "${input.task}" .`
      })
    );
  }

  if (!input.changedFiles.length && input.phase === "preflight") {
    decisions.push(
      decision({
        action: "start-agent",
        priority: "high",
        confidence: 0.88,
        blocking: false,
        reason: "No edits are detected yet; create a fresh task run before agent execution.",
        signals: [`phase: ${input.phase}`, "changed files: 0"],
        command: `repo-context run "${input.task}" . --base ${input.base}`
      })
    );
  }

  if (!input.contractsPassed) {
    decisions.push(
      decision({
        action: "repair-contracts",
        priority: "high",
        confidence: 0.96,
        blocking: true,
        reason: `${input.contractViolations} contract violation${input.contractViolations === 1 ? "" : "s"} detected in the current diff.`,
        signals: [`contract violations: ${input.contractViolations}`, "contracts: failed"],
        command: `repo-context validate-contracts . --base ${input.base}`
      })
    );
  }

  if (input.missingTestSignals > 0) {
    decisions.push(
      decision({
        action: "add-or-update-tests",
        priority: "medium",
        confidence: 0.78,
        blocking: true,
        reason: "Changed source files have contract signals indicating missing related tests.",
        signals: [`missing test signals: ${input.missingTestSignals}`, `changed files: ${input.changedFiles.length}`],
        command: `repo-context tests . --diff --base ${input.base}`
      })
    );
  }

  if (input.impactRisk === "High") {
    decisions.push(
      decision({
        action: "expand-context",
        priority: "medium",
        confidence: 0.76,
        blocking: true,
        reason: "High impact risk means the next agent turn should include dependents, related tests, and contract violations.",
        signals: [`impact risk: ${input.impactRisk}`, `impact dependents: ${input.impactDependents}`],
        command: `repo-context impact . --base ${input.base}`
      })
    );
  }

  if (input.changedFiles.length) {
    decisions.push(
      decision({
        action: "run-tests",
        priority: input.impactRisk === "High" ? "high" : "medium",
        confidence: confidenceForRunTests(input),
        blocking: true,
        reason: "The loop cannot close until the recommended focused tests and verification commands have been run.",
        signals: [
          `changed files: ${input.changedFiles.length}`,
          `minimal tests detected: ${input.minimalTests}`,
          `regression tests detected: ${input.regressionTests}`,
          "passed test trace: not evaluated by loop controller"
        ],
        command: firstUsefulCommand([...input.minimalCommands, ...input.regressionCommands], input.task) ?? `repo-context tests . --diff --base ${input.base}`
      })
    );
  }

  if (!decisions.length) {
    decisions.push(
      decision({
        action: "ready-for-review",
        priority: "low",
        confidence: 0.72,
        blocking: false,
        reason: "No stale context, contract failures, changed files, or high-risk impact signals were detected.",
        signals: ["freshness: fresh", "drift: clean", "changed files: 0", "contracts: passed"]
      })
    );
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
  const signals = decision.signals.length ? ` Signals: ${decision.signals.join("; ")}.` : "";
  return `${decision.priority.toUpperCase()} ${decision.action} (${formatConfidence(decision.confidence)}, ${decision.blocking ? "blocking" : "non-blocking"}): ${decision.reason}${command}${signals}`;
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

function decision(input: LoopDecision): LoopDecision {
  return {
    ...input,
    confidence: clampConfidence(input.confidence),
    signals: input.signals.filter(Boolean)
  };
}

function confidenceForRunTests(input: {
  impactRisk: "Low" | "Medium" | "High";
  minimalTests: number;
  regressionTests: number;
  minimalCommands: string[];
  regressionCommands: string[];
}): number {
  let confidence = input.impactRisk === "High" ? 0.86 : 0.8;
  if (input.minimalTests > 0) confidence += 0.04;
  if (input.regressionTests > 0) confidence += 0.03;
  if (firstUsefulCommand([...input.minimalCommands, ...input.regressionCommands], "")) confidence += 0.03;
  return confidence;
}

function clampConfidence(value: number): number {
  return Math.round(Math.max(0, Math.min(1, value)) * 100) / 100;
}

function formatConfidence(value: number): string {
  return `confidence ${value.toFixed(2)}`;
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
