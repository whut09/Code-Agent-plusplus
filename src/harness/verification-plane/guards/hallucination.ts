import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ContextPackage, IndexedFile, ImportRef } from "../../../core/types.js";
import { changedFilesSince, runGit } from "../../../core/git.js";
import { readExecutionTrace, traceIdForTask } from "../../observability/execution-trace.js";
import { bullet, heading, table } from "../../../outputs/renderers/markdown.js";
import type { GuardResult } from "../../types.js";
import { createGuardResult } from "../../types.js";

export type HallucinationKind = "missing_file" | "missing_symbol" | "missing_command" | "missing_dependency" | "missing_config";
export type HallucinationSeverity = "error" | "warning";

export interface HallucinationFinding {
  kind: HallucinationKind;
  severity: HallucinationSeverity;
  claim: string;
  evidenceChecked: string[];
  repairSuggestion: string;
}

export interface HallucinationGuardOptions {
  base?: string;
  task?: string;
  traceId?: string;
}

export interface HallucinationGuardReport {
  taskId: string;
  task?: string;
  base: string;
  traceId?: string;
  traceLoaded: boolean;
  checked: {
    files: number;
    commands: number;
    dependencies: number;
    symbols: number;
    configKeys: number;
  };
  summary: {
    errors: number;
    warnings: number;
  };
  findings: HallucinationFinding[];
  results: GuardResult[];
}

interface CommandClaim {
  command: string;
  source: string;
}

interface SymbolImportClaim {
  file: IndexedFile;
  imported: string;
  specifier: string;
  resolvedPath: string;
}

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py"];
const PATH_CLAIM_PATTERN = /(?:^|[\s"'`(])((?:\.{1,2}\/|[A-Za-z0-9_.-]+\/)[A-Za-z0-9_./@-]+\.[A-Za-z0-9]+)(?=$|[\s"'`),:;])/g;
const IMPORT_NAMED_PATTERN = /\b(?:import|export)\s+(?:type\s+)?\{([^}]+)\}\s+from\s+["']([^"']+)["']/g;
const PYTHON_FROM_IMPORT_PATTERN = /^\s*from\s+([A-Za-z0-9_.]+|\.+[A-Za-z0-9_.]*)\s+import\s+([A-Za-z0-9_,\s]+)/gm;
const ENV_PATTERN = /\b(?:process\.env\.([A-Z][A-Z0-9_]*)|os\.environ\[['"]([A-Z][A-Z0-9_]*)['"]\]|getenv\(['"]([A-Z][A-Z0-9_]*)['"]\))/g;

export function buildHallucinationReport(context: ContextPackage, options: HallucinationGuardOptions = {}): HallucinationGuardReport {
  const base = options.base ?? "main";
  const trace = options.traceId ? readExecutionTrace(context.scan.root, options.traceId) : null;
  const task = options.task ?? trace?.task;
  const taskId = options.traceId ?? (task ? traceIdForTask(task) : "hallucination-check");
  const changedFiles = changedFilesForGuard(context, base);
  const indexedByPath = new Map(context.index.files.map((file) => [file.path, file]));
  const modified = changedFiles.map((file) => indexedByPath.get(file)).filter((file): file is IndexedFile => Boolean(file));
  const fileSet = new Set(context.scan.files.map((file) => file.path));
  const packageIndex = readPackageIndex(context.scan.root);
  const findings: HallucinationFinding[] = [];

  const commandClaims = collectCommandClaims(trace);
  for (const claim of commandClaims) {
    const script = packageScriptClaim(claim.command);
    if (!script) continue;
    if (!packageIndex.scripts.has(script.name)) {
      findings.push({
        kind: "missing_command",
        severity: "error",
        claim: claim.command,
        evidenceChecked: [`package scripts: ${[...packageIndex.scripts].sort().join(", ") || "none"}`, claim.source],
        repairSuggestion: `Use an existing package script or add a real "${script.name}" script before asking the agent to run it.`
      });
    }
  }

  for (const file of modified.filter((item) => item.kind === "source" || item.kind === "test" || item.kind === "config")) {
    for (const ref of file.imports) {
      const missing = missingImportFinding(context, file, ref, packageIndex);
      if (missing) findings.push(missing);
    }
    for (const claim of collectNamedImportClaims(context, file)) {
      if (!exportExists(context, claim.resolvedPath, claim.imported)) {
        findings.push({
          kind: "missing_symbol",
          severity: "error",
          claim: `${claim.imported} imported from ${claim.specifier} in ${claim.file.path}`,
          evidenceChecked: [`resolved import target: ${claim.resolvedPath}`, `target exports/symbols in ${claim.resolvedPath}`],
          repairSuggestion: `Import an existing export from ${claim.resolvedPath}, add the missing export there, or correct the symbol name.`
        });
      }
    }
    if (file.kind === "source" || file.kind === "config") {
      for (const envKey of collectEnvClaims(file)) {
        if (!configKeyExists(context, envKey)) {
          findings.push({
            kind: "missing_config",
            severity: "warning",
            claim: `${envKey} referenced in ${file.path}`,
            evidenceChecked: [...context.scan.envExampleFiles, ...context.scan.configFiles].slice(0, 20),
            repairSuggestion: `Document ${envKey} in an env example or project config before relying on it.`
          });
        }
      }
    }
  }

  for (const claim of collectFileReferenceClaims(context, base, trace)) {
    if (!fileSet.has(claim.path) && !existsSync(path.join(context.scan.root, claim.path))) {
      findings.push({
        kind: "missing_file",
        severity: claim.source === "modified import" ? "error" : "warning",
        claim: claim.path,
        evidenceChecked: [`source: ${claim.source}`, "scanned repository file index", "working tree path lookup"],
        repairSuggestion: `Use an existing path or create ${claim.path} intentionally with tests and context updates.`
      });
    }
  }

  const deduped = dedupeFindings(findings);
  const results = deduped.map(hallucinationFindingToResult);
  return {
    taskId,
    task,
    base,
    traceId: options.traceId,
    traceLoaded: Boolean(trace),
    checked: {
      files: fileSet.size,
      commands: commandClaims.length,
      dependencies: modified.reduce((sum, file) => sum + file.imports.length, 0),
      symbols: modified.reduce((sum, file) => sum + collectNamedImportClaims(context, file).length, 0),
      configKeys: modified.filter((file) => file.kind === "source" || file.kind === "config").reduce((sum, file) => sum + collectEnvClaims(file).length, 0)
    },
    summary: {
      errors: deduped.filter((finding) => finding.severity === "error").length,
      warnings: deduped.filter((finding) => finding.severity === "warning").length
    },
    findings: deduped,
    results
  };
}

export function renderHallucinationReport(report: HallucinationGuardReport): string {
  return [
    heading(1, "Hallucination Guard"),
    "",
    `Task ID: ${report.taskId}`,
    report.task ? `Task: ${report.task}` : "Task: unknown",
    `Base: ${report.base}`,
    report.traceId ? `Trace: ${report.traceId} (${report.traceLoaded ? "loaded" : "missing"})` : "Trace: none",
    "",
    heading(2, "Summary"),
    table(
      ["Signal", "Count"],
      [
        ["Errors", String(report.summary.errors)],
        ["Warnings", String(report.summary.warnings)],
        ["Commands checked", String(report.checked.commands)],
        ["Imports checked", String(report.checked.dependencies)],
        ["Named imports checked", String(report.checked.symbols)],
        ["Config keys checked", String(report.checked.configKeys)]
      ]
    ),
    "",
    heading(2, "Findings"),
    bullet(report.findings.map(formatFinding))
  ].join("\n");
}

export function writeHallucinationReport(context: ContextPackage, report: HallucinationGuardReport): { json: string; markdown: string } {
  const root = context.scan.root;
  const hallucinationDir = path.join(root, ".agent-context", "hallucination");
  const runDir = path.join(root, ".agent-context", "runs", report.taskId);
  mkdirSync(hallucinationDir, { recursive: true });
  mkdirSync(runDir, { recursive: true });
  const jsonPath = path.join(hallucinationDir, `${report.taskId}.json`);
  const markdownPath = path.join(runDir, "hallucination.md");
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeFileSync(markdownPath, `${renderHallucinationReport(report)}\n`, "utf8");
  return {
    json: path.relative(root, jsonPath).replaceAll("\\", "/"),
    markdown: path.relative(root, markdownPath).replaceAll("\\", "/")
  };
}

function collectCommandClaims(trace: ReturnType<typeof readExecutionTrace>): CommandClaim[] {
  if (!trace) return [];
  const claims: CommandClaim[] = [];
  for (const step of trace.steps) {
    if (step.command) claims.push({ command: step.command, source: `trace ${trace.id} ${step.id}` });
    if (step.test) claims.push({ command: step.test, source: `trace ${trace.id} ${step.id}` });
    for (const text of [step.reason, step.output]) {
      for (const command of extractCommandMentions(text ?? "")) claims.push({ command, source: `trace ${trace.id} ${step.id}` });
    }
  }
  return dedupeBy(claims, (claim) => `${claim.command}:${claim.source}`);
}

function extractCommandMentions(text: string): string[] {
  const commands: string[] = [];
  const pattern = /\b(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?[A-Za-z0-9:_-]+(?:\s+--[^\n`'"]*)?/g;
  for (const match of text.matchAll(pattern)) commands.push(match[0].trim());
  return commands;
}

function packageScriptClaim(command: string): { runner: string; name: string } | undefined {
  const normalized = command.trim();
  const match = normalized.match(/^(npm|pnpm|bun)\s+(?:run\s+)?([A-Za-z0-9:_-]+)/) ?? normalized.match(/^yarn\s+(?:run\s+)?([A-Za-z0-9:_-]+)/);
  if (!match) return undefined;
  if (normalized.startsWith("yarn")) return { runner: "yarn", name: match[1] === "test" ? "test" : match[1] };
  const runner = match[1];
  const name = match[2];
  if (runner === "npm" && name === "test") return { runner, name: "test" };
  if ((runner === "pnpm" || runner === "bun") && name === "test") return { runner, name: "test" };
  return { runner, name };
}

function missingImportFinding(
  context: ContextPackage,
  file: IndexedFile,
  ref: ImportRef,
  packageIndex: ReturnType<typeof readPackageIndex>
): HallucinationFinding | undefined {
  if (isLocalSpecifier(ref.specifier) && !ref.resolvedPath) {
    return {
      kind: "missing_file",
      severity: "error",
      claim: `${ref.specifier} imported by ${file.path}`,
      evidenceChecked: [`analyzer: ${file.analyzer}`, `import resolution result: ${ref.resolvedPath ?? "unresolved"}`],
      repairSuggestion: `Point the import at an existing local file or create the missing module intentionally.`
    };
  }
  if (!ref.isExternal || isLocalSpecifier(ref.specifier)) return undefined;
  const packageName = packageNameForSpecifier(ref.specifier);
  if (!packageName || isNodeBuiltin(packageName) || packageIndex.dependencies.has(packageName)) return undefined;
  return {
    kind: "missing_dependency",
    severity: "warning",
    claim: `${ref.specifier} imported by ${file.path}`,
    evidenceChecked: ["package.json dependencies/devDependencies/peerDependencies/optionalDependencies", "Node.js builtin module list"],
    repairSuggestion: `Install or declare ${packageName}, or replace the import with an existing project dependency.`
  };
}

function collectNamedImportClaims(context: ContextPackage, file: IndexedFile): SymbolImportClaim[] {
  const content = readFile(file.absolutePath);
  if (!content) return [];
  const claims: SymbolImportClaim[] = [];
  for (const match of content.matchAll(IMPORT_NAMED_PATTERN)) {
    const symbols = splitNamedImports(match[1]);
    const specifier = match[2];
    const resolvedPath = resolveImportSpecifier(context, file.path, specifier);
    if (!resolvedPath) continue;
    for (const imported of symbols) claims.push({ file, imported, specifier, resolvedPath });
  }
  if (file.extension === ".py") {
    for (const match of content.matchAll(PYTHON_FROM_IMPORT_PATTERN)) {
      const specifier = match[1];
      const resolvedPath = resolvePythonSpecifier(context, file.path, specifier);
      if (!resolvedPath) continue;
      for (const imported of splitNamedImports(match[2])) claims.push({ file, imported, specifier, resolvedPath });
    }
  }
  return claims;
}

function collectEnvClaims(file: IndexedFile): string[] {
  const content = readFile(file.absolutePath);
  if (!content) return [];
  const keys = new Set<string>();
  for (const match of content.matchAll(ENV_PATTERN)) {
    const key = match[1] ?? match[2] ?? match[3];
    if (key) keys.add(key);
  }
  return [...keys].sort();
}

function collectFileReferenceClaims(
  context: ContextPackage,
  base: string,
  trace: ReturnType<typeof readExecutionTrace>
): Array<{ path: string; source: string }> {
  const claims: Array<{ path: string; source: string }> = [];
  if (trace) {
    for (const step of trace.steps) {
      for (const file of step.files) claims.push({ path: normalizeClaimPath(file), source: `trace ${trace.id} ${step.id}` });
      for (const text of [step.reason, step.output, step.command, step.test]) {
        for (const file of extractPathClaims(text ?? "")) claims.push({ path: file, source: `trace ${trace.id} ${step.id}` });
      }
    }
  }
  const diff = gitDiff(context.scan.root, base);
  let currentDiffFile = "";
  for (const line of diff.split(/\r?\n/)) {
    if (line.startsWith("+++ b/")) {
      currentDiffFile = line.slice("+++ b/".length).trim();
      continue;
    }
    if (isGeneratedContextFile(currentDiffFile)) continue;
    if (!line.startsWith("+") || line.startsWith("+++")) continue;
    if (looksLikeImportLine(line.slice(1))) continue;
    for (const file of extractPathClaims(line.slice(1))) claims.push({ path: file, source: "diff added line" });
  }
  return dedupeBy(
    claims.filter((claim) => isCheckablePathClaim(claim.path)),
    (claim) => `${claim.path}:${claim.source}`
  );
}

function changedFilesForGuard(context: ContextPackage, base: string): string[] {
  const files = new Set<string>();
  try {
    for (const file of changedFilesSince(context.scan.root, base)) files.add(file);
  } catch {
    // Non-git repositories still get transcript and current-index checks.
  }
  try {
    for (const line of runGit(context.scan.root, ["status", "--porcelain", "--untracked-files=all"]).split(/\r?\n/)) {
      if (line.length <= 3) continue;
      const file = line.slice(3).trim().replace(/\\/g, "/").split(" -> ").pop();
      if (file && !file.startsWith(".agent-context/")) files.add(file);
    }
  } catch {
    // Keep the guard usable outside git.
  }
  return [...files].sort();
}

function readPackageIndex(root: string): { scripts: Set<string>; dependencies: Set<string> } {
  const packagePath = path.join(root, "package.json");
  const scripts = new Set<string>();
  const dependencies = new Set<string>();
  if (!existsSync(packagePath)) return { scripts, dependencies };
  try {
    const pkg = JSON.parse(readFileSync(packagePath, "utf8")) as Record<string, unknown>;
    for (const key of Object.keys(recordValue(pkg.scripts))) scripts.add(key);
    for (const section of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
      for (const key of Object.keys(recordValue(pkg[section]))) dependencies.add(key);
    }
  } catch {
    // Invalid package.json is handled by config/validator paths.
  }
  return { scripts, dependencies };
}

function configKeyExists(context: ContextPackage, key: string): boolean {
  const candidates = [...context.scan.envExampleFiles, ...context.scan.configFiles].slice(0, 80);
  return candidates.some((file) => readFile(path.join(context.scan.root, file))?.includes(key));
}

function resolveImportSpecifier(context: ContextPackage, fromFile: string, specifier: string): string | undefined {
  const source = context.index.files.find((file) => file.path === fromFile);
  const ref = source?.imports.find((item) => item.specifier === specifier && item.resolvedPath);
  if (ref?.resolvedPath) return ref.resolvedPath;
  if (!isLocalSpecifier(specifier)) return undefined;
  const fromDir = path.posix.dirname(fromFile);
  const base = path.posix.normalize(path.posix.join(fromDir, specifier));
  return resolveCandidate(context, base);
}

function resolvePythonSpecifier(context: ContextPackage, fromFile: string, specifier: string): string | undefined {
  if (specifier.startsWith(".")) {
    const dots = specifier.match(/^\.+/)?.[0].length ?? 1;
    const rest = specifier.slice(dots).replace(/\./g, "/");
    let dir = path.posix.dirname(fromFile);
    for (let index = 1; index < dots; index += 1) dir = path.posix.dirname(dir);
    return resolveCandidate(context, path.posix.join(dir, rest));
  }
  return resolveCandidate(context, specifier.replace(/\./g, "/"));
}

function resolveCandidate(context: ContextPackage, base: string): string | undefined {
  const files = new Set(context.index.files.map((file) => file.path));
  if (files.has(base)) return base;
  for (const ext of SOURCE_EXTENSIONS) {
    if (files.has(`${base}${ext}`)) return `${base}${ext}`;
    if (files.has(`${base}/index${ext}`)) return `${base}/index${ext}`;
    if (files.has(`${base}/__init__${ext}`)) return `${base}/__init__${ext}`;
  }
  return undefined;
}

function exportExists(context: ContextPackage, filePath: string, symbol: string): boolean {
  const file = context.index.files.find((item) => item.path === filePath);
  if (!file) return false;
  const exported = new Set([...file.exports, ...file.symbols.map((item) => item.name)]);
  return exported.has(symbol) || symbol === "default";
}

function splitNamedImports(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) =>
      item
        .replace(/^type\s+/, "")
        .split(/\s+as\s+/i)[0]
        .trim()
    )
    .filter((item) => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(item));
}

function extractPathClaims(text: string): string[] {
  const paths = new Set<string>();
  for (const match of text.matchAll(PATH_CLAIM_PATTERN)) {
    paths.add(normalizeClaimPath(match[1]));
  }
  return [...paths];
}

function normalizeClaimPath(value: string): string {
  return value
    .replace(/\\/g, "/")
    .replace(/^['"`(]+|['"`),:;]+$/g, "")
    .replace(/^\.\//, "");
}

function isCheckablePathClaim(value: string): boolean {
  if (!value || value.startsWith("http://") || value.startsWith("https://")) return false;
  if (/^(node_modules|dist|build|coverage)\//.test(value)) return false;
  return value.includes("/") && /\.[A-Za-z0-9]+$/.test(value);
}

function isGeneratedContextFile(filePath: string): boolean {
  return filePath === "AGENTS.md" || filePath.startsWith(".agent-context/");
}

function packageNameForSpecifier(specifier: string): string | undefined {
  if (!specifier || specifier.startsWith("node:")) return specifier.replace(/^node:/, "");
  if (specifier.startsWith("@")) return specifier.split("/").slice(0, 2).join("/");
  return specifier.split("/")[0];
}

function isLocalSpecifier(specifier: string): boolean {
  return specifier.startsWith(".") || specifier.startsWith("/");
}

function isNodeBuiltin(name: string): boolean {
  const normalized = name.replace(/^node:/, "").split("/")[0];
  return new Set([
    "assert",
    "buffer",
    "child_process",
    "crypto",
    "events",
    "fs",
    "http",
    "https",
    "module",
    "net",
    "test",
    "os",
    "path",
    "process",
    "stream",
    "timers",
    "url",
    "util",
    "zlib"
  ]).has(normalized);
}

function looksLikeImportLine(line: string): boolean {
  return /^\s*(?:import|export)\b/.test(line) || /\bfrom\s+["'][^"']+["']/.test(line) || /\brequire\(["'][^"']+["']\)/.test(line);
}

function gitDiff(root: string, base: string): string {
  try {
    return runGit(root, ["diff", "--unified=0", base]);
  } catch {
    return "";
  }
}

function readFile(filePath: string): string | undefined {
  try {
    return readFileSync(filePath, "utf8");
  } catch {
    return undefined;
  }
}

function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function hallucinationFindingToResult(finding: HallucinationFinding, index: number): GuardResult {
  if (finding.kind === "missing_command") {
    return createGuardResult({
      id: "hallucination.missing-command",
      source: "hallucination",
      kind: "required",
      status: "missing",
      severity: "required",
      message: `${finding.kind}: ${finding.claim}`,
      blocking: true,
      confidence: 0.92,
      reasons: [finding.claim, finding.repairSuggestion, ...finding.evidenceChecked],
      requiredCommands: [],
      artifacts: [],
      evidence: finding.evidenceChecked
    });
  }

  const blocking = finding.severity === "error";
  return createGuardResult({
    id: `hallucination.${finding.kind}.${index + 1}`,
    source: "hallucination",
    kind: blocking ? "forbidden" : "risk",
    status: blocking ? "failed" : "warning",
    severity: finding.severity,
    message: `${finding.kind}: ${finding.claim}`,
    blocking,
    confidence: blocking ? 0.92 : 0.72,
    reasons: [finding.claim, finding.repairSuggestion, ...finding.evidenceChecked],
    requiredCommands: [],
    artifacts: [],
    evidence: finding.evidenceChecked
  });
}

function dedupeFindings(findings: HallucinationFinding[]): HallucinationFinding[] {
  return dedupeBy(findings, (finding) => `${finding.kind}:${finding.severity}:${finding.claim}`);
}

function dedupeBy<T>(items: T[], keyFor: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = keyFor(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function formatFinding(finding: HallucinationFinding): string {
  return `${finding.severity.toUpperCase()} ${finding.kind}: ${finding.claim}. Checked: ${finding.evidenceChecked.join("; ")}. Repair: ${finding.repairSuggestion}`;
}
