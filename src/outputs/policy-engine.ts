import type { ContextPackage, IndexedFile } from "../core/types.js";
import { changedFilesSince, runGit } from "../core/git.js";
import { assessDrift, assessFreshness } from "../core/freshness.js";
import { buildChangeImpactReport } from "./impact.js";
import { validateContracts } from "./contract-validator.js";
import { buildTestSelection } from "./test-selector.js";
import { readExecutionTrace, type ExecutionTrace, type ExecutionTraceStep } from "./execution-trace.js";
import { bullet, code, heading, table } from "./markdown.js";

export type PolicyKind = "forbidden" | "risk" | "required";
export type PolicyStatus = "failed" | "warning" | "missing" | "satisfied";
export type PolicySeverity = "error" | "warning" | "required" | "info";
export type PolicyFailOn = "forbidden" | "required" | "risk";

export interface PolicyEngineOptions {
  base?: string;
  traceId?: string;
  strict?: boolean;
  failOn?: PolicyFailOn;
}

export interface PolicyFinding {
  id: string;
  kind: PolicyKind;
  status: PolicyStatus;
  severity: PolicySeverity;
  message: string;
  file?: string;
  evidence: string[];
  requiredAction?: string;
}

export interface PolicyEngineReport {
  passed: boolean;
  base: string;
  traceId?: string;
  traceLoaded: boolean;
  failOn: PolicyFailOn;
  changedFiles: string[];
  generatedContextFiles: string[];
  summary: {
    forbidden: number;
    risks: number;
    requiredMissing: number;
    requiredSatisfied: number;
  };
  findings: PolicyFinding[];
}

type PolicyEvidenceLevel = "none" | "manual" | "command" | "ci";

interface TraceEvidenceResult {
  satisfied: boolean;
  level: PolicyEvidenceLevel;
  stepId?: string;
  evidence: string[];
}

export function buildPolicyReport(context: ContextPackage, options: PolicyEngineOptions = {}): PolicyEngineReport {
  const base = options.base ?? "main";
  const failOn = normalizeFailOn(options);
  const trace = options.traceId ? readExecutionTrace(context.scan.root, options.traceId) : null;
  const changed = changedFilesForPolicy(context, base);
  const indexed = new Map(context.index.files.map((file) => [file.path, file]));
  const changedIndexed = changed.actionable.map((file) => indexed.get(file)).filter((file): file is IndexedFile => Boolean(file));
  const sourceOrConfigChanged = changedIndexed.some((file) => isPolicyRelevantFile(file));
  const contracts = validateContracts(context, { base, diff: true });
  const freshness = assessFreshness(context);
  const drift = assessDrift(context);
  const impact = buildChangeImpactReport(context, { base });
  const tests = buildTestSelection(context, { diff: true, base });
  const testEvidence = traceTestEvidence(trace);
  const contractEvidence = traceContractEvidence(trace);
  const findings: PolicyFinding[] = [];

  for (const file of changedIndexed.filter((item) => item.isGenerated || item.kind === "generated")) {
    if (isGeneratedContextState(file.path)) continue;
    findings.push({
      id: "policy.forbidden.generated-source",
      kind: "forbidden",
      status: "failed",
      severity: "error",
      file: file.path,
      message: "Generated source output changed directly.",
      evidence: [`${file.path} is classified as generated output.`],
      requiredAction: "Regenerate it from its source inputs or exclude build artifacts from the diff."
    });
  }

  for (const file of changed.actionable.filter(isBuildOutputPath)) {
    findings.push({
      id: "policy.forbidden.build-output",
      kind: "forbidden",
      status: "failed",
      severity: "error",
      file,
      message: "Build output changed directly.",
      evidence: [`${file} matches a generated build output path.`],
      requiredAction: "Do not commit generated build output; regenerate locally when needed."
    });
  }

  for (const violation of contracts.violations.filter((item) => !isGeneratedContextState(item.file))) {
    findings.push({
      id: `policy.${violation.severity === "error" ? "forbidden" : "risk"}.contract`,
      kind: violation.severity === "error" ? "forbidden" : "risk",
      status: violation.severity === "error" ? "failed" : "warning",
      severity: violation.severity,
      file: violation.file,
      message: violation.message,
      evidence: [violation.reason, `Rule: ${violation.rule}`],
      requiredAction: violation.severity === "error" ? `Run repo-context validate-contracts . --base ${base} and repair the violating edit.` : undefined
    });
  }

  for (const file of changed.actionable.filter(isSensitivePath)) {
    findings.push({
      id: "policy.risk.sensitive-area",
      kind: "risk",
      status: "warning",
      severity: "warning",
      file,
      message: "Sensitive area changed.",
      evidence: [`${file} matches auth, payment, billing, checkout, invoice, security, or session risk terms.`],
      requiredAction: "Inspect callers, related tests, and runtime configuration before closing the loop."
    });
  }

  if (changed.actionable.length >= 10) {
    findings.push({
      id: "policy.risk.large-diff",
      kind: "risk",
      status: "warning",
      severity: "warning",
      message: "Large diff detected.",
      evidence: [`${changed.actionable.length} non-generated-context files changed.`],
      requiredAction: "Split the task or run broader verification before review."
    });
  }

  if (impact.risk === "High") {
    findings.push({
      id: "policy.risk.high-impact",
      kind: "risk",
      status: "warning",
      severity: "warning",
      message: "High impact change detected.",
      evidence: impact.riskFactors,
      requiredAction: `Run repo-context impact . --base ${base} and include dependents in the next agent context.`
    });
  }

  if (sourceOrConfigChanged) {
    findings.push(
      requiredFinding("policy.required.tests", testEvidence.satisfied, {
        message: "Changed source or config requires passed test evidence.",
        evidence: [
          `${changedIndexed.filter((file) => isPolicyRelevantFile(file)).length} source/config file(s) changed.`,
          trace ? `Trace loaded: ${trace.id}.` : "No execution trace was provided.",
          ...testEvidence.evidence,
          ...tests.fullConfidenceCommands.slice(0, 3).map((command) => `Suggested: ${command}`)
        ],
        requiredAction: firstRunnableCommand(tests.fullConfidenceCommands) ?? `repo-context tests . --diff --base ${base}`
      })
    );

    findings.push(
      requiredFinding("policy.required.contract-validation", contractEvidence.satisfied, {
        message: "Changed source or config requires contract validation evidence.",
        evidence: [trace ? `Trace loaded: ${trace.id}.` : "No execution trace was provided.", ...contractEvidence.evidence],
        requiredAction: `repo-context validate-contracts . --base ${base}`
      })
    );

    if (testEvidence.level === "manual") {
      findings.push({
        id: "policy.risk.manual-test-evidence",
        kind: "risk",
        status: "warning",
        severity: "warning",
        message: "Test evidence is manually reported instead of harness-captured.",
        evidence: [
          "Manual evidence can document agent intent, but command evidence includes exit code, output hashes, and working-tree hashes.",
          `Preferred: repo-context trace run ${trace?.id ?? "<trace-id>"} . --action run-test --command "<test-command>"`
        ],
        requiredAction: `Record command evidence with repo-context trace run ${trace?.id ?? "<trace-id>"} . --action run-test --command "<test-command>".`
      });
    }
  }

  if (freshness.status !== "fresh" || drift.status !== "clean") {
    findings.push({
      id: "policy.required.context-refresh",
      kind: "required",
      status: "missing",
      severity: "required",
      message: "Generated context is stale or drifted.",
      evidence: [...freshness.reasons, ...drift.reasons].slice(0, 8),
      requiredAction: "repo-context update ."
    });
  } else {
    findings.push({
      id: "policy.required.context-refresh",
      kind: "required",
      status: "satisfied",
      severity: "info",
      message: "Generated context is fresh.",
      evidence: ["Freshness is fresh and drift is clean."]
    });
  }

  if (requiresContractRegeneration(changed.actionable) && !changed.generatedContextFiles.some((file) => file.startsWith(".agent-context/contracts/"))) {
    findings.push({
      id: "policy.required.contract-regeneration",
      kind: "required",
      status: "missing",
      severity: "required",
      message: "Policy or contract generator changed without regenerated contract artifacts.",
      evidence: changed.actionable.filter(isContractGeneratorPath),
      requiredAction: "repo-context update ."
    });
  }

  const summary = {
    forbidden: findings.filter((finding) => finding.kind === "forbidden" && finding.status === "failed").length,
    risks: findings.filter((finding) => finding.kind === "risk").length,
    requiredMissing: findings.filter((finding) => finding.kind === "required" && finding.status === "missing").length,
    requiredSatisfied: findings.filter((finding) => finding.kind === "required" && finding.status === "satisfied").length
  };

  return {
    passed: policyPassed(summary, failOn),
    base,
    traceId: options.traceId,
    traceLoaded: Boolean(trace),
    failOn,
    changedFiles: changed.actionable,
    generatedContextFiles: changed.generatedContextFiles,
    summary,
    findings
  };
}

export function renderPolicyReport(report: PolicyEngineReport): string {
  return [
    heading(1, "Policy Engine"),
    "",
    `Policy check: ${report.passed ? "passed" : "failed"}`,
    `Base: ${report.base}`,
    `Fail on: ${report.failOn}`,
    report.traceId ? `Trace: ${report.traceId} (${report.traceLoaded ? "loaded" : "missing"})` : "Trace: none",
    "",
    heading(2, "Summary"),
    table(
      ["Signal", "Count"],
      [
        ["Forbidden failures", String(report.summary.forbidden)],
        ["Risks", String(report.summary.risks)],
        ["Missing required actions", String(report.summary.requiredMissing)],
        ["Satisfied required actions", String(report.summary.requiredSatisfied)]
      ]
    ),
    "",
    heading(2, "Changed Files"),
    bullet(report.changedFiles.map(code)),
    "",
    heading(2, "Generated Context Changes"),
    bullet(report.generatedContextFiles.map(code)),
    "",
    heading(2, "Findings"),
    bullet(report.findings.map(formatPolicyFinding))
  ].join("\n");
}

function requiredFinding(
  id: string,
  satisfied: boolean,
  input: {
    message: string;
    evidence: string[];
    requiredAction: string;
  }
): PolicyFinding {
  return {
    id,
    kind: "required",
    status: satisfied ? "satisfied" : "missing",
    severity: satisfied ? "info" : "required",
    message: input.message,
    evidence: input.evidence,
    requiredAction: satisfied ? undefined : input.requiredAction
  };
}

function normalizeFailOn(options: PolicyEngineOptions): PolicyFailOn {
  if (options.failOn) return options.failOn;
  return options.strict ? "risk" : "required";
}

function policyPassed(summary: PolicyEngineReport["summary"], failOn: PolicyFailOn): boolean {
  if (summary.forbidden > 0) return false;
  if ((failOn === "required" || failOn === "risk") && summary.requiredMissing > 0) return false;
  if (failOn === "risk" && summary.risks > 0) return false;
  return true;
}

function changedFilesForPolicy(context: ContextPackage, base: string): { actionable: string[]; generatedContextFiles: string[] } {
  const files = new Set<string>();
  for (const file of changedFilesSince(context.scan.root, base)) files.add(file);

  try {
    for (const line of runGit(context.scan.root, ["status", "--porcelain", "--untracked-files=all"]).split(/\r?\n/)) {
      if (line.length <= 3) continue;
      const file = line.slice(3).trim().replace(/\\/g, "/").split(" -> ").pop();
      if (file) files.add(file);
    }
  } catch {
    // Diff-only policy is still useful in non-git or partially configured repos.
  }

  const generatedContextFiles = [...files].filter(isGeneratedContextState).sort();
  const actionable = [...files]
    .filter((file) => !isGeneratedContextState(file))
    .filter((file) => !file.startsWith(".agent-context/cache/"))
    .sort();
  return { actionable, generatedContextFiles };
}

function traceTestEvidence(trace: ExecutionTrace | null): TraceEvidenceResult {
  return traceEvidence(trace, (step) => {
    const text = `${step.action} ${step.command ?? ""} ${step.test ?? ""}`.toLowerCase();
    return /\b(run-test|test|verify|check|lint|typecheck)\b/.test(text) || /\b(npm|pnpm|yarn|bun|pytest|vitest|jest|node --test)\b/.test(text);
  });
}

function traceContractEvidence(trace: ExecutionTrace | null): TraceEvidenceResult {
  return traceEvidence(trace, (step) => {
    const commandText = `${step.action} ${step.command ?? ""}`.toLowerCase();
    const reasonText = (step.reason ?? "").toLowerCase();
    return commandText.includes("validate-contracts") || commandText.includes("contract validation") || reasonText.includes("contract validation");
  });
}

function traceEvidence(trace: ExecutionTrace | null, matches: (step: ExecutionTraceStep) => boolean): TraceEvidenceResult {
  if (!trace) {
    return {
      satisfied: false,
      level: "none",
      evidence: ["Evidence level: none."]
    };
  }

  const passedMatches = trace.steps
    .filter((step) => matches(step) && stepPassed(step))
    .map((step) => ({ step, level: evidenceLevelForStep(step) }))
    .sort((a, b) => evidenceRank(b.level) - evidenceRank(a.level));

  const match = passedMatches[0];
  if (!match) {
    return {
      satisfied: false,
      level: "none",
      evidence: ["Evidence level: none.", "No matching passed trace step found."]
    };
  }

  return {
    satisfied: true,
    level: match.level,
    stepId: match.step.id,
    evidence: formatTraceEvidence(match.step, match.level)
  };
}

function stepPassed(step: ExecutionTraceStep): boolean {
  if (step.result === "passed") return true;
  return (step.evidenceSource === "command" || step.evidenceSource === "ci") && step.exitCode === 0;
}

function evidenceLevelForStep(step: ExecutionTraceStep): PolicyEvidenceLevel {
  if (step.evidenceSource === "ci") return "ci";
  if (isHarnessCommandEvidence(step)) return "command";
  return "manual";
}

function isHarnessCommandEvidence(step: ExecutionTraceStep): boolean {
  return (
    step.evidenceSource === "command" &&
    step.capturedBy === "repo-context" &&
    step.exitCode === 0 &&
    Boolean(step.command && step.startedAt && step.finishedAt && step.stdoutHash && step.stderrHash && step.workingTreeHashBefore && step.workingTreeHashAfter)
  );
}

function evidenceRank(level: PolicyEvidenceLevel): number {
  if (level === "ci") return 3;
  if (level === "command") return 2;
  if (level === "manual") return 1;
  return 0;
}

function formatTraceEvidence(step: ExecutionTraceStep, level: PolicyEvidenceLevel): string[] {
  const evidence = [`Evidence level: ${level}.`, `Trace step: ${step.id}.`, `Action: ${step.action}.`];
  if (step.command) evidence.push(`Command: ${step.command}.`);
  if (typeof step.exitCode === "number") evidence.push(`Exit code: ${step.exitCode}.`);
  if (step.stdoutHash) evidence.push(`Stdout hash: ${step.stdoutHash}.`);
  if (step.stderrHash) evidence.push(`Stderr hash: ${step.stderrHash}.`);
  if (step.workingTreeHashBefore && step.workingTreeHashAfter) {
    evidence.push(`Working tree hash: ${step.workingTreeHashBefore} -> ${step.workingTreeHashAfter}.`);
  }
  return evidence;
}

function isPolicyRelevantFile(file: IndexedFile): boolean {
  return !file.isTest && (file.kind === "source" || file.kind === "config" || file.kind === "lockfile");
}

function isGeneratedContextState(file: string): boolean {
  return file.startsWith(".agent-context/") || file === "AGENTS.md";
}

function isBuildOutputPath(file: string): boolean {
  return /(^|\/)(dist|build|coverage|\.next|out)\//.test(file);
}

function isSensitivePath(file: string): boolean {
  return /(^|\/)(auth|session|security|payment|payments|billing|checkout|invoice|invoices)(\/|\.|-|_)/i.test(file);
}

function isContractGeneratorPath(file: string): boolean {
  return /(^|\/)(contracts|contract-validator|policy-engine|loop-controller)\.ts$/.test(file) || file.startsWith("src/outputs/contracts/");
}

function requiresContractRegeneration(files: string[]): boolean {
  return files.some(isContractGeneratorPath);
}

function firstRunnableCommand(commands: string[]): string | undefined {
  return commands.find((command) => !/^No .*detected/i.test(command));
}

function formatPolicyFinding(finding: PolicyFinding): string {
  const file = finding.file ? ` ${code(finding.file)}` : "";
  const action = finding.requiredAction ? ` Required: ${code(finding.requiredAction)}.` : "";
  const evidence = finding.evidence.length ? ` Evidence: ${finding.evidence.join("; ")}` : "";
  return `${finding.status.toUpperCase()} ${finding.id}${file} - ${finding.message}.${action}${evidence}`;
}
