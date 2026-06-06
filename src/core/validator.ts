import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { ContextPackage } from "./types.js";

export interface ValidationIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
}

export interface ValidationReport {
  valid: boolean;
  issues: ValidationIssue[];
}

export function validateContextPackage(context: ContextPackage): ValidationReport {
  const issues: ValidationIssue[] = [];
  const paths = new Set(context.index.files.map((file) => file.path));

  if (context.tokenSavings.estimatedContextPackTokens.tokens > context.tokenSavings.tokenBudget) {
    issues.push({ severity: "error", code: "token_budget_exceeded", message: `Estimated context exceeds token budget: ${context.tokenSavings.estimatedContextPackTokens.tokens}/${context.tokenSavings.tokenBudget}.` });
  }
  if (context.tokenSavings.actualOutputTokens && context.tokenSavings.actualOutputTokens.total > context.tokenSavings.tokenBudget) {
    issues.push({
      severity: "error",
      code: "actual_output_budget_exceeded",
      message: `Actual generated output exceeds token budget: ${context.tokenSavings.actualOutputTokens.total}/${context.tokenSavings.tokenBudget}.`
    });
  }
  for (const edge of context.graph.fileEdges.filter((edge) => !edge.isExternal)) {
    if (!paths.has(edge.from) || !paths.has(edge.to)) {
      issues.push({ severity: "error", code: "invalid_graph_edge", message: `Internal graph edge references a missing file: ${edge.from} -> ${edge.to}.` });
    }
  }
  const lowConfidence = context.index.files.filter((file) => file.confidence === "low");
  if (context.index.files.length && lowConfidence.length / context.index.files.length > 0.5) {
    issues.push({ severity: "warning", code: "low_analysis_confidence", message: `${lowConfidence.length}/${context.index.files.length} files have low-confidence analysis.` });
  }
  validateGeneratedJson(context, issues);

  return {
    valid: !issues.some((issue) => issue.severity === "error"),
    issues
  };
}

function validateGeneratedJson(context: ContextPackage, issues: ValidationIssue[]): void {
  const contextDir = path.join(context.scan.root, ".agent-context");
  if (!existsSync(contextDir)) {
    issues.push({ severity: "warning", code: "context_not_generated", message: "No .agent-context directory exists yet. Run repo-context build." });
    return;
  }
  for (const relativePath of ["repo-summary.md", "key-files.md", "onboarding.md", "token-savings.md", "index/files.json", "index/symbols.json", "index/modules.json", "index/chunks.json"]) {
    if (!existsSync(path.join(contextDir, relativePath))) {
      issues.push({ severity: "error", code: "missing_generated_file", message: `Required generated file is missing: .agent-context/${relativePath}.` });
    }
  }
  for (const relativePath of [
    "index/files.json",
    "index/symbols.json",
    "index/modules.json",
    "index/chunks.json",
    "token-savings.json",
    "readiness.json"
  ]) {
    const filePath = path.join(contextDir, relativePath);
    if (!existsSync(filePath)) continue;
    try {
      const parsed = JSON.parse(readFileSync(filePath, "utf8")) as {
        actualOutputTokens?: { total?: number; totalTokens?: number };
      };
      const actualTotal = parsed.actualOutputTokens?.total ?? parsed.actualOutputTokens?.totalTokens;
      if (
        relativePath === "token-savings.json"
        && typeof actualTotal === "number"
        && actualTotal > context.tokenSavings.tokenBudget
        && !issues.some((issue) => issue.code === "actual_output_budget_exceeded")
      ) {
        issues.push({
          severity: "error",
          code: "actual_output_budget_exceeded",
          message: `Actual generated output exceeds token budget: ${actualTotal}/${context.tokenSavings.tokenBudget}.`
        });
      }
    } catch {
      issues.push({ severity: "error", code: "invalid_generated_json", message: `Generated JSON is invalid: .agent-context/${relativePath}.` });
    }
  }
}
