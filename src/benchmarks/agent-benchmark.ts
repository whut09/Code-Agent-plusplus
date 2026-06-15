import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildContextPackage } from "../core/context-builder.js";
import { changedFilesSince, runGit } from "../core/git.js";
import { runSafeCommand, shellQuote } from "../core/safe-command.js";
import { normalizeAgentEvents } from "../outputs/agent-events.js";
import { appendExecutionTraceStep, currentWorkingTreeHash, startExecutionTrace } from "../outputs/execution-trace.js";
import { buildHallucinationReport } from "../outputs/hallucination-guard.js";
import { buildLoopControllerReport } from "../outputs/loop-controller.js";
import { buildPolicyReport, type PolicyFailOn } from "../outputs/policy-engine.js";
import { buildRegressionReport } from "../outputs/regression-guard.js";
import { writeTaskRun } from "../outputs/task-run.js";
import { writeContextPackage } from "../outputs/writer.js";
import { runHarnessOrchestrator, type AgentExecutorName, type OrchestratorDecision } from "../outputs/orchestrator.js";
import { code, heading, table } from "../outputs/markdown.js";
import type { AgentRunMode, BenchmarkTaskDefinition } from "./benchmark.js";

export type AgentBenchmarkFinalDecision = OrchestratorDecision | "weak-pass" | "weak-block";
export type AgentBenchmarkGate = "weak" | "medium" | "strong" | "blocked";

export interface AgentBehaviorBenchmarkOptions {
  benchmarkDir?: string;
  executor?: AgentExecutorName;
  executorCommand?: string;
  agent?: string;
  maxLoops?: number;
  failOn?: PolicyFailOn;
  base?: string;
  dryRun?: boolean;
  keepWorkdirs?: boolean;
  modes?: AgentRunMode[];
  taskIds?: string[];
}

export interface AgentBehaviorBenchmarkRun {
  taskId: string;
  fixture: string;
  task: string;
  mode: AgentRunMode;
  executor: AgentExecutorName;
  workdir: string;
  changedFiles: string[];
  unrelatedChanges: number;
  passedTests: boolean;
  missingEvidence: number;
  loopCount: number;
  finalDecision: AgentBenchmarkFinalDecision;
  finalGate: AgentBenchmarkGate;
  hallucinationFindings: number;
  regressionFindings: number;
  exitCode: number | null;
}

export interface AgentBehaviorModeSummary {
  mode: AgentRunMode;
  runs: number;
  wrongEdits: number;
  staleEvidence: number;
  testPassRate: number;
  loops: number;
  finalGate: AgentBenchmarkGate;
}

export interface AgentBehaviorBenchmarkResult {
  benchmarkDir: string;
  executor: AgentExecutorName;
  modes: AgentRunMode[];
  tasks: number;
  runs: AgentBehaviorBenchmarkRun[];
  summary: AgentBehaviorModeSummary[];
}

const DEFAULT_MODES: AgentRunMode[] = ["no-context", "agents-md", "context-pack", "loop-enabled-harness"];

export async function runAgentBehaviorBenchmark(options: AgentBehaviorBenchmarkOptions = {}): Promise<AgentBehaviorBenchmarkResult> {
  const benchmarkDir = path.resolve(options.benchmarkDir ?? "benchmarks");
  const executor = options.executor ?? "mock";
  const modes = options.modes?.length ? options.modes : DEFAULT_MODES;
  const tasks = readTasks(path.join(benchmarkDir, "tasks")).filter((task) => !options.taskIds?.length || options.taskIds.includes(task.id));
  const runs: AgentBehaviorBenchmarkRun[] = [];

  for (const task of tasks) {
    for (const mode of modes) {
      runs.push(await runAgentModeBenchmark(benchmarkDir, task, mode, executor, options));
    }
  }

  return {
    benchmarkDir,
    executor,
    modes,
    tasks: tasks.length,
    runs,
    summary: summarizeAgentBehavior(runs, modes)
  };
}

export function renderAgentBehaviorBenchmark(result: AgentBehaviorBenchmarkResult): string {
  return [
    heading(1, "Real Agent Behavior Benchmark"),
    "",
    `Benchmark dir: ${code(result.benchmarkDir)}`,
    `Executor: ${result.executor}`,
    `Tasks: ${result.tasks}`,
    `Runs: ${result.runs.length}`,
    "",
    heading(2, "Mode Comparison"),
    table(
      ["Mode", "Wrong edits", "Stale evidence", "Test pass", "Loops", "Final gate"],
      result.summary.map((item) => [
        displayMode(item.mode),
        item.wrongEdits.toFixed(1),
        item.staleEvidence.toFixed(1),
        percent(item.testPassRate),
        item.loops.toFixed(1),
        item.finalGate
      ])
    ),
    "",
    heading(2, "Run Details"),
    table(
      ["Task", "Fixture", "Mode", "Changed", "Wrong edits", "Missing evidence", "Decision", "Hallucinations", "Regressions"],
      result.runs.map((run) => [
        run.taskId,
        run.fixture,
        displayMode(run.mode),
        String(run.changedFiles.length),
        String(run.unrelatedChanges),
        String(run.missingEvidence),
        run.finalDecision,
        String(run.hallucinationFindings),
        String(run.regressionFindings)
      ])
    ),
    "",
    heading(2, "Interpretation"),
    "- This benchmark can run a real executor, such as OpenCode, over the same fixture tasks in four modes.",
    "- A no-context: task only.",
    "- B AGENTS.md: task plus root operating guide.",
    "- C context-pack: task plus task-aware pack and edit boundary.",
    "- D harness-led: Code Agent++ owns the loop and the code agent is only the executor.",
    "- `mock` and `--dry-run` validate the benchmark harness without editing fixtures.",
    '- Real OpenCode runs can be recorded with `--executor opencode --executor-command "opencode run --format json {prompt}"`.'
  ].join("\n");
}

async function runAgentModeBenchmark(
  benchmarkDir: string,
  task: BenchmarkTaskDefinition,
  mode: AgentRunMode,
  executor: AgentExecutorName,
  options: AgentBehaviorBenchmarkOptions
): Promise<AgentBehaviorBenchmarkRun> {
  const workspace = mkdtempSync(path.join(tmpdir(), `code-agent-plusplus-agent-benchmark-${task.id}-${mode}-`));
  const repo = path.join(workspace, task.fixture);
  cpSync(path.join(benchmarkDir, "fixtures", task.fixture), repo, { recursive: true });
  mkdirSync(path.join(repo, ".agent-context", "agent-benchmark"), { recursive: true });

  if (mode !== "no-context") {
    const context = await buildContextPackage(repo);
    writeContextPackage(context);
  }

  initBaseline(repo, options.base ?? "main");

  const result =
    mode === "loop-enabled-harness" ? await runHarnessMode(repo, task, executor, options) : await runDirectMode(repo, task, mode, executor, options);

  if (!options.keepWorkdirs) rmSync(workspace, { recursive: true, force: true });
  return result;
}

async function runHarnessMode(
  repo: string,
  task: BenchmarkTaskDefinition,
  executor: AgentExecutorName,
  options: AgentBehaviorBenchmarkOptions
): Promise<AgentBehaviorBenchmarkRun> {
  const result = await runHarnessOrchestrator(repo, task.task, {
    executor,
    executorCommand: options.executorCommand,
    agent: options.agent,
    maxLoops: options.maxLoops ?? 3,
    failOn: options.failOn ?? "required",
    type: task.type ?? "auto",
    base: options.base ?? "main",
    dryRun: options.dryRun
  });
  const changedFiles = sourceChangedFiles(repo, options.base ?? "main");
  const postContext = await buildContextPackage(repo);
  const hallucination = buildHallucinationReport(postContext, { base: options.base ?? "main", traceId: result.report.traceId, task: task.task });
  const regression = buildRegressionReport(postContext, { base: options.base ?? "main", traceId: result.report.traceId, task: task.task, changedFiles });
  const policy = buildPolicyReport(postContext, { base: options.base ?? "main", traceId: result.report.traceId, failOn: options.failOn ?? "required" });

  return {
    taskId: task.id,
    fixture: task.fixture,
    task: task.task,
    mode: "loop-enabled-harness",
    executor,
    workdir: repo,
    changedFiles,
    unrelatedChanges: unrelatedChanges(changedFiles, task),
    passedTests: policy.passed && policy.summary.requiredMissing === 0 && result.report.executorResult.exitCode === 0,
    missingEvidence: policy.summary.requiredMissing,
    loopCount: result.report.iterations.length,
    finalDecision: result.report.decision.action,
    finalGate: result.report.decision.blocking ? "blocked" : "strong",
    hallucinationFindings: hallucination.summary.errors + hallucination.summary.warnings,
    regressionFindings: regression.summary.matches,
    exitCode: result.report.executorResult.exitCode
  };
}

async function runDirectMode(
  repo: string,
  task: BenchmarkTaskDefinition,
  mode: Exclude<AgentRunMode, "loop-enabled-harness">,
  executor: AgentExecutorName,
  options: AgentBehaviorBenchmarkOptions
): Promise<AgentBehaviorBenchmarkRun> {
  const runDir = path.join(repo, ".agent-context", "agent-benchmark", task.id, mode);
  mkdirSync(runDir, { recursive: true });
  const prompt = await promptForMode(repo, task, mode);
  const promptFile = path.join(runDir, "prompt.md");
  writeFileSync(promptFile, `${prompt.trim()}\n`, "utf8");
  const trace = startExecutionTrace(repo, task.task, { id: `${task.id}-${mode}`, agent: executor });
  const startedAt = new Date().toISOString();
  const beforeHash = currentWorkingTreeHash(repo);
  const execution = runExecutor(repo, runDir, promptFile, task.task, executor, options);
  const finishedAt = new Date().toISOString();
  const afterHash = currentWorkingTreeHash(repo);
  const normalized = normalizeAgentEvents({
    executor,
    stdout: execution.stdout,
    stderr: execution.stderr,
    repo,
    startedAt,
    finishedAt,
    exitCode: execution.exitCode
  });

  appendExecutionTraceStep(repo, trace.id, {
    agent: executor,
    action: "agent-execute",
    command: execution.command,
    result: execution.exitCode === 0 ? "passed" : "failed",
    finalState: execution.exitCode === 0 ? "partial_success" : "blocked",
    evidenceSource: execution.command ? "command" : "manual",
    capturedBy: execution.command ? "code-agent-plusplus" : "external",
    exitCode: execution.exitCode,
    startedAt,
    finishedAt,
    workingTreeHashBefore: beforeHash,
    workingTreeHashAfter: afterHash,
    output: [execution.stdout.trim(), execution.stderr.trim()].filter(Boolean).join("\n")
  });
  for (const event of normalized.events) {
    if (event.type === "test_run" || event.type === "command_run") {
      appendExecutionTraceStep(repo, trace.id, {
        at: event.ts,
        agent: executor,
        action: event.type === "test_run" ? "run-test" : "run-command",
        command: event.command,
        result: event.exitCode === undefined ? "unknown" : event.exitCode === 0 ? "passed" : "failed",
        evidenceSource: "command",
        capturedBy: "external",
        exitCode: event.exitCode,
        startedAt: event.ts,
        finishedAt: event.ts
      });
    }
  }

  const changedFiles = sourceChangedFiles(repo, options.base ?? "main");
  const postContext = await buildContextPackage(repo);
  const hallucination = buildHallucinationReport(postContext, { base: options.base ?? "main", traceId: trace.id, task: task.task });
  const regression = buildRegressionReport(postContext, { base: options.base ?? "main", traceId: trace.id, task: task.task, changedFiles });
  const policy = buildPolicyReport(postContext, { base: options.base ?? "main", traceId: trace.id, failOn: options.failOn ?? "required" });
  const loop = buildLoopControllerReport(postContext, task.task, {
    phase: "after-edit",
    base: options.base ?? "main",
    type: task.type ?? "auto",
    traceId: trace.id
  });

  return {
    taskId: task.id,
    fixture: task.fixture,
    task: task.task,
    mode,
    executor,
    workdir: repo,
    changedFiles,
    unrelatedChanges: unrelatedChanges(changedFiles, task),
    passedTests: policy.passed && policy.summary.requiredMissing === 0 && execution.exitCode === 0,
    missingEvidence: policy.summary.requiredMissing,
    loopCount: 1,
    finalDecision: policy.passed ? "weak-pass" : "weak-block",
    finalGate: policy.passed && loop.status === "ready" ? (mode === "context-pack" ? "medium" : "weak") : "blocked",
    hallucinationFindings: hallucination.summary.errors + hallucination.summary.warnings,
    regressionFindings: regression.summary.matches,
    exitCode: execution.exitCode
  };
}

async function promptForMode(repo: string, task: BenchmarkTaskDefinition, mode: Exclude<AgentRunMode, "loop-enabled-harness">): Promise<string> {
  if (mode === "no-context") {
    return [`Task: ${task.task}`, "", "Edit the repository to complete the task. Run relevant tests if available."].join("\n");
  }
  if (mode === "agents-md") {
    return [`Task: ${task.task}`, "", "Read AGENTS.md before editing. Keep changes minimal and run relevant tests."].join("\n");
  }

  const context = await buildContextPackage(repo);
  const run = writeTaskRun(context, task.task, { type: task.type ?? "auto", base: "main", preserveTrace: true });
  return [
    `Task: ${task.task}`,
    "",
    `Use the task context pack at ${path.relative(repo, run.dir).replaceAll("\\", "/")}.`,
    "Read plan.md, edit-boundary.md, pack.md, tests.md, impact.md, and prompt.codex.md before editing.",
    "Keep changes inside the boundary and run required verification."
  ].join("\n");
}

function runExecutor(
  repo: string,
  runDir: string,
  promptFile: string,
  task: string,
  executor: AgentExecutorName,
  options: AgentBehaviorBenchmarkOptions
): { exitCode: number | null; command?: string; stdout: string; stderr: string } {
  if (options.dryRun || executor === "mock") {
    return {
      exitCode: 0,
      stdout: `mock ${executor} benchmark run completed for ${path.basename(runDir)}`,
      stderr: ""
    };
  }
  if (!options.executorCommand) {
    return {
      exitCode: 2,
      stderr: `No executor command configured for ${executor}.`,
      stdout: ""
    };
  }

  const command = expandExecutorCommand(options.executorCommand, {
    promptFile,
    task,
    repo,
    runDir,
    agent: options.agent
  });
  const result = runSafeCommand(command, { cwd: repo, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  return {
    exitCode: result.status,
    command,
    stdout: result.stdout,
    stderr: result.stderr
  };
}

function prepareBenchmarkMode(value: string): AgentRunMode {
  if (value === "no-context" || value === "agents-md" || value === "context-pack" || value === "loop-enabled-harness") return value;
  throw new Error(`Unsupported benchmark mode: ${value}`);
}

export function parseAgentBenchmarkModes(value: string | undefined): AgentRunMode[] | undefined {
  if (!value) return undefined;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map(prepareBenchmarkMode);
}

function initBaseline(repo: string, base: string): void {
  runGit(repo, ["init"]);
  runGit(repo, ["checkout", "-b", base]);
  runGit(repo, ["config", "user.email", "code-agent-plusplus@example.com"]);
  runGit(repo, ["config", "user.name", "Code Agent++ Benchmark"]);
  runGit(repo, ["add", "."]);
  runGit(repo, ["commit", "-m", "benchmark baseline"]);
}

function readTasks(tasksDir: string): BenchmarkTaskDefinition[] {
  return readdirSync(tasksDir)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort()
    .map((fileName) => readJson<BenchmarkTaskDefinition>(path.join(tasksDir, fileName)));
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function sourceChangedFiles(repo: string, base: string): string[] {
  const files = new Set<string>();
  try {
    for (const file of changedFilesSince(repo, base)) {
      if (!isGeneratedContext(file)) files.add(file);
    }
  } catch {
    return [];
  }
  return [...files].sort();
}

function unrelatedChanges(changedFiles: string[], task: BenchmarkTaskDefinition): number {
  const allowed = new Set(task.changedFiles);
  return changedFiles.filter((file) => !allowed.has(file) && !isLikelyTestForTask(file, task)).length;
}

function isLikelyTestForTask(filePath: string, task: BenchmarkTaskDefinition): boolean {
  if (!/(^|\/)(test|tests|__tests__)\//i.test(filePath) && !/[.](test|spec)[.][cm]?[jt]sx?$/i.test(filePath) && !/(^|\/)test_.*[.]py$/i.test(filePath))
    return false;
  const taskTerms = new Set(task.changedFiles.flatMap((file) => file.toLowerCase().split(/[/_.-]+/)).filter((term) => term.length >= 4));
  return filePath
    .toLowerCase()
    .split(/[/_.-]+/)
    .some((term) => taskTerms.has(term));
}

function isGeneratedContext(filePath: string): boolean {
  return filePath === "AGENTS.md" || filePath.startsWith(".agent-context/");
}

function summarizeAgentBehavior(runs: AgentBehaviorBenchmarkRun[], modes: AgentRunMode[]): AgentBehaviorModeSummary[] {
  return modes.map((mode) => {
    const modeRuns = runs.filter((run) => run.mode === mode);
    return {
      mode,
      runs: modeRuns.length,
      wrongEdits: average(modeRuns.map((run) => run.unrelatedChanges)),
      staleEvidence: average(modeRuns.map((run) => run.missingEvidence)),
      testPassRate: average(modeRuns.map((run) => (run.passedTests ? 1 : 0))),
      loops: average(modeRuns.map((run) => run.loopCount)),
      finalGate: summarizeGate(modeRuns)
    };
  });
}

function summarizeGate(runs: AgentBehaviorBenchmarkRun[]): AgentBenchmarkGate {
  if (!runs.length) return "blocked";
  if (runs.some((run) => run.finalGate === "blocked")) return "blocked";
  if (runs.some((run) => run.finalGate === "weak")) return "weak";
  if (runs.some((run) => run.finalGate === "medium")) return "medium";
  return "strong";
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function expandExecutorCommand(
  command: string,
  input: {
    promptFile: string;
    task: string;
    repo: string;
    runDir: string;
    agent?: string;
  }
): string {
  const replacements: Record<string, string> = {
    "{prompt}": shellQuote(input.promptFile),
    "{task}": shellQuote(input.task),
    "{repo}": shellQuote(input.repo),
    "{runDir}": shellQuote(input.runDir),
    "{agent}": shellQuote(input.agent ?? "")
  };
  let expanded = command;
  for (const [token, value] of Object.entries(replacements)) expanded = expanded.replaceAll(token, value);
  return expanded;
}

function displayMode(mode: AgentRunMode): string {
  const labels: Record<AgentRunMode, string> = {
    "no-context": "A. no context",
    "agents-md": "B. AGENTS.md",
    "context-pack": "C. context pack",
    "loop-enabled-harness": "D. harness-led"
  };
  return labels[mode];
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
