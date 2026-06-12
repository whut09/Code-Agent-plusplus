import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { TaskType } from "../core/types.js";
import { buildContextPackage } from "../core/context-builder.js";
import { buildTaskPack } from "../outputs/task-context.js";
import { buildTestSelection } from "../outputs/test-selector.js";
import { code, heading, table } from "../outputs/markdown.js";

export interface BenchmarkTaskDefinition {
  id: string;
  fixture: string;
  task: string;
  type?: TaskType;
  changedFiles: string[];
  topK?: number;
  tokenBudget?: number;
}

export interface BenchmarkOptions {
  benchmarkDir?: string;
  topK?: number;
}

export type AgentRunMode = "no-context" | "agents-md" | "task-pack" | "task-pack-contracts-verify";

export interface AgentRunRecord {
  task: string;
  agent: string;
  mode: AgentRunMode;
  changedFiles: string[];
  passedTests: boolean;
  unrelatedChanges: number;
  score: number;
  foundCorrectFiles?: boolean;
  modifiedCorrectLocation?: boolean;
  tokenUsage?: number;
  iterations?: number;
  notes?: string;
}

export interface AgentRunModeSummary {
  mode: AgentRunMode;
  runs: number;
  averageScore: number;
  passRate: number;
  averageUnrelatedChanges: number;
  averageTokenUsage: number | null;
  averageIterations: number | null;
}

export interface BenchmarkCaseResult {
  id: string;
  fixture: string;
  task: string;
  topK: number;
  expectedRelevantFiles: string[];
  expectedRequiredTests: string[];
  selectedFiles: string[];
  selectedTopK: string[];
  baselineTopK: string[];
  recommendedTests: string[];
  agentRuns: AgentRunRecord[];
  agentRunModes: AgentRunModeSummary[];
  metrics: {
    recallAtK: number;
    precisionAtK: number;
    baselineRecallAtK: number;
    tokenCompressionRatio: number;
    testRecommendationAccuracy: number;
    contextPackSuccessProxy: number;
    baselineSuccessProxy: number;
    agentSuccessDeltaProxy: number;
    agentSuccessDelta: number | null;
  };
}

export interface BenchmarkRunResult {
  benchmarkDir: string;
  topK: number;
  cases: BenchmarkCaseResult[];
  summary: BenchmarkSummary;
}

export interface BenchmarkSummary {
  cases: number;
  averageRecallAtK: number;
  averagePrecisionAtK: number;
  averageBaselineRecallAtK: number;
  averageTokenCompressionRatio: number;
  averageTestRecommendationAccuracy: number;
  averageAgentSuccessDeltaProxy: number;
  averageAgentSuccessDelta: number | null;
  agentRunCases: number;
}

export async function runBenchmark(options: BenchmarkOptions = {}): Promise<BenchmarkRunResult> {
  const benchmarkDir = path.resolve(options.benchmarkDir ?? "benchmarks");
  const topK = options.topK ?? 8;
  const tasks = readTasks(path.join(benchmarkDir, "tasks"));
  const relevantFiles = readJson<Record<string, string[]>>(path.join(benchmarkDir, "expected", "relevant-files.json"));
  const requiredTests = readJson<Record<string, string[]>>(path.join(benchmarkDir, "expected", "required-tests.json"));
  const agentRuns = readAgentRuns(path.join(benchmarkDir, "agent-runs"));
  const cases: BenchmarkCaseResult[] = [];

  for (const task of tasks) {
    const fixtureRoot = path.join(benchmarkDir, "fixtures", task.fixture);
    const context = await buildContextPackage(fixtureRoot);
    const caseTopK = task.topK ?? topK;
    const pack = buildTaskPack(context, task.task, { type: task.type ?? "auto", tokenBudget: task.tokenBudget });
    const selectedFiles = pack.files.map((file) => file.path);
    const selectedTopK = selectedFiles.slice(0, caseTopK);
    const expectedRelevantFiles = relevantFiles[task.id] ?? [];
    const expectedRequiredTests = requiredTests[task.id] ?? [];
    const testSelection = buildTestSelection(context, { forPaths: task.changedFiles });
    const recommendedTests = unique([...testSelection.minimalTests, ...testSelection.recommendedRegressionTests]);
    const baselineTopK = context.keyFiles.slice(0, caseTopK).map((file) => file.path);
    const recallAtK = recall(expectedRelevantFiles, selectedTopK);
    const precisionAtK = precision(expectedRelevantFiles, selectedTopK, caseTopK);
    const baselineRecallAtK = recall(expectedRelevantFiles, baselineTopK);
    const testRecommendationAccuracy = recall(expectedRequiredTests, recommendedTests);
    const baselineTestAccuracy = recall(expectedRequiredTests, baselineTopK);
    const contextPackSuccessProxy = recallAtK === 1 && testRecommendationAccuracy === 1 ? 1 : 0;
    const baselineSuccessProxy = baselineRecallAtK === 1 && baselineTestAccuracy === 1 ? 1 : 0;
    const tokenCompressionRatio = ratio(context.tokenSavings.originalRepoTokens.tokens, pack.estimatedTokens);
    const caseAgentRuns = agentRuns.filter((run) => run.task === task.id || run.task === task.task);
    const agentRunModes = summarizeAgentRuns(caseAgentRuns);
    const agentSuccessDelta = realAgentSuccessDelta(agentRunModes);

    cases.push({
      id: task.id,
      fixture: task.fixture,
      task: task.task,
      topK: caseTopK,
      expectedRelevantFiles,
      expectedRequiredTests,
      selectedFiles,
      selectedTopK,
      baselineTopK,
      recommendedTests,
      agentRuns: caseAgentRuns,
      agentRunModes,
      metrics: {
        recallAtK,
        precisionAtK,
        baselineRecallAtK,
        tokenCompressionRatio,
        testRecommendationAccuracy,
        contextPackSuccessProxy,
        baselineSuccessProxy,
        agentSuccessDeltaProxy: contextPackSuccessProxy - baselineSuccessProxy,
        agentSuccessDelta
      }
    });
  }

  return {
    benchmarkDir,
    topK,
    cases,
    summary: summarize(cases)
  };
}

export function renderBenchmarkReport(result: BenchmarkRunResult): string {
  return [
    heading(1, "Context Quality Benchmark"),
    "",
    `Benchmark dir: ${code(result.benchmarkDir)}`,
    `Cases: ${result.summary.cases}`,
    `Cases with agent runs: ${result.summary.agentRunCases}`,
    `Default K: ${result.topK}`,
    "",
    heading(2, "Summary"),
    table(
      ["Metric", "Value"],
      [
        ["Recall@K", percent(result.summary.averageRecallAtK)],
        ["Precision@K", percent(result.summary.averagePrecisionAtK)],
        ["Baseline Recall@K", percent(result.summary.averageBaselineRecallAtK)],
        ["Token compression ratio", `${result.summary.averageTokenCompressionRatio.toFixed(1)}x`],
        ["Test recommendation accuracy", percent(result.summary.averageTestRecommendationAccuracy)],
        ["Agent success delta", result.summary.averageAgentSuccessDelta === null ? "No agent-run records" : signed(result.summary.averageAgentSuccessDelta)],
        ["Agent success delta proxy", signed(result.summary.averageAgentSuccessDeltaProxy)]
      ]
    ),
    "",
    heading(2, "Cases"),
    table(
      ["Task", "Fixture", "Recall@K", "Precision@K", "Tests", "Compression", "Agent Delta", "Delta Proxy"],
      result.cases.map((item) => [
        item.id,
        item.fixture,
        percent(item.metrics.recallAtK),
        percent(item.metrics.precisionAtK),
        percent(item.metrics.testRecommendationAccuracy),
        `${item.metrics.tokenCompressionRatio.toFixed(1)}x`,
        item.metrics.agentSuccessDelta === null ? "n/a" : signed(item.metrics.agentSuccessDelta),
        signed(item.metrics.agentSuccessDeltaProxy)
      ])
    ),
    "",
    heading(2, "Agent Run Modes"),
    renderAgentRunModes(result),
    "",
    heading(2, "Interpretation"),
    "- Recall@K: expected task-relevant files present in the task pack top K.",
    "- Precision@K: top K slots that are expected task-relevant files.",
    "- Baseline Recall@K: same recall using non-task-aware key files as the baseline.",
    "- Token compression ratio: original fixture token estimate divided by selected task-pack token estimate.",
    "- Test recommendation accuracy: expected tests present in minimal or regression recommendations.",
    "- Agent success delta: average score improvement from `no-context` to `task-pack-contracts-verify` when `benchmarks/agent-runs/*.json` records are present.",
    "- Agent success delta proxy: deterministic fallback comparing task-pack coverage with baseline coverage when no agent-run records exist."
  ].join("\n");
}

function renderAgentRunModes(result: BenchmarkRunResult): string {
  const rows = result.cases.flatMap((item) =>
    item.agentRunModes.map((mode) => [
      item.id,
      mode.mode,
      mode.runs.toString(),
      signed(mode.averageScore),
      percent(mode.passRate),
      mode.averageUnrelatedChanges.toFixed(1),
      mode.averageTokenUsage === null ? "n/a" : Math.round(mode.averageTokenUsage).toLocaleString(),
      mode.averageIterations === null ? "n/a" : mode.averageIterations.toFixed(1)
    ])
  );

  if (!rows.length) {
    return "No `benchmarks/agent-runs/*.json` records found.";
  }

  return table(["Task", "Mode", "Runs", "Score", "Pass", "Unrelated", "Tokens", "Iterations"], rows);
}

function readTasks(tasksDir: string): BenchmarkTaskDefinition[] {
  return readdirSync(tasksDir)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort()
    .map((fileName) => readJson<BenchmarkTaskDefinition>(path.join(tasksDir, fileName)));
}

function readAgentRuns(agentRunsDir: string): AgentRunRecord[] {
  if (!existsSync(agentRunsDir)) return [];
  return readdirSync(agentRunsDir)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort()
    .flatMap((fileName) => {
      const parsed = readJson<AgentRunRecord | AgentRunRecord[]>(path.join(agentRunsDir, fileName));
      return (Array.isArray(parsed) ? parsed : [parsed]).filter(isAgentRunRecord);
    });
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function recall(expected: string[], actual: string[]): number {
  if (!expected.length) return 1;
  const actualSet = new Set(actual);
  return expected.filter((item) => actualSet.has(item)).length / expected.length;
}

function precision(expected: string[], actual: string[], k: number): number {
  if (k <= 0) return 0;
  const expectedSet = new Set(expected);
  return actual.slice(0, k).filter((item) => expectedSet.has(item)).length / k;
}

function ratio(numerator: number, denominator: number): number {
  return numerator / Math.max(1, denominator);
}

function summarize(cases: BenchmarkCaseResult[]): BenchmarkSummary {
  const realDeltas = cases.map((item) => item.metrics.agentSuccessDelta).filter((value): value is number => typeof value === "number");
  return {
    cases: cases.length,
    averageRecallAtK: average(cases.map((item) => item.metrics.recallAtK)),
    averagePrecisionAtK: average(cases.map((item) => item.metrics.precisionAtK)),
    averageBaselineRecallAtK: average(cases.map((item) => item.metrics.baselineRecallAtK)),
    averageTokenCompressionRatio: average(cases.map((item) => item.metrics.tokenCompressionRatio)),
    averageTestRecommendationAccuracy: average(cases.map((item) => item.metrics.testRecommendationAccuracy)),
    averageAgentSuccessDeltaProxy: average(cases.map((item) => item.metrics.agentSuccessDeltaProxy)),
    averageAgentSuccessDelta: realDeltas.length ? average(realDeltas) : null,
    agentRunCases: cases.filter((item) => item.agentRuns.length > 0).length
  };
}

function summarizeAgentRuns(runs: AgentRunRecord[]): AgentRunModeSummary[] {
  const modes: AgentRunMode[] = ["no-context", "agents-md", "task-pack", "task-pack-contracts-verify"];
  return modes
    .map((mode) => {
      const modeRuns = runs.filter((run) => run.mode === mode);
      return {
        mode,
        runs: modeRuns.length,
        averageScore: average(modeRuns.map((run) => run.score)),
        passRate: average(modeRuns.map((run) => (run.passedTests ? 1 : 0))),
        averageUnrelatedChanges: average(modeRuns.map((run) => run.unrelatedChanges)),
        averageTokenUsage: nullableAverage(modeRuns.map((run) => run.tokenUsage).filter((value): value is number => typeof value === "number")),
        averageIterations: nullableAverage(modeRuns.map((run) => run.iterations).filter((value): value is number => typeof value === "number"))
      };
    })
    .filter((summary) => summary.runs > 0);
}

function realAgentSuccessDelta(modes: AgentRunModeSummary[]): number | null {
  const baseline = modes.find((mode) => mode.mode === "no-context");
  const harness =
    modes.find((mode) => mode.mode === "task-pack-contracts-verify") ??
    modes.find((mode) => mode.mode === "task-pack") ??
    modes.find((mode) => mode.mode === "agents-md");
  if (!baseline || !harness) return null;
  return harness.averageScore - baseline.averageScore;
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function nullableAverage(values: number[]): number | null {
  return values.length ? average(values) : null;
}

function isAgentRunRecord(value: AgentRunRecord): value is AgentRunRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as AgentRunRecord).task === "string" &&
    typeof (value as AgentRunRecord).agent === "string" &&
    ["no-context", "agents-md", "task-pack", "task-pack-contracts-verify"].includes((value as AgentRunRecord).mode) &&
    Array.isArray((value as AgentRunRecord).changedFiles) &&
    typeof (value as AgentRunRecord).passedTests === "boolean" &&
    typeof (value as AgentRunRecord).unrelatedChanges === "number" &&
    typeof (value as AgentRunRecord).score === "number"
  );
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function signed(value: number): string {
  return value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}
