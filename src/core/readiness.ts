import type {
  AgentReadinessReport,
  ContextPackage,
  DependencyGraph,
  ReadinessCap,
  ReadinessCategory,
  ReadinessDimension,
  RepoIndex,
  RepoScan,
  TokenizerConfig
} from "./types.js";

export interface ReadinessAssessmentOptions {
  tokenizerMode?: TokenizerConfig["mode"];
  generatedOutputValidation?: boolean;
  benchmarkFixture?: boolean;
}

export function assessReadiness(scan: RepoScan, index: RepoIndex, graph: DependencyGraph, options: ReadinessAssessmentOptions = {}): AgentReadinessReport {
  const categories = [
    assessStructure(scan, index, graph),
    assessCommands(scan),
    assessTests(scan),
    assessArchitecture(scan, index),
    assessTaskContext(index, graph),
    assessSafety(scan)
  ];
  const dimensions = buildDimensions(categories);
  const rawScore = Math.round(
    dimensionScore(dimensions, "operational") * 0.4 + dimensionScore(dimensions, "context-quality") * 0.35 + dimensionScore(dimensions, "agent-safety") * 0.25
  );
  const capsApplied = readinessCaps(scan, index, options);
  const score = applyCaps(rawScore, capsApplied);

  return {
    score,
    grade: grade(score),
    dimensions,
    capsApplied,
    categories,
    missing: [...new Set([...dimensions.flatMap((dimension) => dimension.missing), ...capsApplied.filter((cap) => cap.applied).map((cap) => cap.reason)])],
    strengths: dimensions.filter((dimension) => dimension.score >= 75).map((dimension) => `${title(dimension.category)} readiness: ${dimension.score}/100.`)
  };
}

export function summarizeReadiness(context: ContextPackage): string {
  return [
    `Agent Readiness: ${context.readiness.grade} / ${context.readiness.score}`,
    "",
    "Dimensions:",
    ...context.readiness.dimensions.map((dimension) => `- ${title(dimension.category)}: ${dimension.score}/100`),
    "",
    "Caps:",
    ...context.readiness.capsApplied.map((cap) => `- ${cap.applied ? "Applied" : "Not applied"}: max ${cap.cap} if ${cap.reason}`),
    "",
    "Missing or weak signals:",
    ...list(context.readiness.missing)
  ].join("\n");
}

function buildDimensions(categories: ReadinessCategory[]): ReadinessDimension[] {
  const byName = new Map(categories.map((category) => [category.category, category]));
  const structure = byName.get("structure");
  const commands = byName.get("commands");
  const tests = byName.get("tests");
  const architecture = byName.get("architecture");
  const taskContext = byName.get("task-context");
  const safety = byName.get("safety");

  return [
    dimension(
      "operational",
      weighted([
        [structure?.score ?? 0, 0.25],
        [commands?.score ?? 0, 0.35],
        [tests?.score ?? 0, 0.4]
      ]),
      [structure, commands, tests]
    ),
    dimension(
      "context-quality",
      weighted([
        [architecture?.score ?? 0, 0.35],
        [taskContext?.score ?? 0, 0.45],
        [structure?.score ?? 0, 0.2]
      ]),
      [architecture, taskContext, structure]
    ),
    dimension(
      "agent-safety",
      weighted([
        [safety?.score ?? 0, 0.65],
        [tests?.score ?? 0, 0.25],
        [commands?.score ?? 0, 0.1]
      ]),
      [safety, tests, commands]
    )
  ];
}

function dimension(name: ReadinessDimension["category"], score: number, categories: Array<ReadinessCategory | undefined>): ReadinessDimension {
  const present = categories.filter((category): category is ReadinessCategory => Boolean(category));
  return {
    category: name,
    score,
    evidence: [...new Set(present.flatMap((category) => category.evidence))],
    missing: [...new Set(present.flatMap((category) => category.missing))]
  };
}

function readinessCaps(scan: RepoScan, index: RepoIndex, options: ReadinessAssessmentOptions): ReadinessCap[] {
  const hasCi = (scan.ciFiles ?? []).length > 0;
  const hasAstAnalyzer = index.files.some((file) => file.analyzer === "typescript-compiler-api" && file.confidence === "high");
  const hasBenchmarkFixture = options.benchmarkFixture ?? scan.files.some((file) => /(^|\/)(test\/fixtures|fixtures|benchmarks?|examples?)\//i.test(file.path));
  const hasGeneratedOutputValidation = options.generatedOutputValidation ?? false;
  const hasRealTokenizer = options.tokenizerMode !== "chars_approx";

  return [
    cap(90, !hasCi, "No CI workflow detected.", scan.ciFiles),
    cap(90, !hasRealTokenizer, "No model-specific tokenizer configured; token counts use chars_approx.", [
      `tokenizer.mode: ${options.tokenizerMode ?? "chars_approx"}`
    ]),
    cap(85, !hasAstAnalyzer, "No high-confidence AST/compiler analyzer evidence detected.", [...new Set(index.files.map((file) => file.analyzer))]),
    cap(80, !hasBenchmarkFixture, "No benchmark or fixture corpus detected.", []),
    cap(80, !hasGeneratedOutputValidation, "Generated output validation was not confirmed.", [])
  ];
}

function cap(capValue: number, applied: boolean, reason: string, evidence: string[]): ReadinessCap {
  return { cap: capValue, applied, reason, evidence };
}

function applyCaps(score: number, caps: ReadinessCap[]): number {
  const appliedCaps = caps.filter((cap) => cap.applied).map((cap) => cap.cap);
  return Math.min(score, ...(appliedCaps.length ? appliedCaps : [100]));
}

function assessStructure(scan: RepoScan, index: RepoIndex, graph: DependencyGraph): ReadinessCategory {
  let score = 20;
  const evidence: string[] = [];
  const missing: string[] = [];
  if (scan.entrypoints.length) {
    score += 25;
    evidence.push(...scan.entrypoints.map((file) => `Entrypoint: ${file}`));
  } else missing.push("No clear application entrypoint detected.");
  if (index.modules.length > 1) {
    score += 25;
    evidence.push(`${index.modules.length} modules detected.`);
  } else missing.push("Module boundaries are weak or not obvious.");
  if (graph.moduleEdges.length || graph.fileEdges.length) {
    score += 20;
    evidence.push(`${graph.fileEdges.length} dependency edges detected.`);
  } else missing.push("No internal dependency edges detected.");
  const usableAnalysis = index.files.filter((file) => file.confidence !== "low").length;
  const confidenceRatio = index.files.length ? usableAnalysis / index.files.length : 0;
  score += Math.round(confidenceRatio * 10);
  evidence.push(`${Math.round(confidenceRatio * 100)}% of files have medium/high-confidence analysis.`);
  return category("structure", score, evidence, missing);
}

function assessCommands(scan: RepoScan): ReadinessCategory {
  let score = 20;
  const evidence: string[] = [];
  const missing: string[] = [];
  if (scan.runCommands.length) {
    score += 25;
    evidence.push(...scan.runCommands.map((command) => `Run command: ${command}`));
  } else missing.push("No run/dev command detected.");
  if ((scan.lintCommands ?? []).length) {
    score += 25;
    evidence.push(...(scan.lintCommands ?? []).map((command) => `Lint command: ${command}`));
  } else missing.push("No lint/format command detected.");
  if ((scan.typecheckCommands ?? []).length) {
    score += 30;
    evidence.push(...(scan.typecheckCommands ?? []).map((command) => `Typecheck command: ${command}`));
  } else missing.push("No typecheck command detected.");
  return category("commands", score, evidence, missing);
}

function assessTests(scan: RepoScan): ReadinessCategory {
  let score = 10;
  const evidence: string[] = [];
  const missing: string[] = [];
  const tests = scan.files.filter((file) => file.isTest);
  if (scan.testCommands.length) {
    score += 45;
    evidence.push(...scan.testCommands.map((command) => `Test/check command: ${command}`));
  } else missing.push("No test/check command detected.");
  if (tests.length) {
    score += 35;
    evidence.push(`${tests.length} test files detected.`);
  } else missing.push("No test files detected.");
  if ((scan.ciFiles ?? []).length) {
    score += 10;
    evidence.push(...(scan.ciFiles ?? []).map((file) => `CI: ${file}`));
  } else missing.push("No CI workflow detected.");
  return category("tests", score, evidence, missing);
}

function assessArchitecture(scan: RepoScan, index: RepoIndex): ReadinessCategory {
  let score = 20;
  const evidence: string[] = [];
  const missing: string[] = [];
  if (scan.files.some((file) => file.path.toLowerCase().includes("readme"))) {
    score += 25;
    evidence.push("README documentation detected.");
  } else missing.push("No README detected.");
  if (hasArchitectureDocumentation(scan)) {
    score += 35;
    evidence.push("Architecture documentation detected.");
  } else missing.push("No architecture summary detected.");
  const docsText = index.files
    .filter((file) => file.kind === "docs")
    .map((file) => `${file.path} ${file.summary}`)
    .join(" ")
    .toLowerCase();
  const largeModules = index.modules.filter((module) => module.files.length > 50 && module.name !== "root" && !docsText.includes(module.name.toLowerCase()));
  if (!largeModules.length) score += 20;
  for (const module of largeModules.slice(0, 3)) missing.push(`Large undocumented module: ${module.pathPrefix}.`);
  return category("architecture", score, evidence, missing);
}

function assessTaskContext(index: RepoIndex, graph: DependencyGraph): ReadinessCategory {
  let score = 20;
  const evidence: string[] = [];
  const missing: string[] = [];
  if (index.symbols.length) {
    score += 25;
    evidence.push(`${index.symbols.length} code symbols extracted.`);
  } else missing.push("No code symbols extracted.");
  if (graph.fileEdges.some((edge) => !edge.isExternal)) {
    score += 25;
    evidence.push("Internal dependency neighbors are available.");
  } else missing.push("Task context cannot expand through internal dependencies.");
  const evidenceFiles = index.files.filter((file) => file.evidence?.length);
  if (evidenceFiles.length) {
    score += 30;
    evidence.push(`${evidenceFiles.length} files include analysis evidence.`);
  } else missing.push("No file-level evidence is available.");
  return category("task-context", score, evidence, missing);
}

function assessSafety(scan: RepoScan): ReadinessCategory {
  let score = 35;
  const evidence: string[] = [];
  const missing: string[] = [];
  if ((scan.envExampleFiles ?? []).length) {
    score += 25;
    evidence.push(...(scan.envExampleFiles ?? []).map((file) => `Environment example: ${file}`));
  } else missing.push("No environment variable example detected.");
  if ((scan.ciFiles ?? []).length) {
    score += 20;
    evidence.push(...(scan.ciFiles ?? []).map((file) => `CI workflow: ${file}`));
  } else missing.push("No CI workflow detected.");
  const hasDatabaseSignals = scan.files.some((file) => /(^|\/)(prisma|database|db|schema\.sql)(\/|\.|$)/i.test(file.path));
  if ((scan.migrationFiles ?? []).length) {
    score += 20;
    evidence.push(`${(scan.migrationFiles ?? []).length} migration-related files detected.`);
  } else if (hasDatabaseSignals) {
    missing.push("Database signals detected but no migration guidance found.");
  } else {
    score += 20;
    evidence.push("No database signals detected; migration guidance is not applicable.");
  }
  return category("safety", score, evidence, missing);
}

function category(name: ReadinessCategory["category"], score: number, evidence: string[], missing: string[]): ReadinessCategory {
  return { category: name, score: Math.max(0, Math.min(100, score)), evidence, missing };
}

function weighted(items: Array<[number, number]>): number {
  return Math.round(items.reduce((sum, [score, weight]) => sum + score * weight, 0));
}

function dimensionScore(dimensions: ReadinessDimension[], name: ReadinessDimension["category"]): number {
  return dimensions.find((dimension) => dimension.category === name)?.score ?? 0;
}

function grade(score: number): AgentReadinessReport["grade"] {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function hasArchitectureDocumentation(scan: RepoScan): boolean {
  return scan.files.some((file) => file.kind === "docs" && /(^|\/)(architecture|design|adr|decisions?)(\.|\/|$)/i.test(file.path));
}

function list(items: string[]): string[] {
  return items.length ? items.map((item) => `- ${item}`) : ["- None."];
}

function title(value: string): string {
  return value
    .split("-")
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}
