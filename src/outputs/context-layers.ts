import type { ContextPackage } from "../core/types.js";
import { bullet, code, heading } from "./renderers/markdown.js";

export function renderContextLayers(context: ContextPackage): string {
  return [
    heading(1, "Context Layers"),
    "",
    "Generated context is intentionally layered. Start small, then open deeper files only when the task needs stronger evidence.",
    "",
    heading(2, "L0 Always Loaded"),
    bullet([
      `${code("AGENTS.md")} - shortest operating rules and default workflow`,
      context.config.agents.manualSources.length
        ? `${code(context.config.agents.manualSources[0])} - manual environment/deployment notes; load only for operations tasks`
        : "No manual operations file configured."
    ]),
    "",
    heading(2, "L1 Task Start"),
    bullet([
      `${code(".agent-context/repo-summary.md")} - repository overview, stack, entrypoints, and command summary`,
      `${code(".agent-context/onboarding.md")} - first-read workflow, task entrypoints, and validation guidance`
    ]),
    "",
    heading(2, "L2 Task Run"),
    bullet([
      `${code(".agent-context/runs/<task-id>/plan.md")} - task intent, suspected modules, and must-inspect files`,
      `${code(".agent-context/runs/<task-id>/pack.md")} - task-specific context package`,
      `${code(".agent-context/runs/<task-id>/edit-boundary.md")} - allowed and avoided edit surfaces`,
      `${code(".agent-context/runs/<task-id>/tests.md")} - minimal, regression, and full-confidence tests`,
      `${code(".agent-context/runs/<task-id>/verify.md")} - post-edit verification report scaffold`,
      `${code(".agent-context/runs/<task-id>/impact.md")} - dependent modules, related tests, and risk`,
      `${code(".agent-context/runs/<task-id>/run.json")} - machine-readable task run manifest`
    ]),
    "",
    heading(2, "L2 Standalone Task Pack"),
    bullet([
      `${code(".agent-context/tasks/<task>/task.md")} - concrete task intent, suspected modules, and validation commands`,
      `${code(".agent-context/tasks/<task>/relevant-files.md")} - task-specific files to inspect first`,
      `${code(".agent-context/tasks/<task>/dependency-neighbors.md")} - direct dependency context`,
      `${code(".agent-context/tasks/<task>/tests.md")} - tests related to the task`,
      `${code(".agent-context/tasks/<task>/risk.md")} - edit boundaries and regression watchpoints`
    ]),
    "",
    heading(2, "L3 Deep Evidence"),
    bullet(deepEvidence(context)),
    "",
    heading(2, "Loading Policy"),
    bullet([
      "Do not load the full `.agent-context/` directory by default.",
      "Prefer source files over generated summaries when implementation behavior matters.",
      "Use L3 files for targeted evidence, symbol lookup, graph tracing, or RAG retrieval after the task scope is known."
    ])
  ].join("\n");
}

function deepEvidence(context: ContextPackage): string[] {
  const items = [
    `${code(".agent-context/key-files.md")} - ranked evidence index; not a default prompt payload`,
    `${code(".agent-context/index/files.json")} - indexed file metadata`,
    `${code(".agent-context/index/symbols.json")} - symbol lookup`,
    `${code(".agent-context/index/modules.json")} - module index`,
    `${code(".agent-context/index/chunks.json")} - source chunks for targeted retrieval`,
    `${code(".agent-context/evidence/file-evidence.json")} - analyzer confidence and evidence`
  ];

  if (context.config.outputs.modules) {
    items.push(`${code(".agent-context/module-map.md")} - module ownership and responsibility map`);
    items.push(`${code(".agent-context/architecture.md")} - architecture notes with evidence`);
  }
  if (context.config.outputs.graph) {
    items.push(`${code(".agent-context/dependency-graph.md")} - dependency report`);
    items.push(`${code(".agent-context/graphs/")} - dependency graph data`);
  }
  if (context.config.outputs.readiness) {
    items.push(`${code(".agent-context/readiness.md")} - readiness gaps and supporting evidence`);
  }
  if (context.config.outputs.rag) {
    items.push(`${code(".agent-context/rag/")} - RAG-ready chunk export`);
  }

  return items;
}
