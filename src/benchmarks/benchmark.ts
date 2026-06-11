import { readdirSync, readFileSync } from "node:fs";
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
  metrics: {
    recallAtK: number;
    precisionAtK: number;
    baselineRecallAtK: number;
    tokenCompressionRatio: number;
    testRecommendationAccuracy: number;
    contextPackSuccessProxy: number;
    baselineSuccessProxy: number;
    agentSuccessDeltaProxy: number;
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
}

export async function runBenchmark(options: BenchmarkOptions = {}): Promise<BenchmarkRunResult> {
  const benchmarkDir = path.resolve(options.benchmarkDir ?? "benchmarks");
  const topK = options.topK ?? 8;
  const tasks = readTasks(path.join(benchmarkDir, "tasks"));
  const relevantFiles = readJson<Record<string, string[]>>(path.join(benchmarkDir, "expected", "relevant-files.json"));
  const requiredTests = readJson<Record<string, string[]>>(path.join(benchmarkDir, "expected", "required-tests.json"));
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
      metrics: {
        recallAtK,
        precisionAtK,
        baselineRecallAtK,
        tokenCompressionRatio,
        testRecommendationAccuracy,
        contextPackSuccessProxy,
        baselineSuccessProxy,
        agentSuccessDeltaProxy: contextPackSuccessProxy - baselineSuccessProxy
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
        ["Agent success delta proxy", signed(result.summary.averageAgentSuccessDeltaProxy)]
      ]
    ),
    "",
    heading(2, "Cases"),
    table(
      ["Task", "Fixture", "Recall@K", "Precision@K", "Tests", "Compression", "Delta Proxy"],
      result.cases.map((item) => [
        item.id,
        item.fixture,
        percent(item.metrics.recallAtK),
        percent(item.metrics.precisionAtK),
        percent(item.metrics.testRecommendationAccuracy),
        `${item.metrics.tokenCompressionRatio.toFixed(1)}x`,
        signed(item.metrics.agentSuccessDeltaProxy)
      ])
    ),
    "",
    heading(2, "Interpretation"),
    "- Recall@K: expected task-relevant files present in the task pack top K.",
    "- Precision@K: top K slots that are expected task-relevant files.",
    "- Baseline Recall@K: same recall using non-task-aware key files as the baseline.",
    "- Token compression ratio: original fixture token estimate divided by selected task-pack token estimate.",
    "- Test recommendation accuracy: expected tests present in minimal or regression recommendations.",
    "- Agent success delta proxy: deterministic proxy comparing task-pack coverage with baseline coverage; it is not a live agent run."
  ].join("\n");
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
  return {
    cases: cases.length,
    averageRecallAtK: average(cases.map((item) => item.metrics.recallAtK)),
    averagePrecisionAtK: average(cases.map((item) => item.metrics.precisionAtK)),
    averageBaselineRecallAtK: average(cases.map((item) => item.metrics.baselineRecallAtK)),
    averageTokenCompressionRatio: average(cases.map((item) => item.metrics.tokenCompressionRatio)),
    averageTestRecommendationAccuracy: average(cases.map((item) => item.metrics.testRecommendationAccuracy)),
    averageAgentSuccessDeltaProxy: average(cases.map((item) => item.metrics.agentSuccessDeltaProxy))
  };
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
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
