import type { ContextPackage, IndexedFile } from "../core/types.js";
import { changedFilesSince } from "../core/git.js";
import { type CodeGraphStatus, type CodeIntelligenceBackend, codeGraphStatus, impactWithCodeGraph } from "../integrations/codegraph.js";
import { bullet, code, heading } from "./renderers/markdown.js";

export interface ChangeImpactOptions {
  base?: string;
  backend?: CodeIntelligenceBackend;
}

export interface ChangeImpactReport {
  base: string;
  backend: CodeIntelligenceBackend;
  backendStatus: CodeGraphStatus;
  changedFiles: string[];
  directDependents: string[];
  transitiveDependents: string[];
  relatedTests: string[];
  risk: "Low" | "Medium" | "High";
  requiredVerification: string[];
  riskFactors: string[];
}

export function buildChangeImpactReport(context: ContextPackage, options: ChangeImpactOptions = {}): ChangeImpactReport {
  const base = options.base ?? "main";
  const backend = options.backend ?? "internal";
  const changedFiles = changedFilesSince(context.scan.root, base).sort();
  const changedSet = new Set(changedFiles);
  const internalDirectDependents = directDependentsOf(context, changedSet);
  const internalTransitiveDependents = transitiveDependentsOf(context, changedSet, new Set(internalDirectDependents));
  const internalRelatedTests = relatedTestsFor(context, changedSet, new Set([...internalDirectDependents, ...internalTransitiveDependents]));
  const codegraph =
    backend === "codegraph" ? impactWithCodeGraph(context, changedFiles) : { status: codeGraphStatus(context, false), impact: emptyCodeGraphImpact() };
  const directDependents = sortedUnique([...internalDirectDependents, ...codegraph.impact.directDependents]);
  const transitiveDependents = sortedUnique([...internalTransitiveDependents, ...codegraph.impact.transitiveDependents]);
  const relatedTests = sortedUnique([...internalRelatedTests, ...codegraph.impact.relatedTests]);
  const risk = impactRisk(context, changedFiles, directDependents, transitiveDependents, relatedTests, codegraph.impact.riskFactors);

  return {
    base,
    backend,
    backendStatus: codegraph.status,
    changedFiles,
    directDependents,
    transitiveDependents,
    relatedTests,
    risk: risk.level,
    requiredVerification: requiredVerification(context, changedFiles, directDependents, transitiveDependents, relatedTests),
    riskFactors: risk.factors
  };
}

export function renderChangeImpactReport(context: ContextPackage, options: ChangeImpactOptions = {}): string {
  const report = buildChangeImpactReport(context, options);
  return [
    heading(1, "Change Impact Report"),
    "",
    `Base: ${report.base}`,
    `Backend: ${report.backend}${report.backend === "codegraph" ? ` (${report.backendStatus.used ? "used" : `fallback: ${report.backendStatus.reason}`})` : ""}`,
    "",
    heading(2, "Changed files"),
    bullet(report.changedFiles.map(code)),
    "",
    heading(2, "Direct dependents"),
    bullet(report.directDependents.map(code)),
    "",
    heading(2, "Transitive dependents"),
    bullet(report.transitiveDependents.map(code)),
    "",
    heading(2, "Related tests"),
    bullet(report.relatedTests.map(code)),
    "",
    heading(2, "Risk"),
    report.risk,
    "",
    heading(2, "Required verification"),
    bullet(report.requiredVerification.map(code)),
    "",
    heading(2, "Risk factors"),
    bullet(report.riskFactors)
  ].join("\n");
}

function directDependentsOf(context: ContextPackage, changedSet: Set<string>): string[] {
  return sortedUnique(
    context.graph.fileEdges
      .filter((edge) => !edge.isExternal && changedSet.has(edge.to) && !changedSet.has(edge.from))
      .map((edge) => edge.from)
      .filter((filePath) => !isTestPath(context, filePath))
  );
}

function transitiveDependentsOf(context: ContextPackage, changedSet: Set<string>, directSet: Set<string>): string[] {
  const seen = new Set<string>([...changedSet, ...directSet]);
  const queue = [...directSet];
  const result: string[] = [];

  while (queue.length) {
    const current = queue.shift()!;
    for (const edge of context.graph.fileEdges) {
      if (edge.isExternal || edge.to !== current || seen.has(edge.from)) continue;
      seen.add(edge.from);
      queue.push(edge.from);
      if (!isTestPath(context, edge.from)) result.push(edge.from);
    }
  }

  return sortedUnique(result);
}

function relatedTestsFor(context: ContextPackage, changedSet: Set<string>, dependentSet: Set<string>): string[] {
  const changedAndDependent = new Set([...changedSet, ...dependentSet]);
  const changedFiles = indexedFiles(context, [...changedSet]);
  const dependentFiles = indexedFiles(context, [...dependentSet]);
  const related = new Set<string>();

  for (const edge of context.graph.fileEdges) {
    if (!edge.isExternal && changedAndDependent.has(edge.to) && isTestPath(context, edge.from)) {
      related.add(edge.from);
    }
  }

  for (const testFile of context.index.files.filter((file) => file.isTest)) {
    if (isRelatedTest(testFile, [...changedFiles, ...dependentFiles])) related.add(testFile.path);
  }

  return sortedUnique([...related]);
}

function requiredVerification(
  context: ContextPackage,
  changedFiles: string[],
  directDependents: string[],
  transitiveDependents: string[],
  relatedTests: string[]
): string[] {
  const commands = new Set<string>();
  const focusTerms = verificationFocusTerms(context, changedFiles, directDependents, transitiveDependents, relatedTests);
  const testCommands = context.scan.testCommands.slice(0, 2);

  for (const command of testCommands) {
    if (/test|vitest|jest|pytest|node --test/i.test(command) && focusTerms.length) {
      for (const term of focusTerms.slice(0, 4)) commands.add(`${command} -- ${term}`);
    } else {
      commands.add(command);
    }
  }

  for (const command of context.scan.typecheckCommands.slice(0, 1)) commands.add(command);
  for (const command of context.scan.lintCommands.slice(0, 1)) commands.add(command);
  if (!commands.size) commands.add("No test command detected; inspect project docs and run affected tests manually.");
  return [...commands];
}

function verificationFocusTerms(context: ContextPackage, ...groups: string[][]): string[] {
  const terms = new Set<string>();
  for (const file of indexedFiles(context, groups.flat())) {
    if (file.moduleName && file.moduleName !== "root" && file.moduleName !== "test") {
      const moduleTerm = file.moduleName.split("/").pop() ?? file.moduleName;
      if (isUsefulFocusTerm(moduleTerm)) terms.add(moduleTerm);
    }
    for (const segment of file.path.split("/")) {
      const clean = segment.replace(/\.[^.]+$/, "");
      if (isUsefulFocusTerm(clean)) terms.add(clean);
    }
  }

  const preferred = ["auth", "login"].filter((term) => terms.has(term));
  if (preferred.length) return preferred;

  return [...terms].filter((term) => !["src", "test", "tests", "index", "app", "server", "route", "middleware", "session"].includes(term)).slice(0, 4);
}

function impactRisk(
  context: ContextPackage,
  changedFiles: string[],
  directDependents: string[],
  transitiveDependents: string[],
  relatedTests: string[],
  backendRiskFactors: string[] = []
): { level: ChangeImpactReport["risk"]; factors: string[] } {
  let score = 0;
  const factors: string[] = [];
  const indexedChanged = indexedFiles(context, changedFiles);
  const sourceChanges = indexedChanged.filter((file) => file.kind === "source" && !file.isTest).length;
  const configChanges = indexedChanged.filter((file) => file.kind === "config" || context.scan.migrationFiles.includes(file.path)).length;

  if (sourceChanges) {
    score += Math.min(30, sourceChanges * 12);
    factors.push(`${sourceChanges} source file${sourceChanges === 1 ? "" : "s"} changed`);
  }
  if (directDependents.length) {
    score += Math.min(25, directDependents.length * 8);
    factors.push(`${directDependents.length} direct dependent${directDependents.length === 1 ? "" : "s"}`);
  }
  if (transitiveDependents.length) {
    score += Math.min(25, transitiveDependents.length * 6);
    factors.push(`${transitiveDependents.length} transitive dependent${transitiveDependents.length === 1 ? "" : "s"}`);
  }
  if (configChanges) {
    score += 25;
    factors.push("configuration or migration files changed");
  }
  if (!relatedTests.length && sourceChanges) {
    score += 15;
    factors.push("no related tests detected for source changes");
  }
  if (indexedChanged.some((file) => file.importanceScore >= 40)) {
    score += 10;
    factors.push("high-importance files changed");
  }
  if (backendRiskFactors.length) {
    score += Math.min(15, backendRiskFactors.length * 5);
    factors.push(...backendRiskFactors.map((factor) => `CodeGraph: ${factor}`));
  }
  if (!factors.length) factors.push("no indexed source/config impact detected");

  return { level: score >= 70 ? "High" : score >= 35 ? "Medium" : "Low", factors };
}

function indexedFiles(context: ContextPackage, paths: string[]): IndexedFile[] {
  const wanted = new Set(paths);
  return context.index.files.filter((file) => wanted.has(file.path));
}

function isTestPath(context: ContextPackage, filePath: string): boolean {
  return (
    Boolean(context.index.files.find((file) => file.path === filePath)?.isTest) ||
    /(^|\/)(test|tests|__tests__)\//i.test(filePath) ||
    /\.(test|spec)\.[cm]?[jt]sx?$/i.test(filePath)
  );
}

function isRelatedTest(testFile: IndexedFile, files: IndexedFile[]): boolean {
  const testPath = testFile.path.toLowerCase();
  return files.some((file) => {
    const baseName =
      file.path
        .split("/")
        .pop()
        ?.replace(/\.[^.]+$/, "")
        .toLowerCase() ?? "";
    return (
      (baseName.length >= 3 && testPath.includes(baseName)) ||
      (file.moduleName !== "root" && file.moduleName !== "test" && testPath.includes(file.moduleName.toLowerCase())) ||
      file.path.split("/").some((segment) => segment.length >= 4 && testPath.includes(segment.toLowerCase()))
    );
  });
}

function isUsefulFocusTerm(term: string): boolean {
  return /^[A-Za-z0-9_-]+$/.test(term) && term.length >= 3;
}

function sortedUnique(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))].sort();
}

function emptyCodeGraphImpact() {
  return { directDependents: [], transitiveDependents: [], relatedTests: [], riskFactors: [] };
}
