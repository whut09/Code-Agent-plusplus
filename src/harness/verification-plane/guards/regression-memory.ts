import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ContextPackage } from "../../../core/types.js";
import { changedFilesSince, runGit } from "../../../core/git.js";
import { buildTestSelection } from "../../../outputs/test-selector.js";
import { traceIdForTask } from "../../observability/execution-trace.js";
import type { RegressionMemoryEntry } from "./regression.js";

export interface RegressionMemoryCandidate {
  schemaVersion: "code-agent-plusplus.regression-memory-candidate.v1";
  id: string;
  module: string;
  changedFiles: string[];
  bugPattern: string;
  requiredTests: string[];
  riskTriggers: string[];
  source: "finalize" | "add-fix" | "learn-from-pr";
  task?: string;
  base: string;
  createdAt: string;
  evidence: string[];
}

export interface RegressionMemoryCandidateWriteResult {
  candidate: RegressionMemoryCandidate;
  file: string;
}

export interface RegressionMemoryAddResult {
  memoryFile: string;
  entry: RegressionMemoryEntry;
}

export interface RegressionMemoryOptions {
  task?: string;
  base?: string;
  source?: RegressionMemoryCandidate["source"];
  changedFiles?: string[];
  bugPattern?: string;
  requiredTests?: string[];
  riskTriggers?: string[];
}

export function buildRegressionMemoryCandidate(context: ContextPackage, options: RegressionMemoryOptions = {}): RegressionMemoryCandidate {
  const base = options.base ?? "main";
  const changedFiles = dedupe(options.changedFiles ?? changedFilesForMemory(context, base));
  const module = dominantModule(context, changedFiles);
  const requiredTests = dedupe(options.requiredTests ?? inferredRequiredTests(context, changedFiles, base));
  const riskTriggers = dedupe(options.riskTriggers ?? inferredRiskTriggers(context, changedFiles, options.task));
  const bugPattern = options.bugPattern ?? inferBugPattern(options.task, module, riskTriggers);
  const id = `candidate-${traceIdForTask([module, bugPattern, changedFiles.join("-")].filter(Boolean).join(" "))}`;
  return {
    schemaVersion: "code-agent-plusplus.regression-memory-candidate.v1",
    id,
    module,
    changedFiles,
    bugPattern,
    requiredTests,
    riskTriggers,
    source: options.source ?? "add-fix",
    task: options.task,
    base,
    createdAt: new Date().toISOString(),
    evidence: [
      `changed files: ${changedFiles.length}`,
      `module: ${module}`,
      requiredTests.length ? `required tests: ${requiredTests.join(" | ")}` : "required tests: none inferred"
    ]
  };
}

export function writeRegressionMemoryCandidate(
  context: ContextPackage,
  candidate: RegressionMemoryCandidate,
  outputRoot = context.scan.root
): RegressionMemoryCandidateWriteResult {
  const dir = path.join(outputRoot, ".agent-context", "memory", "candidates");
  mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${candidate.id}.json`);
  writeFileSync(filePath, `${JSON.stringify(candidate, null, 2)}\n`, "utf8");
  return { candidate, file: path.relative(outputRoot, filePath).replaceAll("\\", "/") };
}

export function writeFinalizeMemoryCandidate(
  context: ContextPackage,
  task: string,
  base: string,
  changedFiles: string[],
  outputRoot = context.scan.root
): RegressionMemoryCandidateWriteResult | undefined {
  const actionable = changedFiles.filter((file) => !file.startsWith(".agent-context/") && file !== "AGENTS.md");
  if (!actionable.length) return undefined;
  const candidate = buildRegressionMemoryCandidate(context, { task, base, changedFiles: actionable, source: "finalize" });
  return writeRegressionMemoryCandidate(context, candidate, outputRoot);
}

export function addRegressionMemoryFromCandidate(root: string, candidatePath: string): RegressionMemoryAddResult {
  const absolute = path.resolve(root, candidatePath);
  const candidate = readCandidate(absolute);
  const entry = candidateToMemoryEntry(candidate);
  const memoryFile = path.join(root, ".agent-context", "regression", "fix-history.json");
  mkdirSync(path.dirname(memoryFile), { recursive: true });
  const entries = readMemoryEntries(memoryFile).filter((item) => item.id !== entry.id);
  entries.push(entry);
  entries.sort((a, b) => a.id.localeCompare(b.id));
  writeFileSync(memoryFile, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
  return { memoryFile: path.relative(root, memoryFile).replaceAll("\\", "/"), entry };
}

export function readLatestCandidate(root: string): string | undefined {
  const dir = path.join(root, ".agent-context", "memory", "candidates");
  if (!existsSync(dir)) return undefined;
  const files = runSafeList(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => path.join(dir, file))
    .sort((a, b) => modifiedTime(b) - modifiedTime(a));
  return files[0] ? path.relative(root, files[0]).replaceAll("\\", "/") : undefined;
}

function changedFilesForMemory(context: ContextPackage, base: string): string[] {
  const files = new Set<string>();
  try {
    for (const file of changedFilesSince(context.scan.root, base)) files.add(file);
  } catch {
    // Candidate generation still works from working tree status.
  }
  try {
    for (const line of runGit(context.scan.root, ["status", "--porcelain", "--untracked-files=all"]).split(/\r?\n/)) {
      if (line.length <= 3) continue;
      const file = line.slice(3).trim().replace(/\\/g, "/").split(" -> ").pop();
      if (file) files.add(file);
    }
  } catch {
    // Non-git repositories get an empty candidate file list.
  }
  return [...files].filter((file) => !file.startsWith(".agent-context/") && file !== "AGENTS.md").sort();
}

function dominantModule(context: ContextPackage, changedFiles: string[]): string {
  const indexed = new Map(context.index.files.map((file) => [file.path, file]));
  const counts = new Map<string, number>();
  for (const filePath of changedFiles) {
    const module = indexed.get(filePath)?.moduleName ?? moduleFromPath(filePath);
    counts.set(module, (counts.get(module) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? "root";
}

function moduleFromPath(filePath: string): string {
  const parts = filePath.split("/").filter(Boolean);
  if (parts[0] === "src" && parts[1]) return parts[1];
  return parts[0] ?? "root";
}

function inferredRequiredTests(context: ContextPackage, changedFiles: string[], base: string): string[] {
  const selection = buildTestSelection(context, { forPaths: changedFiles, base });
  return dedupe([...selection.minimalCommands, ...selection.recommendedCommands]).filter((command) => !/^No .*detected/i.test(command));
}

function inferredRiskTriggers(context: ContextPackage, changedFiles: string[], task: string | undefined): string[] {
  const indexed = new Map(context.index.files.map((file) => [file.path, file]));
  const terms = new Set<string>();
  for (const raw of task?.match(/[A-Za-z0-9_-]+/g) ?? []) addTerm(terms, raw);
  for (const filePath of changedFiles) {
    for (const part of filePath.split(/[\\/._-]+/)) addTerm(terms, part);
    const file = indexed.get(filePath);
    if (file) {
      addTerm(terms, file.moduleName);
      for (const reason of file.importanceReasons) for (const part of reason.split(/[^A-Za-z0-9_-]+/)) addTerm(terms, part);
    }
  }
  return [...terms].slice(0, 12);
}

function inferBugPattern(task: string | undefined, module: string, riskTriggers: string[]): string {
  if (task?.trim()) return task.trim();
  const triggerText = riskTriggers.length ? ` involving ${riskTriggers.slice(0, 4).join(", ")}` : "";
  return `${module} regression risk${triggerText}`;
}

function addTerm(terms: Set<string>, raw: string): void {
  const normalized = raw.toLowerCase().replace(/[^a-z0-9_-]+/g, "");
  if (normalized.length >= 3 && !STOP_WORDS.has(normalized)) terms.add(normalized);
}

const STOP_WORDS = new Set(["src", "test", "tests", "spec", "file", "files", "changed", "module", "root", "return", "function", "const", "import"]);

function candidateToMemoryEntry(candidate: RegressionMemoryCandidate): RegressionMemoryEntry {
  return {
    id: candidate.id.replace(/^candidate-/, "fix-"),
    module: candidate.module,
    files: candidate.changedFiles,
    pattern: candidate.bugPattern,
    requiredTests: candidate.requiredTests,
    riskTriggers: candidate.riskTriggers,
    lastFixedIn: candidate.source,
    severity: "warning"
  };
}

function readCandidate(filePath: string): RegressionMemoryCandidate {
  const parsed = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error(`Invalid memory candidate: ${filePath}`);
  const record = parsed as RegressionMemoryCandidate;
  if (record.schemaVersion !== "code-agent-plusplus.regression-memory-candidate.v1") throw new Error(`Unsupported memory candidate schema: ${filePath}`);
  return record;
}

function readMemoryEntries(filePath: string): RegressionMemoryEntry[] {
  if (!existsSync(filePath)) return [];
  const parsed = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
  return Array.isArray(parsed) ? (parsed as RegressionMemoryEntry[]) : [];
}

function runSafeList(dir: string): string[] {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}

function modifiedTime(filePath: string): number {
  try {
    return statSync(filePath).mtimeMs;
  } catch {
    return 0;
  }
}

function dedupe(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))].sort();
}
