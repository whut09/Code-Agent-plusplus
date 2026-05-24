import type { ContextPackage } from "../core/types.js";
import { bullet, code, heading } from "./markdown.js";

export function renderOnboarding(context: ContextPackage): string {
  return [
    heading(1, "Agent Onboarding"),
    "",
    heading(2, "First Reads"),
    bullet([
      code("AGENTS.md"),
      code(".agent-context/repo-summary.md"),
      code(".agent-context/key-files.md"),
      code(".agent-context/module-map.md"),
      code(".agent-context/dependency-graph.md")
    ]),
    "",
    heading(2, "Suggested Workflow"),
    bullet([
      "Identify the task area and match it to a module in `module-map.md`.",
      "Open the relevant key files and nearby tests.",
      "Check dependency direction before changing exported APIs.",
      "Run the detected test/check command after edits when available."
    ]),
    "",
    heading(2, "Detected Commands"),
    bullet([
      `Run: ${context.scan.runCommands.map(code).join(", ") || "none detected"}`,
      `Test: ${context.scan.testCommands.map(code).join(", ") || "none detected"}`
    ])
  ].join("\n");
}
