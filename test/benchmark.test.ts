import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { runBenchmark, renderBenchmarkReport } from "../src/benchmarks/benchmark.js";

test("benchmark evaluates task-pack quality against expected files and tests", async () => {
  const result = await runBenchmark({ benchmarkDir: path.resolve("benchmarks"), topK: 8 });

  assert.equal(result.summary.cases, 4);
  assert.ok(result.summary.averageRecallAtK > 0.5);
  assert.ok(result.summary.averagePrecisionAtK > 0);
  assert.ok(result.summary.averageTokenCompressionRatio > 1);
  assert.ok(result.summary.averageTestRecommendationAccuracy > 0.5);
  assert.ok(result.cases.every((item) => item.selectedTopK.length > 0));
  assert.ok(result.cases.every((item) => item.recommendedTests.length > 0));

  const markdown = renderBenchmarkReport(result);
  assert.match(markdown, /# Context Quality Benchmark/);
  assert.match(markdown, /Recall@K/);
  assert.match(markdown, /Agent success delta proxy/);
});
