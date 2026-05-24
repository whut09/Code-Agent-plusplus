import type { ContextPackage } from "../core/types.js";
import { bullet, heading } from "./markdown.js";

export function renderReadiness(context: ContextPackage): string {
  return [
    heading(1, "Agent Readiness"),
    "",
    `Score: ${context.readiness.score}/100`,
    "",
    heading(2, "Strengths"),
    bullet(context.readiness.strengths),
    "",
    heading(2, "Missing Or Weak Signals"),
    bullet(context.readiness.missing)
  ].join("\n");
}
