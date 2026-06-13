#!/usr/bin/env node
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Command } from "commander";
import type { AgentTarget, IndexedFile, TaskType } from "../core/types.js";
import { buildContextPackage } from "../core/context-builder.js";
import { changedFilesSince } from "../core/git.js";
import { writeContextPackage } from "../outputs/writer.js";
import { renderDependencyGraph } from "../outputs/dependency-graph.js";
import { summarizeReadiness } from "../core/readiness.js";
import { formatTokenSavings } from "../core/token-savings.js";
import { buildRagDocuments, buildRagManifest } from "../outputs/rag.js";
import { renderChangeImpactReport } from "../outputs/impact.js";
import { renderTaskContext } from "../outputs/task-context.js";
import { renderTestSelection } from "../outputs/test-selector.js";
import { renderBenchmarkReport, runBenchmark } from "../benchmarks/benchmark.js";
import { renderTaskPlan, renderTaskVerify, writeTaskContextPack } from "../outputs/task-harness.js";
import { writeTaskRun } from "../outputs/task-run.js";
import { renderContractValidationReport, validateContracts } from "../outputs/contract-validator.js";
import { validateContextPackage } from "../core/validator.js";
import { assessDrift, assessFreshness, renderDriftReport, renderFreshnessReport } from "../core/freshness.js";
import { starterConfig } from "../config/starter-config.js";
import { parseTokenizerMode } from "../core/token-estimator.js";
import { resolveTaskArguments } from "./task-args.js";
import { createContextRetriever, renderContextHits, type RetrieverProvider } from "../retrievers/index.js";

const program = new Command();

program.name("repo-context").description("Generate minimal, evidence-linked, task-aware context for coding agents.").version("0.1.0");

program
  .command("build")
  .argument("[repo]", "repository path", ".")
  .option("-t, --target <target>", "agent target: codex, claude, cursor, all", parseTarget)
  .option("-b, --token-budget <tokens>", "target token budget", parseInteger)
  .option("--tokenizer <tokenizer>", "tokenizer: chars-approx, cl100k_base, o200k_base", parseTokenizerMode)
  .option("--model <model>", "model name used to infer tokenizer, for example gpt-4.1")
  .option("--llm", "enable LLM summaries using repo-context.local.yml")
  .option("--no-llm", "disable LLM summaries")
  .description("Generate AGENTS.md and .agent-context outputs.")
  .action(
    async (
      repo: string,
      options: { target?: AgentTarget; tokenBudget?: number; tokenizer?: ReturnType<typeof parseTokenizerMode>; model?: string; llm?: boolean }
    ) => {
      const context = await buildContextPackage(repo, options);
      const result = writeContextPackage(context);
      console.log(`Generated agent context for ${context.scan.root}`);
      console.log(`Files scanned: ${context.scan.files.length}`);
      console.log(`Languages: ${context.scan.languages.join(", ") || "none detected"}`);
      console.log(`Key files: ${context.keyFiles.length}`);
      console.log(`Agent readiness: ${context.readiness.grade} / ${context.readiness.score}`);
      console.log(`Summary mode: ${context.summaries.mode}`);
      if (context.summaries.fallbackReason && context.summaries.fallbackReason !== "disabled") {
        console.log(`LLM fallback reason: ${context.summaries.fallbackReason}`);
      }
      console.log(formatTokenSavings(context.tokenSavings));
      console.log("Written:");
      for (const file of result.files) {
        console.log(`- ${path.relative(context.scan.root, file)}`);
      }
    }
  );

program
  .command("savings")
  .argument("[repo]", "repository path", ".")
  .option("-b, --token-budget <tokens>", "target token budget", parseInteger)
  .option("--actual", "write the context package first and report actual generated output tokens")
  .option("--tokenizer <tokenizer>", "tokenizer: chars-approx, cl100k_base, o200k_base", parseTokenizerMode)
  .option("--model <model>", "model name used to infer tokenizer, for example gpt-4.1")
  .description("Print the token savings report.")
  .action(async (repo: string, options: { tokenBudget?: number; actual?: boolean; tokenizer?: ReturnType<typeof parseTokenizerMode>; model?: string }) => {
    const context = await buildContextPackage(repo, options);
    if (options.actual) {
      writeContextPackage(context);
    }
    console.log(formatTokenSavings(context.tokenSavings));
  });

const rag = program.command("rag").description("RAG integration commands.");

rag
  .command("export")
  .argument("[repo]", "repository path", ".")
  .option("-b, --token-budget <tokens>", "target token budget", parseInteger)
  .description("Print a LightRAG-friendly export summary.")
  .action(async (repo: string, options: { tokenBudget?: number }) => {
    const context = await buildContextPackage(repo, options);
    const documents = buildRagDocuments(context);
    const manifest = buildRagManifest(context, documents.length);
    console.log("# LightRAG Export");
    console.log("");
    console.log(`Documents: ${documents.length}`);
    console.log(`Provider: ${manifest.provider}`);
    console.log(`Mode: ${manifest.mode}`);
    console.log("");
    console.log("Run `repo-context build` to write `.agent-context/rag/documents.jsonl`.");
  });

rag
  .command("search")
  .argument("<task>", "task or search query")
  .argument("[repo]", "repository path", ".")
  .option("--provider <provider>", "retriever provider: static, ripgrep, hybrid, lightrag, embedding", parseRetrieverProvider, "hybrid")
  .option("-k, --top-k <count>", "number of context hits", parseInteger, 8)
  .option("--modules <modules>", "comma-separated module filter")
  .option("--changed-files <files>", "comma-separated changed file filter")
  .option("--include-tests", "include test files in retrieval results")
  .option("--json", "print machine-readable context hits")
  .description("Search repository context through the unified retrieval protocol.")
  .action(async (task: string, repo: string, options: RetrieveCliOptions) => {
    const context = await buildContextPackage(repo);
    const retriever = createContextRetriever(context, options.provider);
    const hits = await retriever.search(task, retrieveOptions(options));
    console.log(options.json ? JSON.stringify(hits, null, 2) : renderContextHits(task, options.provider, hits));
  });

program
  .command("init")
  .argument("[repo]", "repository path", ".")
  .description("Create a starter repo-context.config.yml.")
  .action((repo: string) => {
    const root = path.resolve(repo);
    const configPath = path.join(root, "repo-context.config.yml");

    if (existsSync(configPath)) {
      console.log(`Config already exists: ${configPath}`);
      return;
    }

    writeFileSync(configPath, starterConfig(), "utf8");
    console.log(`Created ${configPath}`);
  });

program
  .command("graph")
  .argument("[repo]", "repository path", ".")
  .description("Print the generated dependency graph markdown.")
  .action(async (repo: string) => {
    const context = await buildContextPackage(repo);
    console.log(renderDependencyGraph(context));
  });

program
  .command("readiness")
  .argument("[repo]", "repository path", ".")
  .description("Print the agent readiness score and missing context signals.")
  .action(async (repo: string) => {
    const context = await buildContextPackage(repo);
    console.log(summarizeReadiness(context));
  });

program
  .command("validate")
  .argument("[repo]", "repository path", ".")
  .description("Validate config, generated JSON, dependency edges, confidence, and token budget.")
  .action(async (repo: string) => {
    const context = await buildContextPackage(repo);
    const report = validateContextPackage(context);
    console.log(report.valid ? "Validation: passed" : "Validation: failed");
    for (const issue of report.issues) {
      console.log(`- ${issue.severity.toUpperCase()} ${issue.code}: ${issue.message}`);
    }
    if (!report.valid) process.exitCode = 1;
  });

program
  .command("validate-contracts")
  .argument("[repo]", "repository path", ".")
  .option("--diff", "validate changed files from git diff and working tree", true)
  .option("--base <ref>", "base git ref", "main")
  .description("Validate changed files against generated agent contracts and edit boundaries.")
  .action(async (repo: string, options: { diff?: boolean; base: string }) => {
    const context = await buildContextPackage(repo);
    const report = validateContracts(context, { base: options.base, diff: options.diff });
    console.log(renderContractValidationReport(context, { base: options.base, diff: options.diff }));
    if (!report.passed) process.exitCode = 1;
  });

program
  .command("freshness")
  .argument("[repo]", "repository path", ".")
  .option("--json", "print machine-readable freshness report")
  .description("Check whether AGENTS.md and .agent-context were generated from the current source, config, and commit.")
  .action(async (repo: string, options: { json?: boolean }) => {
    const context = await buildContextPackage(repo);
    const report = assessFreshness(context);
    console.log(options.json ? JSON.stringify(report, null, 2) : renderFreshnessReport(report));
    if (report.status !== "fresh") process.exitCode = 1;
  });

program
  .command("drift")
  .argument("[repo]", "repository path", ".")
  .option("--json", "print machine-readable drift report")
  .description("Detect stale generated context, dependency graph, task pack, and contract drift.")
  .action(async (repo: string, options: { json?: boolean }) => {
    const context = await buildContextPackage(repo);
    const report = assessDrift(context);
    console.log(options.json ? JSON.stringify(report, null, 2) : renderDriftReport(report));
    if (report.status !== "clean") process.exitCode = 1;
  });

program
  .command("run")
  .argument("<args...>", "task description and optional repository path")
  .option("--repo <repo...>", "repository path; accepts multiple words when the path contains spaces or non-ASCII characters")
  .option("--type <type>", "task type: auto, bugfix, feature, refactor", parseTaskType, "auto")
  .option("-b, --token-budget <tokens>", "task run context token budget", parseInteger)
  .option("--base <ref>", "base git ref for impact and verification reports", "main")
  .description("Write a complete task run under .agent-context/runs/<task-id> without editing code.")
  .action(async (args: string[], options: { repo?: string | string[]; type: TaskType; tokenBudget?: number; base: string }) => {
    const { task, repo } = resolveTaskArguments(args, options.repo);
    const context = await buildContextPackage(repo);
    const result = writeTaskRun(context, task, { type: options.type, tokenBudget: options.tokenBudget, base: options.base });
    console.log(`Wrote task run: ${path.relative(context.scan.root, result.dir).replaceAll("\\", "/")}`);
    console.log(`Risk level: ${result.manifest.riskLevel}`);
    console.log(`Context budget: ${result.manifest.contextBudget.usedTokens.toLocaleString()} / ${result.manifest.contextBudget.maxTokens.toLocaleString()}`);
    for (const file of result.files) {
      console.log(`- ${path.relative(context.scan.root, file).replaceAll("\\", "/")}`);
    }
  });

program
  .command("plan")
  .argument("<args...>", "task description and optional repository path")
  .option("--repo <repo...>", "repository path; accepts multiple words when the path contains spaces or non-ASCII characters")
  .option("--type <type>", "task type: auto, bugfix, feature, refactor", parseTaskType, "auto")
  .option("-b, --token-budget <tokens>", "task planning token budget", parseInteger)
  .description("Generate a task plan with inspection, risk, and validation guidance.")
  .action(async (args: string[], options: { repo?: string | string[]; type: TaskType; tokenBudget?: number }) => {
    const { task, repo } = resolveTaskArguments(args, options.repo);
    const context = await buildContextPackage(repo);
    console.log(renderTaskPlan(context, task, { type: options.type, tokenBudget: options.tokenBudget }));
  });

program
  .command("pack")
  .argument("<args...>", "task description and optional repository path")
  .option("--repo <repo...>", "repository path; accepts multiple words when the path contains spaces or non-ASCII characters")
  .option("--type <type>", "task type: auto, bugfix, feature, refactor", parseTaskType, "auto")
  .option("-b, --token-budget <tokens>", "task context token budget", parseInteger)
  .description("Write a task context pack under .agent-context/tasks/<task-id>.")
  .action(async (args: string[], options: { repo?: string | string[]; type: TaskType; tokenBudget?: number }) => {
    const { task, repo } = resolveTaskArguments(args, options.repo);
    const context = await buildContextPackage(repo);
    const result = writeTaskContextPack(context, task, { type: options.type, tokenBudget: options.tokenBudget });
    console.log(`Wrote task pack: ${path.relative(context.scan.root, result.dir).replaceAll("\\", "/")}`);
    for (const file of result.files) {
      console.log(`- ${path.relative(context.scan.root, file).replaceAll("\\", "/")}`);
    }
  });

program
  .command("verify")
  .argument("[repo]", "repository path", ".")
  .option("--diff", "verify changed files from git diff and working tree", true)
  .option("--base <ref>", "base git ref", "main")
  .description("Verify changed files against affected modules, tests, and risk signals.")
  .action(async (repo: string, options: { diff?: boolean; base: string }) => {
    const context = await buildContextPackage(repo);
    console.log(renderTaskVerify(context, { base: options.base, diff: options.diff }));
  });

program
  .command("task")
  .argument("<args...>", "task description and optional repository path")
  .option("--repo <repo...>", "repository path; accepts multiple words when the path contains spaces or non-ASCII characters")
  .option("--type <type>", "task type: auto, bugfix, feature, refactor", parseTaskType, "auto")
  .option("-b, --token-budget <tokens>", "task context token budget", parseInteger)
  .description("Generate a task-focused context recommendation.")
  .action(async (args: string[], options: { repo?: string | string[]; type: TaskType; tokenBudget?: number }) => {
    const { task, repo } = resolveTaskArguments(args, options.repo);
    const context = await buildContextPackage(repo);
    console.log(renderTaskContext(context, task, { type: options.type, tokenBudget: options.tokenBudget }));
  });

program
  .command("tests")
  .argument("[repo]", "repository path", ".")
  .option("--for <path...>", "select tests for one or more changed source files")
  .option("--diff", "select tests for files changed from the base ref")
  .option("--base <ref>", "base git ref for --diff", "main")
  .description("Select minimal, regression, and full-confidence tests for a file or diff.")
  .action(async (repo: string, options: { for?: string[]; diff?: boolean; base: string }) => {
    const context = await buildContextPackage(repo);
    console.log(renderTestSelection(context, { forPaths: options.for, diff: options.diff, base: options.base }));
  });

program
  .command("impact")
  .argument("[repo]", "repository path", ".")
  .option("--base <ref>", "base git ref", "main")
  .description("Analyze changed files, dependents, related tests, and required verification.")
  .action(async (repo: string, options: { base: string }) => {
    const context = await buildContextPackage(repo);
    console.log(renderChangeImpactReport(context, { base: options.base }));
  });

program
  .command("benchmark")
  .argument("[benchmarkDir]", "benchmark directory", "benchmarks")
  .option("-k, --top-k <count>", "top-K files used for recall/precision", parseInteger, 8)
  .option("--json", "print machine-readable benchmark results")
  .description("Run the context quality benchmark over benchmark fixtures.")
  .action(async (benchmarkDir: string, options: { topK: number; json?: boolean }) => {
    const result = await runBenchmark({ benchmarkDir, topK: options.topK });
    console.log(options.json ? JSON.stringify(result, null, 2) : renderBenchmarkReport(result));
  });

program
  .command("retrieve")
  .argument("<task>", "task or search query")
  .argument("[repo]", "repository path", ".")
  .option("--provider <provider>", "retriever provider: static, ripgrep, hybrid, lightrag, embedding", parseRetrieverProvider, "hybrid")
  .option("-k, --top-k <count>", "number of context hits", parseInteger, 8)
  .option("--modules <modules>", "comma-separated module filter")
  .option("--changed-files <files>", "comma-separated changed file filter")
  .option("--include-tests", "include test files in retrieval results")
  .option("--json", "print machine-readable context hits")
  .description("Search repository context through the unified retrieval protocol.")
  .action(async (task: string, repo: string, options: RetrieveCliOptions) => {
    const context = await buildContextPackage(repo);
    const retriever = createContextRetriever(context, options.provider);
    const hits = await retriever.search(task, retrieveOptions(options));
    console.log(options.json ? JSON.stringify(hits, null, 2) : renderContextHits(task, options.provider, hits));
  });

program
  .command("diff")
  .argument("[repo]", "repository path", ".")
  .option("--base <ref>", "base git ref", "main")
  .description("Generate context for files changed since a git base ref.")
  .action(async (repo: string, options: { base: string }) => {
    const context = await buildContextPackage(repo);
    const changed = new Set(changedFilesSince(context.scan.root, options.base));
    const files = context.index.files.filter((file) => changed.has(file.path));
    console.log("# Diff Context");
    console.log("");
    console.log(`Base: ${options.base}`);
    console.log("");
    printFileList(files);
  });

program
  .command("update")
  .argument("[repo]", "repository path", ".")
  .option("--since <ref>", "show changed files since a git ref after rebuilding", "main")
  .description("Rebuild the context package and report files changed since a git ref.")
  .action(async (repo: string, options: { since: string }) => {
    const context = await buildContextPackage(repo);
    const result = writeContextPackage(context);
    const changed = changedFilesSince(context.scan.root, options.since);
    console.log(`Updated agent context for ${context.scan.root}`);
    console.log(`Written files: ${result.files.length}`);
    console.log(`Changed since ${options.since}:`);
    for (const file of changed) {
      console.log(`- ${file}`);
    }
  });

program
  .command("explain")
  .argument("<path>", "file path or module name to explain")
  .argument("[repo]", "repository path", ".")
  .description("Explain a file or module from the generated repository index.")
  .action(async (targetPath: string, repo: string) => {
    const context = await buildContextPackage(repo);
    const normalized = targetPath.replace(/\\/g, "/");
    const file = context.index.files.find((candidate) => candidate.path === normalized);
    if (file) {
      console.log(`# ${file.path}`);
      console.log("");
      console.log(file.summary);
      console.log(`Kind: ${file.kind}`);
      console.log(`Module: ${file.moduleName}`);
      console.log(`Analyzer: ${file.analyzer} (${file.confidence} confidence)`);
      console.log(
        `Analysis stats: ${file.analysisStats.parser}, imports ${file.analysisStats.importsResolved}/${file.imports.length} resolved, ${file.analysisStats.routesDetected} routes`
      );
      console.log(`Importance: ${file.importanceScore} (${file.importanceReasons.join(", ") || "no ranking signals"})`);
      console.log(`Imports: ${file.imports.map((item) => item.specifier).join(", ") || "none"}`);
      console.log(`Exports: ${file.exports.join(", ") || "none"}`);
      return;
    }

    const module = context.index.modules.find((candidate) => candidate.name === normalized);
    if (module) {
      console.log(`# ${module.name}`);
      console.log("");
      console.log(module.summary);
      console.log(`Files: ${module.files.length}`);
      console.log(`Depends on: ${module.imports.join(", ") || "none"}`);
      for (const moduleFile of module.files.slice(0, 30)) {
        console.log(`- ${moduleFile}`);
      }
      return;
    }

    console.error(`No file or module found for: ${targetPath}`);
    process.exitCode = 1;
  });

program.parseAsync().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

interface RetrieveCliOptions {
  provider: RetrieverProvider;
  topK: number;
  modules?: string;
  changedFiles?: string;
  includeTests?: boolean;
  json?: boolean;
}

function retrieveOptions(options: RetrieveCliOptions) {
  return {
    topK: options.topK,
    modules: splitCsv(options.modules),
    changedFiles: splitCsv(options.changedFiles),
    includeTests: options.includeTests ?? false
  };
}

function splitCsv(value: string | undefined): string[] | undefined {
  const items =
    value
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? [];
  return items.length ? items : undefined;
}

function parseRetrieverProvider(value: string): RetrieverProvider {
  if (value === "static" || value === "ripgrep" || value === "hybrid" || value === "lightrag" || value === "embedding") return value;
  throw new Error(`Unsupported retriever provider: ${value}`);
}

function parseTarget(value: string): AgentTarget {
  if (value === "codex" || value === "claude" || value === "cursor" || value === "all") {
    return value;
  }

  throw new Error(`Unsupported target: ${value}`);
}

function parseInteger(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Expected a positive integer, got: ${value}`);
  }

  return parsed;
}

function parseTaskType(value: string): TaskType {
  if (value === "auto" || value === "bugfix" || value === "feature" || value === "refactor") return value;
  throw new Error(`Unsupported task type: ${value}`);
}

function printFileList(files: IndexedFile[]): void {
  if (!files.length) {
    console.log("No matching files detected.");
    return;
  }

  for (const file of files.sort((a, b) => b.importanceScore - a.importanceScore || a.path.localeCompare(b.path))) {
    console.log(`- ${file.path}`);
    console.log(`  - Score: ${file.importanceScore}`);
    console.log(`  - Summary: ${file.summary}`);
  }
}
