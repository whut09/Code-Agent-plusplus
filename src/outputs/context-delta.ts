import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ContextPackage, IndexedFile } from "../core/types.js";
import { changedFilesSince, runGit } from "../core/git.js";
import { bullet, code, heading, table } from "./renderers/markdown.js";

export type DeltaImpactLevel = "none" | "low" | "medium" | "high";
export type ContextOutputArea =
  | "agent-guide"
  | "repo-summary"
  | "key-files"
  | "module-map"
  | "architecture"
  | "dependency-graph"
  | "readiness"
  | "task-packs"
  | "contracts"
  | "rag"
  | "index"
  | "token-savings"
  | "manifest";

export interface ContextDeltaOptions {
  base?: string;
}

export interface ContextDeltaFile {
  path: string;
  status: "added" | "modified" | "deleted" | "renamed" | "unknown";
  kind: string;
  moduleName?: string;
  isTest: boolean;
  isGenerated: boolean;
}

export interface ContextDeltaReport {
  base: string;
  impact: DeltaImpactLevel;
  changedFiles: ContextDeltaFile[];
  affectedGraphNodes: string[];
  affectedModules: string[];
  affectedOutputs: ContextOutputArea[];
  staleOutputs: string[];
  agentMustReRead: string[];
  taskPacksToRefresh: Array<"bugfix" | "feature" | "refactor">;
  reasons: string[];
  recommendedCommand: string;
}

export interface ContextDeltaWriteResult {
  files: string[];
  report: ContextDeltaReport;
}

export function buildContextDelta(context: ContextPackage, options: ContextDeltaOptions = {}): ContextDeltaReport {
  const base = options.base ?? "main";
  const changed = changedFilesForDelta(context, base);
  const changedPaths = changed.map((file) => file.path);
  const changedSet = new Set(changedPaths);
  const indexed = new Map(context.index.files.map((file) => [file.path, file]));
  const changedIndexed = changedPaths.map((file) => indexed.get(file)).filter((file): file is IndexedFile => Boolean(file));
  const graphNodes = affectedGraphNodes(context, changedSet);
  const modules = affectedModules(context, changedIndexed, graphNodes);
  const outputs = affectedOutputs(context, changed, changedIndexed, graphNodes);
  const staleOutputs = outputFiles(outputs);
  const reread = agentReadList(context, changedIndexed, graphNodes);
  const taskPacks = taskPacksToRefresh(changedIndexed);
  const impact = impactLevel(changed, graphNodes, modules, outputs);
  const reasons = deltaReasons(changed, graphNodes, modules, outputs);

  return {
    base,
    impact,
    changedFiles: changed,
    affectedGraphNodes: graphNodes,
    affectedModules: modules,
    affectedOutputs: outputs,
    staleOutputs,
    agentMustReRead: reread,
    taskPacksToRefresh: taskPacks,
    reasons,
    recommendedCommand: changed.length ? `opencode-plusplus evolve . --base ${base}` : "No action needed."
  };
}

export function renderContextDelta(report: ContextDeltaReport): string {
  return [
    heading(1, "Context Delta"),
    "",
    `Base: ${report.base}`,
    `Impact: ${report.impact}`,
    `Recommended: ${report.recommendedCommand}`,
    "",
    heading(2, "What Changed In Repo"),
    table(
      ["File", "Status", "Kind", "Module"],
      report.changedFiles.map((file) => [code(file.path), file.status, file.kind, file.moduleName ?? "unknown"])
    ),
    "",
    heading(2, "What Context Must Update"),
    bullet(report.staleOutputs.map(code)),
    "",
    heading(2, "Affected Graph Nodes"),
    bullet(report.affectedGraphNodes.map(code)),
    "",
    heading(2, "Affected Modules"),
    bullet(report.affectedModules.map(code)),
    "",
    heading(2, "What Agent Must Re-read"),
    bullet(report.agentMustReRead.map(code)),
    "",
    heading(2, "Task Packs To Refresh"),
    bullet(report.taskPacksToRefresh.map(code)),
    "",
    heading(2, "Reasons"),
    bullet(report.reasons)
  ].join("\n");
}

export function writeContextDelta(context: ContextPackage, report: ContextDeltaReport): ContextDeltaWriteResult {
  const dir = path.join(context.scan.root, ".agent-context", "delta");
  mkdirSync(dir, { recursive: true });
  const files = [write(path.join(dir, "latest.md"), renderContextDelta(report)), write(path.join(dir, "latest.json"), JSON.stringify(report, null, 2))];
  return { files, report };
}

function changedFilesForDelta(context: ContextPackage, base: string): ContextDeltaFile[] {
  const status = gitStatusMap(context.scan.root);
  const indexed = new Map(context.index.files.map((file) => [file.path, file]));
  const files = new Set<string>(changedFilesSince(context.scan.root, base));
  for (const file of status.keys()) files.add(file);

  return [...files]
    .filter((file) => !isGeneratedContextState(file))
    .filter((file) => !file.startsWith(".agent-context/cache/"))
    .sort()
    .map((file) => {
      const indexedFile = indexed.get(file);
      return {
        path: file,
        status: status.get(file) ?? "modified",
        kind: indexedFile?.kind ?? inferKind(file),
        moduleName: indexedFile?.moduleName,
        isTest: indexedFile?.isTest ?? isTestPath(file),
        isGenerated: indexedFile?.isGenerated ?? isGeneratedPath(file)
      };
    });
}

function gitStatusMap(root: string): Map<string, ContextDeltaFile["status"]> {
  const result = new Map<string, ContextDeltaFile["status"]>();
  try {
    for (const line of runGit(root, ["status", "--porcelain", "--untracked-files=all"]).split(/\r?\n/)) {
      if (line.length <= 3) continue;
      const codePair = line.slice(0, 2);
      const file = line.slice(3).trim().replace(/\\/g, "/").split(" -> ").pop();
      if (!file) continue;
      result.set(file, statusFromGit(codePair));
    }
  } catch {
    return result;
  }
  return result;
}

function statusFromGit(value: string): ContextDeltaFile["status"] {
  if (value.includes("R")) return "renamed";
  if (value.includes("D")) return "deleted";
  if (value.includes("A") || value.includes("?")) return "added";
  if (value.trim()) return "modified";
  return "unknown";
}

function affectedGraphNodes(context: ContextPackage, changedSet: Set<string>): string[] {
  const nodes = new Set<string>(changedSet);
  for (const edge of context.graph.fileEdges) {
    if (edge.isExternal) continue;
    if (changedSet.has(edge.from)) nodes.add(edge.to);
    if (changedSet.has(edge.to)) nodes.add(edge.from);
  }
  return [...nodes].filter((file) => context.index.files.some((candidate) => candidate.path === file)).sort();
}

function affectedModules(context: ContextPackage, changedIndexed: IndexedFile[], graphNodes: string[]): string[] {
  const modules = new Set(changedIndexed.map((file) => file.moduleName).filter(Boolean));
  const graphSet = new Set(graphNodes);
  for (const file of context.index.files) {
    if (graphSet.has(file.path) && file.moduleName) modules.add(file.moduleName);
  }
  return [...modules].sort();
}

function affectedOutputs(context: ContextPackage, changed: ContextDeltaFile[], changedIndexed: IndexedFile[], graphNodes: string[]): ContextOutputArea[] {
  if (!changed.length) return [];
  const outputs = new Set<ContextOutputArea>(["manifest", "token-savings", "index", "agent-guide"]);
  const hasSource = changedIndexed.some((file) => file.kind === "source" || file.kind === "test");
  const hasConfig = changedIndexed.some((file) => file.kind === "config" || file.kind === "lockfile") || changed.some((file) => isConfigPath(file.path));
  const hasDocs = changedIndexed.some((file) => file.kind === "docs");
  const hasImports = graphNodes.length > changed.length || changedIndexed.some((file) => file.imports.length || file.exports.length);

  if (hasSource || hasConfig || hasDocs) {
    outputs.add("repo-summary");
    outputs.add("key-files");
    outputs.add("rag");
  }
  if (hasSource || hasConfig) {
    outputs.add("readiness");
    outputs.add("contracts");
  }
  if ((hasSource || hasConfig) && context.config.outputs.tasks) outputs.add("task-packs");
  if ((hasSource || hasImports) && context.config.outputs.graph) outputs.add("dependency-graph");
  if ((hasSource || hasConfig) && context.config.outputs.modules) {
    outputs.add("module-map");
    outputs.add("architecture");
  }
  return [...outputs].sort();
}

function outputFiles(outputs: ContextOutputArea[]): string[] {
  const files: Record<ContextOutputArea, string[]> = {
    "agent-guide": ["AGENTS.md", ".agent-context/AGENTS.generated.md"],
    "repo-summary": [".agent-context/repo-summary.md", ".agent-context/context-layers.md", ".agent-context/onboarding.md"],
    "key-files": [".agent-context/key-files.md"],
    "module-map": [".agent-context/module-map.md"],
    architecture: [".agent-context/architecture.md"],
    "dependency-graph": [".agent-context/dependency-graph.md", ".agent-context/graphs/dependencies.mmd", ".agent-context/graphs/dependencies.json"],
    readiness: [".agent-context/readiness.md", ".agent-context/readiness.json"],
    "task-packs": [".agent-context/tasks/bugfix-context.md", ".agent-context/tasks/feature-context.md", ".agent-context/tasks/refactor-context.md"],
    contracts: [
      ".agent-context/contracts/architecture.contract.json",
      ".agent-context/contracts/module-boundaries.json",
      ".agent-context/contracts/test.contract.json"
    ],
    rag: [".agent-context/rag/README.md", ".agent-context/rag/manifest.json", ".agent-context/rag/documents.jsonl"],
    index: [".agent-context/index/files.json", ".agent-context/index/symbols.json", ".agent-context/index/modules.json", ".agent-context/index/chunks.json"],
    "token-savings": [".agent-context/token-savings.md", ".agent-context/token-savings.json"],
    manifest: [".agent-context/manifest.json"]
  };
  return outputs.flatMap((output) => files[output]).sort();
}

function agentReadList(context: ContextPackage, changedIndexed: IndexedFile[], graphNodes: string[]): string[] {
  const result = new Set<string>();
  for (const file of changedIndexed) {
    if (!file.isGenerated) result.add(file.path);
  }
  const graphSet = new Set(graphNodes);
  for (const file of context.index.files) {
    if (graphSet.has(file.path) && !file.isGenerated) result.add(file.path);
  }
  for (const file of context.index.files.filter((file) => file.isTest)) {
    if (changedIndexed.some((changed) => isRelatedTest(file, changed))) result.add(file.path);
  }
  for (const file of context.keyFiles.slice(0, 5)) {
    if (file.kind === "config" || file.importanceReasons.some((reason) => /entry|config|script/i.test(reason))) result.add(file.path);
  }
  return [...result].sort();
}

function taskPacksToRefresh(changedIndexed: IndexedFile[]): Array<"bugfix" | "feature" | "refactor"> {
  if (!changedIndexed.length) return [];
  if (changedIndexed.some((file) => file.kind === "source" || file.kind === "test")) return ["bugfix", "feature", "refactor"];
  if (changedIndexed.some((file) => file.kind === "config" || file.kind === "docs")) return ["feature", "refactor"];
  return ["refactor"];
}

function impactLevel(changed: ContextDeltaFile[], graphNodes: string[], modules: string[], outputs: ContextOutputArea[]): DeltaImpactLevel {
  if (!changed.length) return "none";
  let score = changed.length * 4 + graphNodes.length * 3 + modules.length * 5 + outputs.length * 2;
  if (changed.some((file) => file.kind === "config" || file.kind === "lockfile")) score += 15;
  if (changed.some((file) => /(^|\/)(core|auth|payment|billing|security)(\/|$)/i.test(file.path))) score += 15;
  if (score >= 70) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function deltaReasons(changed: ContextDeltaFile[], graphNodes: string[], modules: string[], outputs: ContextOutputArea[]): string[] {
  if (!changed.length) return ["No repository changes detected from the selected base."];
  const reasons = [`${changed.length} changed file(s) detected from git diff/status.`];
  if (graphNodes.length) reasons.push(`${graphNodes.length} graph node(s) are adjacent to changed files.`);
  if (modules.length) reasons.push(`${modules.length} module(s) may need refreshed summaries or boundaries.`);
  if (outputs.length) reasons.push(`${outputs.length} context output area(s) are marked stale.`);
  return reasons;
}

function isRelatedTest(testFile: IndexedFile, sourceFile: IndexedFile): boolean {
  const testPath = testFile.path.toLowerCase();
  const sourcePath = sourceFile.path.toLowerCase();
  const baseName =
    sourceFile.path
      .split("/")
      .pop()
      ?.replace(/\.[^.]+$/, "")
      .toLowerCase() ?? "";
  return (
    testFile.imports.some((item) => item.resolvedPath === sourceFile.path) ||
    (baseName.length >= 3 && testPath.includes(baseName)) ||
    testPath.includes(sourcePath)
  );
}

function isGeneratedContextState(file: string): boolean {
  return file.startsWith(".agent-context/") || file === "AGENTS.md";
}

function isConfigPath(file: string): boolean {
  return /(^|\/)(package\.json|tsconfig\.json|jsconfig\.json|pyproject\.toml|Cargo\.toml|go\.mod|code-agent-plusplus\.config\.ya?ml)$/.test(file);
}

function inferKind(file: string): string {
  if (isTestPath(file)) return "test";
  if (isConfigPath(file)) return "config";
  if (/\.mdx?$/i.test(file)) return "docs";
  if (isGeneratedPath(file)) return "generated";
  if (/\.(ts|tsx|js|jsx|py|go|rs|java|kt|cs|rb|php)$/i.test(file)) return "source";
  return "unknown";
}

function isTestPath(file: string): boolean {
  return /(^|\/)(test|tests|__tests__)\//i.test(file) || /\.(test|spec)\.[cm]?[jt]sx?$/i.test(file) || /(^|\/)test_.*\.py$/i.test(file);
}

function isGeneratedPath(file: string): boolean {
  return /(^|\/)(generated|__generated__|gen)\//i.test(file) || /\.generated\./i.test(file);
}

function write(filePath: string, content: string): string {
  writeFileSync(filePath, `${content.trim()}\n`, "utf8");
  return filePath;
}
