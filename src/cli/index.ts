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
import { renderTaskContext } from "../outputs/task-context.js";
import { validateContextPackage } from "../core/validator.js";
import { starterConfig } from "../config/starter-config.js";
import { parseTokenizerMode } from "../core/token-estimator.js";
import { resolveTaskArguments } from "./task-args.js";

const program = new Command();

program
  .name("repo-context")
  .description("Compress a repository into an agent-ready context package.")
  .version("0.1.0");

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
  .action(async (repo: string, options: { target?: AgentTarget; tokenBudget?: number; tokenizer?: ReturnType<typeof parseTokenizerMode>; model?: string; llm?: boolean }) => {
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
  });

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

const rag = program
  .command("rag")
  .description("RAG integration commands.");

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
      console.log(`Analysis stats: ${file.analysisStats.parser}, imports ${file.analysisStats.importsResolved}/${file.imports.length} resolved, ${file.analysisStats.routesDetected} routes`);
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
