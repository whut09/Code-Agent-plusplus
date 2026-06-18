import type { HallucinationGuardReport } from "../harness/verification-plane/guards/hallucination.js";
import type { PolicyEngineReport } from "../harness/verification-plane/policy-engine.js";
import type { RegressionGuardReport } from "../harness/verification-plane/guards/regression.js";

export type GuardFindingSource = "policy" | "hallucination" | "regression";
export type GuardFindingKind = "forbidden" | "required" | "risk" | "info";
export type GuardFindingStatus = "failed" | "missing" | "warning" | "satisfied" | "passed";
export type GuardFindingSeverity = "error" | "warning" | "required" | "info";

export interface GuardFinding {
  schemaVersion: "code-agent-plusplus.guard-finding.v1";
  id: string;
  source: GuardFindingSource;
  kind: GuardFindingKind;
  status: GuardFindingStatus;
  severity: GuardFindingSeverity;
  message: string;
  file?: string;
  evidence: string[];
  requiredAction?: string;
}

export interface GuardFindingsArtifact {
  schemaVersion: "code-agent-plusplus.guard-findings.v1";
  kind: "guard-findings";
  generatedAt: string;
  runId: string;
  iteration: number;
  findings: GuardFinding[];
  summary: {
    total: number;
    forbidden: number;
    requiredMissing: number;
    risks: number;
    hallucinationErrors: number;
    regressionMatches: number;
  };
}

export function buildGuardFindingsArtifact(input: {
  runId: string;
  iteration: number;
  generatedAt?: string;
  policy: PolicyEngineReport;
  hallucination: HallucinationGuardReport;
  regression: RegressionGuardReport;
}): GuardFindingsArtifact {
  const findings = [
    ...input.policy.findings.map(
      (finding): GuardFinding => ({
        schemaVersion: "code-agent-plusplus.guard-finding.v1",
        id: finding.id,
        source: "policy",
        kind: finding.kind === "forbidden" ? "forbidden" : finding.kind === "required" ? "required" : "risk",
        status: finding.status,
        severity: finding.severity,
        message: finding.message,
        file: finding.file,
        evidence: finding.evidence,
        requiredAction: finding.requiredAction
      })
    ),
    ...input.hallucination.findings.map(
      (finding, index): GuardFinding => ({
        schemaVersion: "code-agent-plusplus.guard-finding.v1",
        id: `hallucination.${finding.kind}.${index + 1}`,
        source: "hallucination",
        kind: finding.severity === "error" ? "forbidden" : "risk",
        status: finding.severity === "error" ? "failed" : "warning",
        severity: finding.severity,
        message: `${finding.kind}: ${finding.claim}`,
        evidence: finding.evidenceChecked,
        requiredAction: finding.repairSuggestion
      })
    ),
    ...input.regression.matches.map(
      (match): GuardFinding => ({
        schemaVersion: "code-agent-plusplus.guard-finding.v1",
        id: `regression.${match.id}`,
        source: "regression",
        kind: match.severity === "error" ? "required" : "risk",
        status: input.regression.summary.missingRequiredTestEvidence > 0 ? "missing" : "warning",
        severity: match.severity === "error" ? "required" : "warning",
        message: match.pattern,
        evidence: match.matchedBy,
        requiredAction: match.requiredTests[0]
      })
    )
  ];

  return {
    schemaVersion: "code-agent-plusplus.guard-findings.v1",
    kind: "guard-findings",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    runId: input.runId,
    iteration: input.iteration,
    findings,
    summary: {
      total: findings.length,
      forbidden: findings.filter((finding) => finding.kind === "forbidden" && finding.status === "failed").length,
      requiredMissing: findings.filter((finding) => finding.kind === "required" && finding.status === "missing").length,
      risks: findings.filter((finding) => finding.kind === "risk").length,
      hallucinationErrors: input.hallucination.summary.errors,
      regressionMatches: input.regression.summary.matches
    }
  };
}
