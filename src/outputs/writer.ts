import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ContextPackage } from "../core/types.js";
import { countTokens } from "../core/token-estimator.js";
import { renderAgentsMd } from "./agents-md.js";
import { renderArchitecture } from "./architecture.js";
import { renderDependencyGraph, renderMermaidGraph } from "./dependency-graph.js";
import { renderKeyFiles } from "./key-files.js";
import { renderModuleMap } from "./module-map.js";
import { renderOnboarding } from "./onboarding.js";
import { renderReadiness } from "./readiness.js";
import { renderRepoSummary } from "./repo-summary.js";
import { buildRagDocuments, buildRagManifest, renderRagReadme } from "./rag.js";
import { buildTaskPack, renderTaskContext } from "./task-context.js";
import { renderTokenSavings } from "./token-savings.js";

export interface WriteResult {
  files: string[];
}

export function writeContextPackage(context: ContextPackage): WriteResult {
  const root = context.scan.root;
  const contextDir = path.join(root, ".agent-context");
  const indexDir = path.join(contextDir, "index");
  const evidenceDir = path.join(contextDir, "evidence");
  const graphDir = path.join(contextDir, "graphs");
  const tasksDir = path.join(contextDir, "tasks");
  const ragDir = path.join(contextDir, "rag");
  const written: string[] = [];

  cleanupDisabledOutputs(context, contextDir, root);
  mkdirSync(indexDir, { recursive: true });
  mkdirSync(evidenceDir, { recursive: true });
  if (context.config.outputs.graph) mkdirSync(graphDir, { recursive: true });
  if (context.config.outputs.tasks) mkdirSync(tasksDir, { recursive: true });
  if (context.config.outputs.rag) mkdirSync(ragDir, { recursive: true });

  if (context.config.outputs.agents) {
    write(root, resolveAgentsFileName(root), renderAgentsMd(context), written);
  }
  write(contextDir, "repo-summary.md", renderRepoSummary(context), written);
  write(contextDir, "key-files.md", renderKeyFiles(context), written);
  if (context.config.outputs.modules) {
    write(contextDir, "module-map.md", renderModuleMap(context), written);
    write(contextDir, "architecture.md", renderArchitecture(context), written);
  }
  if (context.config.outputs.graph) {
    write(contextDir, "dependency-graph.md", renderDependencyGraph(context), written);
    write(graphDir, "dependencies.mmd", renderMermaidGraph(context), written);
    writeJson(graphDir, "dependencies.json", context.graph, written);
  }
  write(contextDir, "onboarding.md", renderOnboarding(context), written);
  if (context.config.outputs.readiness) {
    write(contextDir, "readiness.md", renderReadiness(context), written);
    writeJson(contextDir, "readiness.json", context.readiness, written);
  }
  if (context.config.outputs.tasks) {
    write(tasksDir, "bugfix-context.md", renderTaskContext(context, "fix a bug or regression"), written);
    write(tasksDir, "feature-context.md", renderTaskContext(context, "add a feature or new behavior"), written);
    write(tasksDir, "refactor-context.md", renderTaskContext(context, "refactor code safely"), written);
    writeJson(tasksDir, "bugfix.json", buildTaskPack(context, "fix a bug or regression", { type: "bugfix" }), written);
    writeJson(tasksDir, "feature.json", buildTaskPack(context, "add a feature or new behavior", { type: "feature" }), written);
    writeJson(tasksDir, "refactor.json", buildTaskPack(context, "refactor code safely", { type: "refactor" }), written);
  }
  writeJson(indexDir, "files.json", context.index.files.map(sanitizeIndexedFile), written);
  writeJson(indexDir, "symbols.json", context.index.symbols, written);
  writeJson(indexDir, "modules.json", context.index.modules, written);
  writeJson(indexDir, "chunks.json", buildChunks(context), written);
  writeJson(evidenceDir, "file-evidence.json", context.index.files.map((file) => ({
    path: file.path,
    analyzer: file.analyzer,
    confidence: file.confidence,
    stats: file.analysisStats,
    evidence: file.evidence
  })), written);
  if (context.config.outputs.rag) {
    writeRagExport(ragDir, context, written);
  }
  context.tokenSavings.actualOutputTokens = measureActualOutputs(root, written, context.config.tokenizer);
  context.tokenSavings.contextPackTokens = context.tokenSavings.actualOutputTokens;
  context.tokenSavings.compressionRatio = context.tokenSavings.actualOutputTokens.total
    ? Math.max(1, Math.round(context.tokenSavings.originalRepoTokens.tokens / context.tokenSavings.actualOutputTokens.total))
    : 1;
  context.tokenSavings.withinBudget = context.tokenSavings.actualOutputTokens.total <= context.tokenSavings.tokenBudget;
  if (context.config.outputs.rag) {
    const documents = buildRagDocuments(context);
    rewriteJson(path.join(ragDir, "manifest.json"), buildRagManifest(context, documents.length));
  }
  write(contextDir, "token-savings.md", renderTokenSavings(context), written);
  writeJson(contextDir, "token-savings.json", context.tokenSavings, written);

  return { files: written };
}

function rewriteJson(filePath: string, value: unknown): void {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function measureActualOutputs(
  root: string,
  written: string[],
  tokenizer: ContextPackage["config"]["tokenizer"]
): NonNullable<ContextPackage["tokenSavings"]["actualOutputTokens"]> {
  const files = Object.fromEntries(written
    .filter((filePath) => /\.(md|mmd|jsonl)$/i.test(filePath))
    .filter((filePath) => !filePath.endsWith("token-savings.md"))
    .map((filePath) => {
      const tokenCount = countTokens(readFileSync(filePath, "utf8"), tokenizer);
      return [
        path.relative(root, filePath).replaceAll("\\", "/"),
        tokenCount.tokens
      ];
    }));
  const total = Object.values(files).reduce((sum, tokens) => sum + tokens, 0);
  return {
    mode: "actual",
    tokenizer: tokenizer.mode,
    model: tokenizer.model,
    totalTokens: total,
    total,
    scope: "Generated Markdown, Mermaid, and RAG JSONL files; excludes machine-readable indexes and the token report itself.",
    files
  };
}

function cleanupDisabledOutputs(context: ContextPackage, contextDir: string, root: string): void {
  if (!context.config.outputs.agents) {
    removeGeneratedAgentFile(path.join(root, "AGENTS.md"));
    removeGeneratedAgentFile(path.join(root, "AGENTS.generated.md"));
  }
  if (!context.config.outputs.modules) {
    removeGeneratedPath(contextDir, "module-map.md");
    removeGeneratedPath(contextDir, "architecture.md");
  }
  if (!context.config.outputs.graph) {
    removeGeneratedPath(contextDir, "dependency-graph.md");
    removeGeneratedPath(contextDir, "graphs");
  }
  if (!context.config.outputs.tasks) {
    removeGeneratedPath(contextDir, "tasks");
  }
  if (!context.config.outputs.readiness) {
    removeGeneratedPath(contextDir, "readiness.md");
    removeGeneratedPath(contextDir, "readiness.json");
  }
  if (!context.config.outputs.rag) {
    removeGeneratedPath(contextDir, "rag");
  }
}

function removeGeneratedAgentFile(filePath: string): void {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");
  if (content.includes("generated-by: repo-to-agent-context")) {
    rmSync(filePath, { force: true });
  }
}

function removeGeneratedPath(contextDir: string, relativePath: string): void {
  const resolvedContextDir = path.resolve(contextDir);
  const target = path.resolve(contextDir, relativePath);
  if (target !== resolvedContextDir && !target.startsWith(`${resolvedContextDir}${path.sep}`)) {
    throw new Error(`Refusing to remove path outside generated context directory: ${target}`);
  }

  rmSync(target, { recursive: true, force: true });
}

function resolveAgentsFileName(root: string): string {
  const agentsPath = path.join(root, "AGENTS.md");
  if (!existsSync(agentsPath)) {
    return "AGENTS.md";
  }

  const existing = readFileSync(agentsPath, "utf8");
  if (
    existing.includes("generated-by: repo-to-agent-context")
    || existing.includes("This file was generated by Repo-to-Agent-Context")
  ) {
    return "AGENTS.md";
  }

  return "AGENTS.generated.md";
}

function write(baseDir: string, fileName: string, content: string, written: string[]): void {
  const filePath = path.join(baseDir, fileName);
  writeFileSync(filePath, `${content.trim()}\n`, "utf8");
  written.push(filePath);
}

function writeJson(baseDir: string, fileName: string, value: unknown, written: string[]): void {
  write(baseDir, fileName, JSON.stringify(value, null, 2), written);
}

function writeJsonl(baseDir: string, fileName: string, values: unknown[], written: string[]): void {
  write(baseDir, fileName, values.map((value) => JSON.stringify(value)).join("\n"), written);
}

function writeRagExport(baseDir: string, context: ContextPackage, written: string[]): void {
  const documents = buildRagDocuments(context);
  write(baseDir, "README.md", renderRagReadme(context), written);
  writeJson(baseDir, "manifest.json", buildRagManifest(context, documents.length), written);
  writeJsonl(baseDir, "documents.jsonl", documents, written);
}

function buildChunks(context: ContextPackage): Array<{
  path: string;
  moduleName: string;
  tokenEstimate: number;
  summary: string;
}> {
  return context.index.files.map((file) => ({
    path: file.path,
    moduleName: file.moduleName,
    tokenEstimate: file.tokenEstimate,
    summary: file.summary
  }));
}

function sanitizeIndexedFile(file: ContextPackage["index"]["files"][number]): Omit<typeof file, "absolutePath"> {
  const { absolutePath, ...safeFile } = file;
  void absolutePath;
  return safeFile;
}
