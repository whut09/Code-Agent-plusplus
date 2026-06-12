import type { ContextPackage } from "../core/types.js";
import { bullet, code, heading } from "./markdown.js";

export function renderOnboarding(context: ContextPackage): string {
  const firstReads = [code(".agent-context/repo-summary.md")];
  if (context.config.outputs.agents) {
    firstReads.unshift(code("AGENTS.md"));
  }
  firstReads.push(code(".agent-context/context-layers.md"));

  return [
    heading(1, "Agent Onboarding"),
    "",
    "L1 startup context. Use this after `AGENTS.md` when a new task begins; keep L3 evidence files closed until the task boundary is clear.",
    "",
    heading(2, "First Reads"),
    bullet(firstReads),
    "",
    heading(2, "Suggested Workflow"),
    bullet([
      "Start from `AGENTS.md`, then read this file and `repo-summary.md` for the repository shape.",
      'For a concrete task, run `repo-context plan "<task>" .` or inspect `.agent-context/tasks/<task>/task.md` when a task pack exists.',
      "Open `key-files.md`, `index/`, `evidence/`, `graphs/`, or `rag/` only for targeted deep analysis.",
      "Prefer relevant source files and nearby tests over generated summaries before editing.",
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
