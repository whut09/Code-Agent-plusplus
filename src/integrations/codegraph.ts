import { existsSync } from "node:fs";
import path from "node:path";
import type { ContextPackage } from "../core/types.js";
import { runSafeCommand } from "../core/safe-command.js";
import type { ContextHit } from "../retrievers/types.js";

export type CodeIntelligenceBackend = "internal" | "codegraph";

export interface CodeGraphStatus {
  requested: boolean;
  available: boolean;
  used: boolean;
  reason: string;
}

export interface CodeGraphImpactData {
  directDependents: string[];
  transitiveDependents: string[];
  relatedTests: string[];
  riskFactors: string[];
}

export interface CodeGraphTestData {
  minimalTests: string[];
  regressionTests: string[];
}

export function codeGraphStatus(context: ContextPackage, requested = true): CodeGraphStatus {
  if (!requested) return { requested: false, available: false, used: false, reason: "CodeGraph backend was not requested." };
  if (!existsSync(path.join(context.scan.root, ".codegraph"))) {
    return {
      requested: true,
      available: false,
      used: false,
      reason: "No .codegraph directory detected; using internal graph."
    };
  }
  return {
    requested: true,
    available: true,
    used: false,
    reason: "CodeGraph project detected."
  };
}

export function exploreWithCodeGraph(context: ContextPackage, task: string, topK: number): { status: CodeGraphStatus; hits: ContextHit[] } {
  const status = codeGraphStatus(context, true);
  if (!status.available) return { status, hits: [] };

  const result = runCodeGraph(context, ["explore", task, "--json"]);
  if (!result.ok) return { status: { ...status, reason: result.reason }, hits: [] };

  const hits = normalizeCodeGraphHits(result.json, context, topK);
  return {
    status: {
      ...status,
      used: hits.length > 0,
      reason: hits.length ? "CodeGraph explore returned context hits." : "CodeGraph explore returned no usable hits; using fallback retriever."
    },
    hits
  };
}

export function impactWithCodeGraph(context: ContextPackage, changedFiles: string[]): { status: CodeGraphStatus; impact: CodeGraphImpactData } {
  const status = codeGraphStatus(context, true);
  if (!status.available || !changedFiles.length) {
    return {
      status: !changedFiles.length ? { ...status, reason: "No changed files detected; using internal graph." } : status,
      impact: emptyImpact()
    };
  }

  const result = runCodeGraph(context, ["affected", ...changedFiles, "--json"]);
  if (!result.ok) return { status: { ...status, reason: result.reason }, impact: emptyImpact() };

  const impact = normalizeCodeGraphImpact(result.json);
  const used = impact.directDependents.length > 0 || impact.transitiveDependents.length > 0 || impact.relatedTests.length > 0 || impact.riskFactors.length > 0;
  return {
    status: {
      ...status,
      used,
      reason: used ? "CodeGraph affected returned impact signals." : "CodeGraph affected returned no usable impact signals; using internal graph."
    },
    impact
  };
}

export function testsWithCodeGraph(context: ContextPackage, targetFiles: string[]): { status: CodeGraphStatus; tests: CodeGraphTestData } {
  const status = codeGraphStatus(context, true);
  if (!status.available || !targetFiles.length) {
    return {
      status: !targetFiles.length ? { ...status, reason: "No target files detected; using internal test selector." } : status,
      tests: emptyTests()
    };
  }

  const result = runCodeGraph(context, ["affected", ...targetFiles, "--json"]);
  if (!result.ok) return { status: { ...status, reason: result.reason }, tests: emptyTests() };

  const tests = normalizeCodeGraphTests(result.json);
  const used = tests.minimalTests.length > 0 || tests.regressionTests.length > 0;
  return {
    status: {
      ...status,
      used,
      reason: used ? "CodeGraph affected returned test signals." : "CodeGraph affected returned no usable test signals; using internal test selector."
    },
    tests
  };
}

export function normalizeCodeGraphHits(raw: unknown, context: ContextPackage, topK: number): ContextHit[] {
  return extractItems(raw)
    .map((item, index) => mapHit(item, context, index))
    .filter((hit): hit is ContextHit => Boolean(hit))
    .slice(0, topK);
}

export function normalizeCodeGraphImpact(raw: unknown): CodeGraphImpactData {
  const object = asRecord(raw);
  const direct = collectPaths(object, ["directDependents", "direct_dependents", "dependents", "callers", "affected", "affectedFiles"]);
  const transitive = collectPaths(object, ["transitiveDependents", "transitive_dependents", "transitive", "downstream", "downstreamFiles"]);
  const tests = collectPaths(object, ["relatedTests", "related_tests", "tests", "testFiles", "test_files"]);
  const factors = collectStrings(object, ["riskFactors", "risk_factors", "warnings", "reasons"]);

  return {
    directDependents: sortedUnique(direct.filter((item) => !isTestPath(item))),
    transitiveDependents: sortedUnique(transitive.filter((item) => !isTestPath(item))),
    relatedTests: sortedUnique([...tests, ...direct.filter(isTestPath), ...transitive.filter(isTestPath)]),
    riskFactors: sortedUnique(factors)
  };
}

export function normalizeCodeGraphTests(raw: unknown): CodeGraphTestData {
  const object = asRecord(raw);
  const minimal = collectPaths(object, ["minimalTests", "minimal_tests", "tests", "testFiles", "test_files"]);
  const regression = collectPaths(object, ["regressionTests", "regression_tests", "relatedTests", "related_tests", "downstreamTests", "downstream_tests"]);
  return {
    minimalTests: sortedUnique(minimal.filter(isTestPath)),
    regressionTests: sortedUnique(regression.filter(isTestPath))
  };
}

function runCodeGraph(context: ContextPackage, args: string[]): { ok: true; json: unknown } | { ok: false; reason: string } {
  const command = ["codegraph", ...args].map(commandArg).join(" ");
  const result = runSafeCommand(command, { cwd: context.scan.root, maxBuffer: 10 * 1024 * 1024 });
  if (result.status !== 0) {
    const reason = result.stderr.trim() || result.error?.message || `codegraph exited with status ${String(result.status)}`;
    return { ok: false, reason: `CodeGraph command failed: ${reason}` };
  }

  try {
    return { ok: true, json: JSON.parse(result.stdout) as unknown };
  } catch {
    return { ok: false, reason: "CodeGraph command did not return valid JSON." };
  }
}

function mapHit(item: unknown, context: ContextPackage, index: number): ContextHit | undefined {
  const object = asRecord(item);
  const filePath = firstString(object, ["path", "file", "filePath", "relativePath", "uri"]);
  const normalizedPath = normalizeRepoPath(filePath);
  if (!normalizedPath) return undefined;

  const indexed = context.index.files.find((file) => file.path === normalizedPath);
  return {
    id: firstString(object, ["id"]) ?? `codegraph:${normalizedPath}:${index}`,
    path: normalizedPath,
    title: firstString(object, ["title", "name", "symbol"]) ?? normalizedPath,
    moduleName: firstString(object, ["module", "moduleName"]) ?? indexed?.moduleName ?? "root",
    kind: firstString(object, ["kind", "type"]) ?? indexed?.kind ?? "source",
    score: firstNumber(object, ["score", "rank", "relevance"]) ?? Math.max(1, 100 - index),
    source: "codegraph",
    snippet: firstString(object, ["snippet", "summary", "text", "content"]) ?? indexed?.summary ?? "",
    metadata: { backend: "codegraph", raw: item }
  };
}

function extractItems(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const object = asRecord(raw);
  for (const key of ["results", "hits", "items", "files", "nodes", "matches"]) {
    const value = object[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function collectPaths(object: Record<string, unknown>, keys: string[]): string[] {
  return sortedUnique(keys.flatMap((key) => collectPathValues(object[key])));
}

function collectStrings(object: Record<string, unknown>, keys: string[]): string[] {
  return sortedUnique(keys.flatMap((key) => collectStringValues(object[key])));
}

function collectPathValues(value: unknown): string[] {
  if (typeof value === "string") return [normalizeRepoPath(value)].filter(Boolean);
  if (Array.isArray(value)) return value.flatMap(collectPathValues);
  const object = asRecord(value);
  const filePath = firstString(object, ["path", "file", "filePath", "relativePath", "uri"]);
  return [normalizeRepoPath(filePath)].filter(Boolean);
}

function collectStringValues(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStringValues);
  return [];
}

function firstString(object: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = object[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function firstNumber(object: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = object[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function normalizeRepoPath(value: string | undefined): string {
  if (!value) return "";
  return value
    .replace(/^file:\/\//, "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^[A-Za-z]:\//, "")
    .replace(/^\/+/, "");
}

function isTestPath(filePath: string): boolean {
  return /(^|\/)(test|tests|__tests__)\//i.test(filePath) || /\.(test|spec)\.[cm]?[jt]sx?$/i.test(filePath) || /(^|\/)test_.*\.py$/i.test(filePath);
}

function commandArg(value: string): string {
  if (value && !/[\s"'\\]/.test(value)) return value;
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function emptyImpact(): CodeGraphImpactData {
  return { directDependents: [], transitiveDependents: [], relatedTests: [], riskFactors: [] };
}

function emptyTests(): CodeGraphTestData {
  return { minimalTests: [], regressionTests: [] };
}

function sortedUnique(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))].sort();
}
