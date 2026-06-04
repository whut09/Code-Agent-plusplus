import type { ContextPackage } from "../core/types.js";
import { bullet, heading, table } from "./markdown.js";

export function renderReadiness(context: ContextPackage): string {
  return [
    heading(1, "Agent Readiness"),
    "",
    `Agent Readiness: ${context.readiness.score}/100`,
    "",
    heading(2, "Dimensions"),
    table(
      ["Category", "Score", "Evidence", "Missing"],
      context.readiness.categories.map((category) => [
        category.category,
        `${category.score}/100`,
        category.evidence.join("; ").replace(/\|/g, "\\|") || "none",
        category.missing.join("; ").replace(/\|/g, "\\|") || "none"
      ])
    ),
    "",
    heading(2, "Missing Or Weak Signals"),
    bullet(context.readiness.missing),
    "",
    heading(2, "Strengths"),
    bullet(context.readiness.strengths)
  ].join("\n");
}
