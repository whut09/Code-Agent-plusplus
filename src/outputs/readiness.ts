import type { ContextPackage } from "../core/types.js";
import { bullet, heading, table } from "./renderers/markdown.js";

export function renderReadiness(context: ContextPackage): string {
  return [
    heading(1, "Agent Readiness"),
    "",
    `Agent Readiness: ${context.readiness.grade} / ${context.readiness.score}`,
    "",
    heading(2, "Dimensions"),
    table(
      ["Dimension", "Score", "Evidence", "Missing"],
      context.readiness.dimensions.map((dimension) => [
        dimension.category,
        `${dimension.score}/100`,
        dimension.evidence.join("; ").replace(/\|/g, "\\|") || "none",
        dimension.missing.join("; ").replace(/\|/g, "\\|") || "none"
      ])
    ),
    "",
    heading(2, "Hard Caps"),
    table(
      ["Cap", "Status", "Condition", "Evidence"],
      context.readiness.capsApplied.map((cap) => [
        `${cap.cap}`,
        cap.applied ? "applied" : "not applied",
        cap.reason.replace(/\|/g, "\\|"),
        cap.evidence.join("; ").replace(/\|/g, "\\|") || "none"
      ])
    ),
    "",
    heading(2, "Signal Categories"),
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
