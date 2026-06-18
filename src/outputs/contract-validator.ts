import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { ContextPackage, IndexedFile } from "../core/types.js";
import { changedFilesSince, runGit } from "../core/git.js";
import { bullet, code, heading } from "./renderers/markdown.js";
import { buildRepoContracts } from "./contracts.js";

export interface ContractValidationOptions {
  base?: string;
  diff?: boolean;
}

export interface ContractViolation {
  severity: "error" | "warning";
  file: string;
  message: string;
  reason: string;
  rule: string;
}

export interface ContractValidationReport {
  passed: boolean;
  base: string;
  changedFiles: string[];
  violations: ContractViolation[];
}

interface ArchitectureLayerRule {
  name: string;
  owns: string[];
  allowedImports?: string[];
  forbiddenImports?: string[];
  rule?: string;
}

interface ArchitectureContract {
  layers?: ArchitectureLayerRule[];
}

interface ModuleBoundaryRule {
  owns: string[];
  allowedImports?: string[];
  forbiddenImports?: string[];
}

interface ModuleBoundariesContract {
  modules?: Record<string, ModuleBoundaryRule>;
}

interface TestContract {
  sourceToRelatedTests?: Record<string, string[]>;
}

interface SafetyContract {
  protectedPaths?: {
    generated?: string[];
    lockfiles?: string[];
    migrations?: string[];
    envExamples?: string[];
    ci?: string[];
  };
}

export function validateContracts(context: ContextPackage, options: ContractValidationOptions = {}): ContractValidationReport {
  const base = options.base ?? "main";
  const changedFiles = changedFilesForContracts(context, base, options.diff ?? true);
  const changedSet = new Set(changedFiles);
  const indexed = new Map(context.index.files.map((file) => [file.path, file]));
  const contracts = loadContracts(context);
  const violations: ContractViolation[] = [];

  validateProtectedPaths(changedFiles, contracts.safety, violations);
  validateLockfilePairing(changedFiles, contracts.safety, violations);
  validateEnvExamples(context, changedFiles, contracts.safety, violations);
  validateArchitectureLayers(context, changedFiles, indexed, contracts.architecture, violations);
  validateModuleBoundaries(context, changedFiles, indexed, contracts.moduleBoundaries, violations);
  validateChangedSourceTests(changedFiles, changedSet, contracts.test, violations);

  return {
    passed: !violations.some((violation) => violation.severity === "error"),
    base,
    changedFiles,
    violations
  };
}

export function renderContractValidationReport(context: ContextPackage, options: ContractValidationOptions = {}): string {
  const report = validateContracts(context, options);
  return [
    heading(1, "Contract Check"),
    "",
    `Base: ${report.base}`,
    `Contract check: ${report.passed ? "passed" : "failed"}`,
    "",
    heading(2, "Changed files"),
    bullet(report.changedFiles.map(code)),
    "",
    heading(2, "Violations"),
    bullet(report.violations.map(formatViolation))
  ].join("\n");
}

function loadContracts(context: ContextPackage): {
  architecture: ArchitectureContract;
  moduleBoundaries: ModuleBoundariesContract;
  test: TestContract;
  safety: SafetyContract;
} {
  const generated = buildRepoContracts(context);
  return {
    architecture: {
      ...asRecord(generated.architecture),
      ...readContract(context, "architecture.contract.json")
    },
    moduleBoundaries: {
      ...asRecord(generated.moduleBoundaries),
      ...readContract(context, "module-boundaries.json")
    },
    test: {
      ...asRecord(generated.test),
      ...readContract(context, "test.contract.json")
    },
    safety: {
      ...asRecord(generated.safety),
      ...readContract(context, "safety.contract.json")
    }
  };
}

function readContract(context: ContextPackage, relativePath: string): Record<string, unknown> {
  const filePath = path.join(context.scan.root, ".agent-context", "contracts", relativePath);
  if (!existsSync(filePath)) return {};
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function validateProtectedPaths(changedFiles: string[], safety: SafetyContract, violations: ContractViolation[]): void {
  const protectedPaths = safety.protectedPaths ?? {};
  const groups: Array<[string, string[] | undefined, string, string]> = [
    ["generated", protectedPaths.generated, "Generated files should not be edited directly.", "safety.contract.json#protectedPaths.generated"],
    [
      "migration",
      protectedPaths.migrations,
      "Migrations and schemas are protected unless the task explicitly requires them.",
      "safety.contract.json#protectedPaths.migrations"
    ],
    ["ci", protectedPaths.ci, "CI and deployment files are protected unless the task explicitly requires them.", "safety.contract.json#protectedPaths.ci"]
  ];

  for (const file of changedFiles) {
    if (file.startsWith(".agent-context/")) {
      continue;
    }
    for (const [label, globs, reason, rule] of groups) {
      if (!globs?.some((glob) => matchesGlob(file, glob))) continue;
      violations.push({
        severity: label === "generated" ? "warning" : "error",
        file,
        message: `${file} matches protected ${label} paths.`,
        reason,
        rule
      });
    }
  }
}

function validateLockfilePairing(changedFiles: string[], safety: SafetyContract, violations: ContractViolation[]): void {
  const lockfiles = safety.protectedPaths?.lockfiles ?? [];
  const changedLockfiles = changedFiles.filter((file) => lockfiles.some((glob) => matchesGlob(file, glob)) || isLockfile(file));
  if (!changedLockfiles.length) return;

  const packageManifests = changedFiles.filter(isPackageManifest);
  if (packageManifests.length) return;

  for (const file of changedLockfiles) {
    violations.push({
      severity: "error",
      file,
      message: `${file} changed without a package manifest change.`,
      reason: "Lockfile updates should correspond to an explicit dependency manifest change.",
      rule: "safety.contract.json#protectedPaths.lockfiles"
    });
  }
}

function validateEnvExamples(context: ContextPackage, changedFiles: string[], safety: SafetyContract, violations: ContractViolation[]): void {
  const changedEnvExamples = changedFiles.some((file) => context.scan.envExampleFiles.includes(file) || safety.protectedPaths?.envExamples?.includes(file));
  const declared = new Set(readDeclaredEnvNames(context));
  const introduced = new Set<string>();

  for (const file of changedFiles) {
    const indexed = context.index.files.find((candidate) => candidate.path === file);
    if (!indexed || indexed.isTest || !["source", "config"].includes(indexed.kind)) continue;
    for (const name of readEnvRefs(indexed.absolutePath)) {
      if (!declared.has(name)) introduced.add(name);
    }
  }

  if (!introduced.size || changedEnvExamples) return;

  for (const name of introduced) {
    violations.push({
      severity: "warning",
      file: [...changedFiles].find((file) => readEnvRefs(path.join(context.scan.root, file)).includes(name)) ?? "unknown",
      message: `Environment variable ${name} is referenced without updating an env example.`,
      reason: "New runtime configuration should be documented in .env.example or the repository's env template.",
      rule: "safety.contract.json#protectedPaths.envExamples"
    });
  }
}

function validateArchitectureLayers(
  context: ContextPackage,
  changedFiles: string[],
  indexed: Map<string, IndexedFile>,
  architecture: ArchitectureContract,
  violations: ContractViolation[]
): void {
  const layers = architecture.layers ?? [];
  for (const file of changedFiles) {
    const layer = layers.find((candidate) => candidate.owns.some((glob) => matchesGlob(file, glob)));
    const source = indexed.get(file);
    if (!layer || !source) continue;
    for (const edge of context.graph.fileEdges.filter((candidate) => candidate.from === file && !candidate.isExternal)) {
      if (layer.forbiddenImports?.some((glob) => matchesGlob(edge.to, glob))) {
        violations.push({
          severity: "error",
          file,
          message: `${file} imports ${edge.to}.`,
          reason: `${layer.name} layer must not depend on ${edge.to}.`,
          rule: layer.rule ?? `architecture.contract.json#layers.${layer.name}`
        });
        continue;
      }
      if (layer.allowedImports?.length && !layer.allowedImports.some((glob) => matchesGlob(edge.to, glob))) {
        violations.push({
          severity: "error",
          file,
          message: `${file} imports ${edge.to}.`,
          reason: `${layer.name} layer imports must match allowedImports.`,
          rule: layer.rule ?? `architecture.contract.json#layers.${layer.name}`
        });
      }
    }
  }
}

function validateModuleBoundaries(
  context: ContextPackage,
  changedFiles: string[],
  indexed: Map<string, IndexedFile>,
  boundaries: ModuleBoundariesContract,
  violations: ContractViolation[]
): void {
  const modules = boundaries.modules ?? {};
  for (const file of changedFiles) {
    const source = indexed.get(file);
    if (!source) continue;
    const boundary = modules[source.moduleName] ?? Object.values(modules).find((candidate) => candidate.owns.some((glob) => matchesGlob(file, glob)));
    if (!boundary) continue;

    for (const edge of context.graph.fileEdges.filter((candidate) => candidate.from === file && !candidate.isExternal)) {
      if (boundary.forbiddenImports?.some((glob) => matchesGlob(edge.to, glob))) {
        violations.push({
          severity: "error",
          file,
          message: `${file} imports forbidden path ${edge.to}.`,
          reason: "Changed files must not import module-boundary forbidden paths.",
          rule: `module-boundaries.json#modules.${source.moduleName}.forbiddenImports`
        });
        continue;
      }
      if (boundary.allowedImports?.length && !boundary.allowedImports.some((glob) => matchesGlob(edge.to, glob))) {
        violations.push({
          severity: "error",
          file,
          message: `${file} imports ${edge.to}, which is outside allowedImports.`,
          reason: "Changed files must stay inside their owning module or explicitly allowed imports.",
          rule: `module-boundaries.json#modules.${source.moduleName}.allowedImports`
        });
      }
    }
  }
}

function validateChangedSourceTests(changedFiles: string[], changedSet: Set<string>, test: TestContract, violations: ContractViolation[]): void {
  const sourceToRelatedTests = test.sourceToRelatedTests ?? {};
  for (const [source, relatedTests] of Object.entries(sourceToRelatedTests)) {
    if (!changedSet.has(source)) continue;
    if (relatedTests.some((testFile) => changedSet.has(testFile))) continue;
    if (!source.includes("/core/") && !source.startsWith("src/core/")) continue;

    violations.push({
      severity: "warning",
      file: source,
      message: `${source} changed without a related test change.`,
      reason: "Core-module changes should update or run a related test so verify can close the regression loop.",
      rule: "test.contract.json#sourceToRelatedTests"
    });
  }
}

function changedFilesForContracts(context: ContextPackage, base: string, includeDiff: boolean): string[] {
  const files = new Set<string>();
  if (includeDiff) {
    for (const file of changedFilesSince(context.scan.root, base)) {
      if (!isIgnoredGeneratedState(file)) files.add(file);
    }
  }

  try {
    for (const line of runGit(context.scan.root, ["status", "--porcelain", "--untracked-files=all"]).split(/\r?\n/)) {
      if (line.length <= 3) continue;
      const file = line.slice(3).trim().replace(/\\/g, "/").split(" -> ").pop();
      if (file && !isIgnoredGeneratedState(file)) files.add(file);
    }
  } catch {
    return [...files].sort();
  }

  return [...files].sort();
}

function isIgnoredGeneratedState(file: string): boolean {
  return file.startsWith(".agent-context/cache/");
}

function readEnvRefs(filePath: string): string[] {
  if (!existsSync(filePath)) return [];
  const content = readFileSync(filePath, "utf8");
  return unique([
    ...matches(content, /process\.env\.([A-Z][A-Z0-9_]*)/g),
    ...matches(content, /import\.meta\.env\.([A-Z][A-Z0-9_]*)/g),
    ...matches(content, /os\.environ\[['"]([A-Z][A-Z0-9_]*)['"]\]/g),
    ...matches(content, /getenv\(['"]([A-Z][A-Z0-9_]*)['"]\)/g)
  ]);
}

function readDeclaredEnvNames(context: ContextPackage): string[] {
  const names = new Set<string>();
  for (const relativePath of context.scan.envExampleFiles) {
    const absolutePath = path.join(context.scan.root, relativePath);
    if (!existsSync(absolutePath)) continue;
    for (const line of readFileSync(absolutePath, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=/);
      if (match?.[1]) names.add(match[1]);
    }
  }
  return [...names];
}

function matches(content: string, pattern: RegExp): string[] {
  return [...content.matchAll(pattern)].map((match) => match[1]).filter(Boolean);
}

function isPackageManifest(file: string): boolean {
  return /(^|\/)(package\.json|pyproject\.toml|Cargo\.toml|go\.mod|requirements.*\.txt)$/.test(file);
}

function isLockfile(file: string): boolean {
  return /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|poetry\.lock|Cargo\.lock|go\.sum)$/.test(file);
}

function formatViolation(violation: ContractViolation): string {
  return [
    `${violation.severity.toUpperCase()} ${code(violation.file)} - ${violation.message}`,
    `  Reason: ${violation.reason}`,
    `  Rule: ${violation.rule}`
  ].join("\n");
}

function matchesGlob(filePath: string, glob: string): boolean {
  if (glob === "*") return true;
  return new RegExp(`^${globToRegExp(glob)}$`).test(filePath);
}

function globToRegExp(glob: string): string {
  let pattern = "";
  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index];
    const next = glob[index + 1];
    if (char === "*" && next === "*") {
      pattern += ".*";
      index += 1;
    } else if (char === "*") {
      pattern += "[^/]*";
    } else {
      pattern += char.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    }
  }
  return pattern;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value ? (value as Record<string, unknown>) : {};
}

function unique(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))].sort();
}
