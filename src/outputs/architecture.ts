import type { ContextPackage } from "../core/types.js";
import { bullet, code, heading } from "./renderers/markdown.js";

export function renderArchitecture(context: ContextPackage): string {
  const topModules = [...context.index.modules].sort((a, b) => b.importanceScore - a.importanceScore).slice(0, 10);

  return [
    heading(1, "Architecture Notes"),
    "",
    "This document is generated from static repository signals. Treat it as a starting map, not a final design document.",
    "",
    heading(2, "High-Level Shape"),
    bullet([
      `Primary languages: ${context.scan.languages.join(", ") || "none detected"}`,
      `Detected frameworks: ${context.scan.frameworks.join(", ") || "none detected"}`,
      `Main entrypoints: ${context.scan.entrypoints.map(code).join(", ") || "none detected"}`,
      `Internal modules: ${context.index.modules.length}`
    ]),
    "",
    heading(2, "Important Modules"),
    bullet(
      topModules.map((module) => {
        const generated = context.summaries.moduleSummaries.find((summary) => summary.moduleName === module.name);
        return `${code(module.name)}: ${generated?.summary ?? module.summary}`;
      })
    ),
    "",
    heading(2, "Agent Guidance"),
    bullet([
      "Start with `AGENTS.md`, then read `key-files.md` for the highest-signal files.",
      "Use `dependency-graph.md` before editing shared modules or entrypoints.",
      "Prefer existing commands from `repo-summary.md` when running tests or checks.",
      "Generated summaries are evidence-based but shallow; inspect source before making broad changes."
    ])
  ].join("\n");
}
