import type { ContextPackage } from "../core/types.js";
import { bullet, code, heading } from "./markdown.js";

export function renderOnboarding(context: ContextPackage): string {
  const firstReads = [
    code(".agent-context/repo-summary.md"),
    code(".agent-context/key-files.md")
  ];
  if (context.config.outputs.agents) {
    firstReads.unshift(code("AGENTS.md"));
  }
  if (context.config.outputs.modules) {
    firstReads.push(code(".agent-context/module-map.md"));
  }
  if (context.config.outputs.graph) {
    firstReads.push(code(".agent-context/dependency-graph.md"));
  }

  return [
    heading(1, "Agent Onboarding"),
    "",
    heading(2, "First Reads"),
    bullet(firstReads),
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
