#!/usr/bin/env node
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Command } from "commander";
import type { AgentTarget } from "../core/types.js";
import { buildContextPackage } from "../core/context-builder.js";
import { writeContextPackage } from "../outputs/writer.js";
import { renderDependencyGraph } from "../outputs/dependency-graph.js";

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
  .description("Generate AGENTS.md and .agent-context outputs.")
  .action(async (repo: string, options: { target?: AgentTarget; tokenBudget?: number }) => {
    const context = await buildContextPackage(repo, options);
    const result = writeContextPackage(context);
    const totalTokens = context.scan.files.reduce((sum, file) => sum + file.tokenEstimate, 0);
    const keyTokens = context.keyFiles.slice(0, 25).reduce((sum, file) => sum + file.tokenEstimate, 0);

    console.log(`Generated agent context for ${context.scan.root}`);
    console.log(`Files scanned: ${context.scan.files.length}`);
    console.log(`Languages: ${context.scan.languages.join(", ") || "none detected"}`);
    console.log(`Key files: ${context.keyFiles.length}`);
    console.log(`Token estimate: ${totalTokens.toLocaleString()} -> ${keyTokens.toLocaleString()} for top context`);
    console.log("Written:");
    for (const file of result.files) {
      console.log(`- ${path.relative(context.scan.root, file)}`);
    }
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

function starterConfig(): string {
  return `target: codex
tokenBudget: 60000

include:
  - "**/*"

exclude:
  - node_modules/**
  - dist/**
  - build/**
  - coverage/**
  - .next/**
  - .venv/**

outputs:
  agents: true
  modules: true
  graph: true
`;
}
