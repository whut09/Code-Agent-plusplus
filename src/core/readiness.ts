import type { AgentReadinessReport, ContextPackage, DependencyGraph, RepoIndex, RepoScan } from "./types.js";

export function assessReadiness(scan: RepoScan, index: RepoIndex, graph: DependencyGraph): AgentReadinessReport {
  const missing: string[] = [];
  const strengths: string[] = [];
  let score = 32;

  if (scan.entrypoints.length) {
    score += 12;
    strengths.push("Entrypoints detected.");
  } else {
    missing.push("No clear application entrypoint detected.");
  }

  if (scan.testCommands.length) {
    score += 12;
    strengths.push("Test or check commands detected.");
  } else {
    missing.push("No test/check command detected.");
  }

  if (index.modules.length > 1) {
    score += 10;
    strengths.push("Repository can be divided into modules.");
  } else {
    missing.push("Module boundaries are weak or not obvious.");
  }

  if (graph.moduleEdges.length || graph.fileEdges.length) {
    score += 10;
    strengths.push("Dependency graph generated.");
  } else {
    missing.push("No internal dependency edges detected.");
  }

  if (scan.files.some((file) => file.path.toLowerCase().includes("readme"))) {
    score += 8;
    strengths.push("README documentation detected.");
  } else {
    missing.push("No README detected.");
  }

  if (index.symbols.length) {
    score += 8;
    strengths.push("Code symbols extracted.");
  } else {
    missing.push("No code symbols extracted.");
  }

  if (hasArchitectureDocumentation(scan)) {
    score += 8;
    strengths.push("Architecture documentation detected.");
  } else {
    missing.push("No architecture summary detected.");
  }

  const docsText = index.files
    .filter((file) => file.kind === "docs")
    .map((file) => `${file.path} ${file.summary}`)
    .join(" ")
    .toLowerCase();
  const largeModules = index.modules.filter((module) => (
    module.files.length > 50
    && module.name !== "root"
    && !docsText.includes(module.name.toLowerCase())
  ));
  for (const module of largeModules.slice(0, 3)) {
    missing.push(`Large undocumented module: ${module.pathPrefix}.`);
    score -= 5;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    missing,
    strengths
  };
}

function hasArchitectureDocumentation(scan: RepoScan): boolean {
  return scan.files.some((file) => (
    file.kind === "docs"
    && /(^|\/)(architecture|design|adr|decisions?)(\.|\/|$)/i.test(file.path)
  ));
}

export function summarizeReadiness(context: ContextPackage): string {
  return [
    `Agent Readiness: ${context.readiness.score}/100`,
    "",
    "Strengths:",
    ...list(context.readiness.strengths),
    "",
    "Missing or weak signals:",
    ...list(context.readiness.missing)
  ].join("\n");
}

function list(items: string[]): string[] {
  return items.length ? items.map((item) => `- ${item}`) : ["- None."];
}
