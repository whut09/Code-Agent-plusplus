import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildContextPackage } from "../../core/context-builder.js";
import { runGit } from "../../core/git.js";
import { parseCommandLine } from "../../core/safe-command.js";
import {
  appendExecutionTraceStep,
  currentWorkingTreeHash,
  executionTracePath,
  readExecutionTrace,
  startExecutionTrace,
  type ExecutionTrace,
  type ExecutionTraceStep
} from "../../harness/observability/execution-trace.js";
import { buildPolicyReport, renderPolicyReport, type PolicyEngineReport } from "../../harness/verification-plane/policy-engine.js";
import { buildHallucinationReport, renderHallucinationReport, type HallucinationGuardReport } from "../../harness/verification-plane/guards/hallucination.js";
import { buildRegressionReport, renderRegressionReport, type RegressionGuardReport } from "../../harness/verification-plane/guards/regression.js";
import { buildChangeImpactReport, type ChangeImpactReport } from "../../outputs/impact.js";
import { validateContracts, type ContractValidationReport } from "../../outputs/contract-validator.js";
import { buildTestSelection, type TestSelectionReport } from "../../outputs/test-selector.js";
import { renderTaskVerify } from "../../outputs/task-harness.js";
import { OPENCODE_SIDECAR_PLUGIN_PATH, opencodeSidecarPluginTemplate } from "./plugin-template.js";

export interface OpenCodeSidecarEnsureOptions {
  force?: boolean;
  dryRun?: boolean;
}

export interface OpenCodeSidecarStep {
  name: string;
  status: "pass" | "warn" | "fail" | "skipped";
  details: string;
}

export interface OpenCodeSidecarVerifyCheck {
  name: string;
  status: "pass" | "warn" | "fail";
  details: string;
}

export interface OpenCodeSidecarVerifyResult {
  repo: string;
  ok: boolean;
  pluginPath: string;
  eventLogPath: string;
  latestJsonPath: string;
  latestMarkdownPath: string;
  generatedAt: string;
  changedFiles: string[];
  blockers: string[];
  warnings: string[];
  checks: OpenCodeSidecarVerifyCheck[];
  guardStack: OpenCodeSidecarGuardStackSummary;
}

export interface OpenCodeSidecarGuardStackSummary {
  ran: boolean;
  passed: boolean;
  base: string;
  artifacts: {
    policyMarkdown?: string;
    taskVerifyMarkdown?: string;
  };
  contracts?: {
    passed: boolean;
    violations: number;
  };
  hallucination?: {
    errors: number;
    warnings: number;
  };
  regression?: {
    matches: number;
    missingRequiredTestEvidence: number;
  };
  impact?: {
    risk: ChangeImpactReport["risk"];
    changedFiles: number;
    relatedTests: number;
  };
  tests?: {
    minimalCommands: number;
    recommendedCommands: number;
    fullConfidenceCommands: number;
  };
  policy?: {
    passed: boolean;
    forbidden: number;
    requiredMissing: number;
    risks: number;
  };
  error?: string;
}

export interface OpenCodeSidecarCommandFinding {
  kind: "dangerous_command" | "unknown_script" | "unknown_make_target" | "unknown_pyproject_script" | "protected_path" | "secret_path";
  severity: "blocker" | "warning";
  message: string;
  evidence: string[];
}

export interface OpenCodeSidecarCommandCheckResult {
  repo: string;
  command: string | null;
  paths: string[];
  allowed: boolean;
  findings: OpenCodeSidecarCommandFinding[];
}

export interface OpenCodeSidecarToolRecordInput {
  tool?: string;
  command?: string;
  exitCode?: number | null;
  startedAt?: string;
  finishedAt?: string;
  stdout?: string;
  stderr?: string;
  stdoutHash?: string;
  stderrHash?: string;
  workingTreeHashBefore?: string;
  workingTreeHashAfter?: string;
  sessionId?: string;
  paths?: string[];
}

export interface OpenCodeSidecarToolRecordResult {
  repo: string;
  eventLogPath: string;
  traceId: string;
  tracePath: string;
  event: {
    type: "tool.execute.after";
    ts: string;
    tool: string;
    command: string | null;
    exitCode: number | null;
    startedAt: string;
    finishedAt: string;
    stdoutHash: string;
    stderrHash: string;
    workingTreeHashBefore: string;
    workingTreeHashAfter: string;
    filesTouched: string[];
    sessionId: string;
  };
  trace: ExecutionTrace;
  step: ExecutionTraceStep;
}

export function ensureOpencodeSidecarPlugin(repo: string, options: OpenCodeSidecarEnsureOptions = {}): OpenCodeSidecarStep {
  const root = path.resolve(repo);
  const filePath = path.join(root, OPENCODE_SIDECAR_PLUGIN_PATH);
  if (existsSync(filePath) && !options.force) {
    return { name: "sidecar-plugin", status: "pass", details: `${OPENCODE_SIDECAR_PLUGIN_PATH} already exists` };
  }

  if (options.dryRun) {
    return {
      name: "sidecar-plugin",
      status: existsSync(filePath) ? "warn" : "pass",
      details: existsSync(filePath) ? `${OPENCODE_SIDECAR_PLUGIN_PATH} would be overwritten with --force` : `${OPENCODE_SIDECAR_PLUGIN_PATH} would be generated`
    };
  }

  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, opencodeSidecarPluginTemplate(), "utf8");
  return { name: "sidecar-plugin", status: "pass", details: `${OPENCODE_SIDECAR_PLUGIN_PATH} generated` };
}

export async function verifyOpencodeSidecar(repo = "."): Promise<OpenCodeSidecarVerifyResult> {
  const root = path.resolve(repo);
  const pluginPath = path.join(root, OPENCODE_SIDECAR_PLUGIN_PATH);
  const eventLogPath = path.join(root, ".agent-context", "traces", "opencode-sidecar-events.jsonl");
  const latestJsonPath = path.join(root, ".agent-context", "sidecar", "latest.json");
  const latestMarkdownPath = path.join(root, ".agent-context", "sidecar", "latest.md");
  const generatedAt = new Date().toISOString();
  const checks: OpenCodeSidecarVerifyCheck[] = [];

  checks.push(checkGitRepo(root));
  checks.push(checkExists(".agent-context", path.join(root, ".agent-context"), "OpenCode++ context directory exists"));
  checks.push(checkExists(path.relative(root, pluginPath), pluginPath, "OpenCode sidecar plugin exists"));

  if (existsSync(pluginPath)) {
    const source = readFileSync(pluginPath, "utf8");
    checks.push(checkSource("plugin-export", source, /OpenCodePlusPlusSidecar/, "exports OpenCodePlusPlusSidecar"));
    checks.push(checkSource("file.edited hook", source, /createOpenCodePlusPlusSidecar|file\.edited/, "delegates file.edited handling to the sidecar runtime"));
    checks.push(
      checkSource("session.idle hook", source, /createOpenCodePlusPlusSidecar|session\.idle/, "delegates session.idle handling to the sidecar runtime")
    );
    checks.push(
      checkSource(
        "tool.execute.after hook",
        source,
        /createOpenCodePlusPlusSidecar|tool\.execute\.after/,
        "delegates post-tool evidence to the sidecar runtime"
      )
    );
  }

  checks.push(
    existsSync(eventLogPath)
      ? { name: "sidecar-event-log", status: "pass", details: `${path.relative(root, eventLogPath)} exists` }
      : {
          name: "sidecar-event-log",
          status: "warn",
          details: "no sidecar event log yet; start OpenCode with opencode-plusplus and trigger a session/edit first"
        }
  );

  const changedFiles = collectCurrentChangedFiles(root);
  const blockers = detectBlockers(changedFiles);
  const warnings = detectWarnings(changedFiles);
  const guardStack = await runOpencodeSidecarGuardStack(root, { base: "main" });
  blockers.push(...blockersFromGuardStack(guardStack));
  warnings.push(...warningsFromGuardStack(guardStack));
  checks.push({
    name: "current-diff",
    status: blockers.length ? "fail" : "pass",
    details: changedFiles.length ? `${changedFiles.length} changed file(s), ${blockers.length} blocker(s)` : "no source diff detected"
  });
  checks.push({
    name: "guard-stack",
    status: guardStack.passed ? "pass" : "fail",
    details: guardStack.ran
      ? `contracts/policy/impact/tests completed for base ${guardStack.base}`
      : `guard stack failed: ${guardStack.error ?? "unknown error"}`
  });

  const ok = checks.every((check) => check.status !== "fail");
  return {
    repo: root,
    ok,
    pluginPath,
    eventLogPath,
    latestJsonPath,
    latestMarkdownPath,
    generatedAt,
    changedFiles,
    blockers,
    warnings,
    checks,
    guardStack
  };
}

export function writeOpencodeSidecarLatest(result: OpenCodeSidecarVerifyResult): void {
  mkdirSync(path.dirname(result.latestJsonPath), { recursive: true });
  writeFileSync(result.latestJsonPath, `${JSON.stringify(toPersistedSidecarResult(result), null, 2)}\n`, "utf8");
  writeFileSync(result.latestMarkdownPath, `${renderOpencodeSidecarLatestMarkdown(result)}\n`, "utf8");
}

export function checkOpencodeSidecarCommand(repo = ".", input: { command?: string; paths?: string[] } = {}): OpenCodeSidecarCommandCheckResult {
  const root = path.resolve(repo);
  const command = input.command?.trim() || null;
  const paths = (input.paths ?? []).map((item) => normalizeToolPath(item)).filter(Boolean);
  const findings: OpenCodeSidecarCommandFinding[] = [];

  if (command) {
    findings.push(...checkDangerousCommand(command));
    findings.push(...checkScriptCommand(root, command));
    findings.push(...checkMakeCommand(root, command));
    findings.push(...checkPyprojectCommand(root, command));
    for (const pathFromCommand of extractPathLikeArguments(command)) {
      findings.push(...checkProtectedPath(pathFromCommand));
    }
  }

  for (const filePath of paths) {
    findings.push(...checkProtectedPath(filePath));
  }

  const unique = dedupeFindings(findings);
  return {
    repo: root,
    command,
    paths,
    allowed: !unique.some((finding) => finding.severity === "blocker"),
    findings: unique
  };
}

export function recordOpencodeSidecarTool(repo = ".", input: OpenCodeSidecarToolRecordInput = {}): OpenCodeSidecarToolRecordResult {
  const root = path.resolve(repo);
  const tracesDir = path.join(root, ".agent-context", "traces");
  const eventLogPath = path.join(tracesDir, "opencode-sidecar-events.jsonl");
  const finishedAt = input.finishedAt ?? new Date().toISOString();
  const startedAt = input.startedAt ?? finishedAt;
  const tool = input.tool?.trim() || "unknown";
  const command = input.command?.trim() || null;
  const sessionId = normalizeSessionId(input.sessionId);
  const traceId = `opencode-session-${sessionId}`;
  const stdoutHash = input.stdoutHash ?? hashText(input.stdout ?? "");
  const stderrHash = input.stderrHash ?? hashText(input.stderr ?? "");
  const workingTreeHashBefore = input.workingTreeHashBefore ?? currentWorkingTreeHash(root);
  const workingTreeHashAfter = input.workingTreeHashAfter ?? currentWorkingTreeHash(root);
  const filesTouched = [...new Set([...(input.paths ?? []).map(normalizeToolPath).filter(Boolean), ...collectCurrentChangedFiles(root)])].sort();
  const event = {
    type: "tool.execute.after" as const,
    ts: finishedAt,
    tool,
    command,
    exitCode: typeof input.exitCode === "number" ? input.exitCode : null,
    startedAt,
    finishedAt,
    stdoutHash,
    stderrHash,
    workingTreeHashBefore,
    workingTreeHashAfter,
    filesTouched,
    sessionId
  };

  mkdirSync(tracesDir, { recursive: true });
  appendFileSync(eventLogPath, `${JSON.stringify(event)}\n`, "utf8");

  let trace = readExecutionTrace(root, traceId);
  if (!trace) {
    trace = startExecutionTrace(root, `OpenCode sidecar session ${sessionId}`, { id: traceId, agent: "opencode" });
  }

  trace = appendExecutionTraceStep(root, traceId, {
    agent: "opencode",
    action: inferToolAction(tool, command),
    files: filesTouched,
    reason: "Captured from OpenCode tool.execute.after.",
    command: command ?? undefined,
    result: typeof input.exitCode === "number" ? (input.exitCode === 0 ? "passed" : "failed") : "unknown",
    evidenceSource: "command",
    capturedBy: "opencode-plusplus",
    exitCode: input.exitCode,
    startedAt,
    finishedAt,
    stdoutHash,
    stderrHash,
    workingTreeHashBefore,
    workingTreeHashAfter
  });

  const step = trace.steps.at(-1);
  if (!step) throw new Error(`Failed to append OpenCode sidecar trace step: ${traceId}`);

  return {
    repo: root,
    eventLogPath,
    traceId,
    tracePath: executionTracePath(root, traceId),
    event,
    trace,
    step
  };
}

export function renderOpencodeSidecarCommandCheck(result: OpenCodeSidecarCommandCheckResult): string {
  return [
    "OpenCode++ Sidecar Command Check",
    "",
    `Command: ${result.command ?? "none"}`,
    `Paths: ${result.paths.length ? result.paths.join(", ") : "none"}`,
    `Result: ${result.allowed ? "allow" : "block"}`,
    "",
    "Findings:",
    ...(result.findings.length ? result.findings.map((finding) => `- [${finding.severity.toUpperCase()}] ${finding.message}`) : ["- none"])
  ].join("\n");
}

export function renderOpencodeSidecarToolRecord(result: OpenCodeSidecarToolRecordResult): string {
  return [
    "OpenCode++ Sidecar Tool Record",
    "",
    `Tool: ${result.event.tool}`,
    `Command: ${result.event.command ?? "none"}`,
    `Exit code: ${result.event.exitCode ?? "unknown"}`,
    `Trace: ${path.relative(result.repo, result.tracePath).replaceAll("\\", "/")}`,
    `Event log: ${path.relative(result.repo, result.eventLogPath).replaceAll("\\", "/")}`,
    "",
    "Files touched:",
    ...(result.event.filesTouched.length ? result.event.filesTouched.map((file) => `- ${file}`) : ["- none"])
  ].join("\n");
}

export function renderOpencodeSidecarVerifyReport(result: OpenCodeSidecarVerifyResult): string {
  return [
    "OpenCode++ OpenCode Sidecar Verify",
    "",
    `Repo: ${result.repo}`,
    `Plugin: ${path.relative(result.repo, result.pluginPath)}`,
    `Event log: ${path.relative(result.repo, result.eventLogPath)}`,
    "",
    "Checks:",
    ...result.checks.map((check) => `- [${check.status.toUpperCase()}] ${check.name}: ${check.details}`),
    "",
    "Changed files:",
    ...(result.changedFiles.length ? result.changedFiles.map((file) => `- ${file}`) : ["- none"]),
    "",
    "Blockers:",
    ...(result.blockers.length ? result.blockers.map((blocker) => `- ${blocker}`) : ["- none"]),
    "",
    "Warnings:",
    ...(result.warnings.length ? result.warnings.map((warning) => `- ${warning}`) : ["- none"]),
    "",
    "Guard stack:",
    ...formatGuardStackLines(result.guardStack),
    "",
    result.ok ? "Result: ready" : "Result: failed"
  ].join("\n");
}

export function renderOpencodeSidecarLatestMarkdown(result: OpenCodeSidecarVerifyResult): string {
  return [
    "# OpenCode++ Sidecar Latest",
    "",
    `Generated: ${result.generatedAt}`,
    `Result: ${result.ok ? "ready" : "blocked"}`,
    "",
    "## Changed Files",
    ...(result.changedFiles.length ? result.changedFiles.map((file) => `- \`${file}\``) : ["- none"]),
    "",
    "## Blockers",
    ...(result.blockers.length ? result.blockers.map((blocker) => `- ${blocker}`) : ["- none"]),
    "",
    "## Warnings",
    ...(result.warnings.length ? result.warnings.map((warning) => `- ${warning}`) : ["- none"]),
    "",
    "## Guard Stack",
    ...formatGuardStackLines(result.guardStack),
    "",
    "## Checks",
    ...result.checks.map((check) => `- **${check.status.toUpperCase()}** ${check.name}: ${check.details}`)
  ].join("\n");
}

async function runOpencodeSidecarGuardStack(root: string, options: { base: string }): Promise<OpenCodeSidecarGuardStackSummary> {
  try {
    const context = await buildContextPackage(root);
    const contracts = validateContracts(context, { base: options.base, diff: true });
    const hallucination = buildHallucinationReport(context, { base: options.base });
    const regression = buildRegressionReport(context, { base: options.base, changedFiles: collectCurrentChangedFiles(root) });
    const impact = buildChangeImpactReport(context, { base: options.base });
    const tests = buildTestSelection(context, { diff: true, base: options.base });
    const policy = buildPolicyReport(context, { base: options.base, failOn: "required" });
    const taskVerifyMarkdown = renderTaskVerify(context, { base: options.base, diff: true });
    const policyMarkdown = renderPolicyReport(policy);
    writeGuardStackArtifacts(root, {
      policyMarkdown,
      taskVerifyMarkdown,
      hallucinationMarkdown: renderHallucinationReport(hallucination),
      regressionMarkdown: renderRegressionReport(regression)
    });
    return summarizeGuardStack({ base: options.base, contracts, hallucination, regression, impact, tests, policy });
  } catch (error) {
    return {
      ran: false,
      passed: false,
      base: options.base,
      artifacts: {},
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function toPersistedSidecarResult(result: OpenCodeSidecarVerifyResult): Omit<
  OpenCodeSidecarVerifyResult,
  "pluginPath" | "eventLogPath" | "latestJsonPath" | "latestMarkdownPath"
> & {
  pluginPath: string;
  eventLogPath: string;
  latestJsonPath: string;
  latestMarkdownPath: string;
} {
  return {
    ...result,
    pluginPath: path.relative(result.repo, result.pluginPath),
    eventLogPath: path.relative(result.repo, result.eventLogPath),
    latestJsonPath: path.relative(result.repo, result.latestJsonPath),
    latestMarkdownPath: path.relative(result.repo, result.latestMarkdownPath)
  };
}

function summarizeGuardStack(input: {
  base: string;
  contracts: ContractValidationReport;
  hallucination: HallucinationGuardReport;
  regression: RegressionGuardReport;
  impact: ChangeImpactReport;
  tests: TestSelectionReport;
  policy: PolicyEngineReport;
}): OpenCodeSidecarGuardStackSummary {
  return {
    ran: true,
    passed:
      input.contracts.passed && input.hallucination.summary.errors === 0 && input.regression.summary.missingRequiredTestEvidence === 0 && input.policy.passed,
    base: input.base,
    artifacts: {
      policyMarkdown: ".agent-context/sidecar/policy.md",
      taskVerifyMarkdown: ".agent-context/sidecar/task-verify.md"
    },
    contracts: {
      passed: input.contracts.passed,
      violations: input.contracts.violations.length
    },
    hallucination: {
      errors: input.hallucination.summary.errors,
      warnings: input.hallucination.summary.warnings
    },
    regression: {
      matches: input.regression.summary.matches,
      missingRequiredTestEvidence: input.regression.summary.missingRequiredTestEvidence
    },
    impact: {
      risk: input.impact.risk,
      changedFiles: input.impact.changedFiles.length,
      relatedTests: input.impact.relatedTests.length
    },
    tests: {
      minimalCommands: input.tests.minimalCommands.length,
      recommendedCommands: input.tests.recommendedCommands.length,
      fullConfidenceCommands: input.tests.fullConfidenceCommands.length
    },
    policy: {
      passed: input.policy.passed,
      forbidden: input.policy.summary.forbidden,
      requiredMissing: input.policy.summary.requiredMissing,
      risks: input.policy.summary.risks
    }
  };
}

function writeGuardStackArtifacts(
  root: string,
  artifacts: { policyMarkdown: string; taskVerifyMarkdown: string; hallucinationMarkdown: string; regressionMarkdown: string }
): void {
  const dir = path.join(root, ".agent-context", "sidecar");
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "policy.md"), `${artifacts.policyMarkdown}\n`, "utf8");
  writeFileSync(path.join(dir, "task-verify.md"), `${artifacts.taskVerifyMarkdown}\n`, "utf8");
  writeFileSync(path.join(dir, "hallucination.md"), `${artifacts.hallucinationMarkdown}\n`, "utf8");
  writeFileSync(path.join(dir, "regression.md"), `${artifacts.regressionMarkdown}\n`, "utf8");
}

function blockersFromGuardStack(summary: OpenCodeSidecarGuardStackSummary): string[] {
  const blockers: string[] = [];
  if (!summary.ran) return [`Guard stack failed to run: ${summary.error ?? "unknown error"}`];
  if (summary.contracts && !summary.contracts.passed) blockers.push(`Contract violations: ${summary.contracts.violations}`);
  if (summary.hallucination?.errors) blockers.push(`Hallucination errors: ${summary.hallucination.errors}`);
  if (summary.regression?.missingRequiredTestEvidence) blockers.push(`Missing regression test evidence: ${summary.regression.missingRequiredTestEvidence}`);
  if (summary.policy && !summary.policy.passed) {
    if (summary.policy.forbidden) blockers.push(`Policy forbidden failures: ${summary.policy.forbidden}`);
    if (summary.policy.requiredMissing) blockers.push(`Policy required evidence missing: ${summary.policy.requiredMissing}`);
  }
  return blockers;
}

function warningsFromGuardStack(summary: OpenCodeSidecarGuardStackSummary): string[] {
  const warnings: string[] = [];
  if (summary.hallucination?.warnings) warnings.push(`Hallucination warnings: ${summary.hallucination.warnings}`);
  if (summary.policy?.risks) warnings.push(`Policy risks: ${summary.policy.risks}`);
  if (summary.impact?.risk === "High") warnings.push("Impact risk is High");
  return warnings;
}

function formatGuardStackLines(summary: OpenCodeSidecarGuardStackSummary): string[] {
  if (!summary.ran) return [`- failed to run: ${summary.error ?? "unknown error"}`];
  return [
    `- passed: ${summary.passed ? "yes" : "no"}`,
    `- base: ${summary.base}`,
    `- contracts: ${summary.contracts?.passed ? "passed" : "failed"} (${summary.contracts?.violations ?? 0} violation(s))`,
    `- hallucination: ${summary.hallucination?.errors ?? 0} error(s), ${summary.hallucination?.warnings ?? 0} warning(s)`,
    `- regression: ${summary.regression?.matches ?? 0} match(es), ${summary.regression?.missingRequiredTestEvidence ?? 0} missing evidence`,
    `- impact: ${summary.impact?.risk ?? "unknown"} (${summary.impact?.changedFiles ?? 0} changed file(s), ${summary.impact?.relatedTests ?? 0} related test(s))`,
    `- tests: ${summary.tests?.minimalCommands ?? 0} minimal, ${summary.tests?.recommendedCommands ?? 0} recommended, ${summary.tests?.fullConfidenceCommands ?? 0} full-confidence command(s)`,
    `- policy: ${summary.policy?.passed ? "passed" : "failed"} (${summary.policy?.forbidden ?? 0} forbidden, ${summary.policy?.requiredMissing ?? 0} required missing, ${summary.policy?.risks ?? 0} risk(s))`
  ];
}

function checkGitRepo(repo: string): OpenCodeSidecarVerifyCheck {
  try {
    const inside = runGit(repo, ["rev-parse", "--is-inside-work-tree"]).trim() === "true";
    return inside ? { name: "git", status: "pass", details: "inside git repository" } : { name: "git", status: "fail", details: "not inside git repository" };
  } catch (error) {
    return { name: "git", status: "fail", details: error instanceof Error ? error.message : String(error) };
  }
}

function checkExists(name: string, absolutePath: string, okDetails: string): OpenCodeSidecarVerifyCheck {
  return existsSync(absolutePath) ? { name, status: "pass", details: okDetails } : { name, status: "fail", details: `${absolutePath} is missing` };
}

function checkSource(name: string, source: string, pattern: RegExp, okDetails: string): OpenCodeSidecarVerifyCheck {
  return pattern.test(source) ? { name, status: "pass", details: okDetails } : { name, status: "fail", details: `${name} missing from generated plugin` };
}

function collectCurrentChangedFiles(root: string): string[] {
  try {
    const changed = runGit(root, ["diff", "--name-only"]);
    const staged = runGit(root, ["diff", "--cached", "--name-only"]);
    const untracked = runGit(root, ["ls-files", "--others", "--exclude-standard"]);
    return [
      ...new Set([...parseGitPathList(changed), ...parseGitPathList(staged), ...parseGitPathList(untracked)].filter((file) => !isGeneratedSidecarOutput(file)))
    ].sort();
  } catch {
    return [];
  }
}

function parseGitPathList(output: string): string[] {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\\/g, "/"))
    .filter(Boolean);
}

function isGeneratedSidecarOutput(filePath: string): boolean {
  return filePath === ".agent-context/sidecar/latest.json" || filePath === ".agent-context/sidecar/latest.md";
}

function detectBlockers(files: string[]): string[] {
  const blockers: string[] = [];
  for (const file of files) {
    if (isSecretLike(file)) blockers.push(`Secret/local configuration path changed: ${file}`);
    if (isLockfile(file) && !hasPackageManifest(files)) blockers.push(`Lockfile changed without a package manifest change: ${file}`);
  }
  return [...new Set(blockers)];
}

function detectWarnings(files: string[]): string[] {
  const warnings: string[] = [];
  for (const file of files) {
    if (isCiOrDeploy(file)) warnings.push(`CI/deploy configuration changed: ${file}`);
    if (isMigration(file)) warnings.push(`Migration/schema file changed: ${file}`);
  }
  return [...new Set(warnings)];
}

function isSecretLike(file: string): boolean {
  return /(^|\/)(\.env|.*\.local\.(yml|yaml|json)|opencode-plusplus\.local\.yml)$/i.test(file);
}

function isLockfile(file: string): boolean {
  return /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb|poetry\.lock|Cargo\.lock|Gemfile\.lock)$/i.test(file);
}

function hasPackageManifest(files: string[]): boolean {
  return files.some((file) => /(^|\/)(package\.json|pyproject\.toml|Cargo\.toml|Gemfile|go\.mod)$/i.test(file));
}

function isCiOrDeploy(file: string): boolean {
  return file.startsWith(".github/workflows/") || /(^|\/)(Dockerfile|docker-compose\.ya?ml|fly\.toml|vercel\.json|netlify\.toml)$/i.test(file);
}

function isMigration(file: string): boolean {
  return /(^|\/)(migrations?|prisma|schema)\/|schema\.(sql|prisma)$/i.test(file);
}

function checkDangerousCommand(command: string): OpenCodeSidecarCommandFinding[] {
  const findings: OpenCodeSidecarCommandFinding[] = [];
  const patterns: Array<[RegExp, string]> = [
    [/\brm\s+(-[^\s]*[rf][^\s]*|-[^\s]*r[^\s]*f[^\s]*|-[^\s]*f[^\s]*r[^\s]*)\s+(\/|\*|\.|~|\$HOME|%USERPROFILE%)/i, "destructive recursive remove"],
    [/\bgit\s+reset\s+--hard\b/i, "hard git reset"],
    [/\bgit\s+clean\s+-[^\s]*[fd][^\s]*/i, "git clean removes untracked files"],
    [/\b(curl|wget)\b.+\|\s*(sh|bash|powershell|pwsh)\b/i, "remote script pipe to shell"],
    [/\bchmod\s+-R\s+777\b/i, "recursive world-writable permissions"],
    [/\bdel\s+\/[sfq]\s+(\\|\/|\*)/i, "destructive Windows delete"]
  ];
  for (const [pattern, reason] of patterns) {
    if (pattern.test(command)) {
      findings.push({
        kind: "dangerous_command",
        severity: "blocker",
        message: `Blocked dangerous command: ${reason}`,
        evidence: [command]
      });
    }
  }
  return findings;
}

function checkScriptCommand(root: string, command: string): OpenCodeSidecarCommandFinding[] {
  const parsed = parseCommandSafely(command);
  if (!parsed) {
    return [
      {
        kind: "dangerous_command",
        severity: "blocker",
        message: "Blocked command with unsupported shell control syntax. Use a plain executable plus arguments.",
        evidence: [command]
      }
    ];
  }

  const script = npmScriptName(parsed.file, parsed.args);
  if (!script) return [];
  const scripts = readPackageScripts(root);
  if (script in scripts) return [];
  return [
    {
      kind: "unknown_script",
      severity: "blocker",
      message: `Package script does not exist: ${script}`,
      evidence: [`package.json scripts: ${Object.keys(scripts).sort().join(", ") || "none"}`]
    }
  ];
}

function checkMakeCommand(root: string, command: string): OpenCodeSidecarCommandFinding[] {
  const parsed = parseCommandSafely(command);
  if (!parsed || !/^(make|gmake)$/i.test(parsed.file)) return [];
  const target = parsed.args.find((arg) => arg && !arg.startsWith("-")) ?? "all";
  const targets = readMakeTargets(root);
  if (!targets.length) {
    return [{ kind: "unknown_make_target", severity: "blocker", message: "Makefile not found for make command.", evidence: [command] }];
  }
  if (targets.includes(target)) return [];
  return [
    {
      kind: "unknown_make_target",
      severity: "blocker",
      message: `Make target does not exist: ${target}`,
      evidence: [`Makefile targets: ${targets.join(", ")}`]
    }
  ];
}

function checkPyprojectCommand(root: string, command: string): OpenCodeSidecarCommandFinding[] {
  const parsed = parseCommandSafely(command);
  if (!parsed) return [];
  const scripts = readPyprojectScripts(root);
  if (!scripts.length) return [];
  if (scripts.includes(parsed.file)) return [];
  return [];
}

function checkProtectedPath(filePath: string): OpenCodeSidecarCommandFinding[] {
  const normalized = normalizeToolPath(filePath);
  const findings: OpenCodeSidecarCommandFinding[] = [];
  if (!normalized) return findings;
  if (isSecretLike(normalized)) {
    findings.push({ kind: "secret_path", severity: "blocker", message: `Blocked secret/local config path: ${normalized}`, evidence: [normalized] });
  }
  if (normalized.startsWith(".agent-context/") && !isGeneratedSidecarOutput(normalized)) {
    findings.push({ kind: "protected_path", severity: "blocker", message: `Blocked generated context path: ${normalized}`, evidence: [normalized] });
  }
  if (normalized === "AGENTS.md") {
    findings.push({
      kind: "protected_path",
      severity: "blocker",
      message: "Blocked generated AGENTS.md path; edit AGENTS.manual.md or regenerate context instead.",
      evidence: [normalized]
    });
  }
  if (normalized.includes("node_modules/") || normalized.startsWith("dist/") || normalized.startsWith("coverage/")) {
    findings.push({ kind: "protected_path", severity: "blocker", message: `Blocked dependency/build output path: ${normalized}`, evidence: [normalized] });
  }
  return findings;
}

function parseCommandSafely(command: string): { file: string; args: string[] } | null {
  try {
    return parseCommandLine(command);
  } catch {
    return null;
  }
}

function npmScriptName(file: string, args: string[]): string | null {
  const normalized = path
    .basename(file)
    .replace(/\.(cmd|ps1|bat|exe)$/i, "")
    .toLowerCase();
  if (["npm", "pnpm", "bun"].includes(normalized)) {
    if (args[0] === "run" && args[1]) return args[1];
    if (["test", "start", "restart", "stop"].includes(args[0] ?? "")) return args[0] ?? null;
  }
  if (normalized === "yarn") {
    if (args[0] === "run" && args[1]) return args[1];
    if (args[0] && !args[0].startsWith("-")) return args[0];
  }
  return null;
}

function readPackageScripts(root: string): Record<string, string> {
  const packagePath = path.join(root, "package.json");
  if (!existsSync(packagePath)) return {};
  try {
    const parsed = JSON.parse(readFileSync(packagePath, "utf8")) as { scripts?: Record<string, unknown> };
    return Object.fromEntries(Object.entries(parsed.scripts ?? {}).filter(([, value]) => typeof value === "string")) as Record<string, string>;
  } catch {
    return {};
  }
}

function readMakeTargets(root: string): string[] {
  const makefile = ["Makefile", "makefile", "GNUmakefile"].map((name) => path.join(root, name)).find((file) => existsSync(file));
  if (!makefile) return [];
  const targets = new Set<string>();
  for (const line of readFileSync(makefile, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_.-]+)\s*:(?![=])/);
    if (match?.[1] && !match[1].startsWith(".")) targets.add(match[1]);
  }
  return [...targets].sort();
}

function readPyprojectScripts(root: string): string[] {
  const pyproject = path.join(root, "pyproject.toml");
  if (!existsSync(pyproject)) return [];
  const scripts = new Set<string>();
  let section = "";
  for (const line of readFileSync(pyproject, "utf8").split(/\r?\n/)) {
    const sectionMatch = line.match(/^\s*\[([^\]]+)\]\s*$/);
    if (sectionMatch) {
      section = sectionMatch[1] ?? "";
      continue;
    }
    if (!["project.scripts", "tool.poetry.scripts"].includes(section)) continue;
    const match = line.match(/^\s*([A-Za-z0-9_.-]+)\s*=/);
    if (match?.[1]) scripts.add(match[1]);
  }
  return [...scripts].sort();
}

function extractPathLikeArguments(command: string): string[] {
  const parsed = parseCommandSafely(command);
  if (!parsed) return [];
  return parsed.args.filter((arg) => /(^\.?\.?\/|\\|\.env|AGENTS\.md|\.agent-context|node_modules|dist\/|coverage\/)/i.test(arg)).map(normalizeToolPath);
}

function normalizeToolPath(value: string): string {
  return value
    .replace(/^["']|["']$/g, "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "");
}

function dedupeFindings(findings: OpenCodeSidecarCommandFinding[]): OpenCodeSidecarCommandFinding[] {
  const seen = new Set<string>();
  return findings.filter((finding) => {
    const key = `${finding.kind}:${finding.severity}:${finding.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeSessionId(value: string | undefined): string {
  const normalized = (value ?? "default")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return normalized || "default";
}

function inferToolAction(tool: string, command: string | null): string {
  const text = `${tool} ${command ?? ""}`.toLowerCase();
  if (/\b(test|vitest|jest|pytest|node --test)\b/.test(text)) return "run-test";
  if (/\b(lint|eslint|biome|prettier)\b/.test(text)) return "lint";
  if (/\b(typecheck|tsc|mypy|pyright)\b/.test(text)) return "typecheck";
  if (/\b(build|compile)\b/.test(text)) return "build";
  if (/\b(write|edit|patch|apply)\b/.test(text)) return "edit";
  return "tool-execute";
}

function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
