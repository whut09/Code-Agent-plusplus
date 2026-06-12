import type { ContextPackage } from "../core/types.js";
import { fenced, heading, table } from "./markdown.js";

export function renderDependencyGraph(context: ContextPackage): string {
  const mermaid = renderMermaidGraph(context);
  const rows = context.graph.moduleEdges.map((edge) => [edge.from, edge.to, String(edge.count)]);

  return [
    heading(1, "Dependency Graph"),
    "",
    heading(2, "Module Graph"),
    fenced("mermaid", mermaid),
    "",
    heading(2, "Module Edges"),
    rows.length ? table(["From", "To", "Count"], rows) : "No internal module edges detected."
  ].join("\n");
}

export function renderMermaidGraph(context: ContextPackage): string {
  const lines = ["graph TD"];
  if (!context.graph.moduleEdges.length) {
    for (const module of context.index.modules.slice(0, 20)) {
      lines.push(`  ${nodeId(module.name)}["${escapeLabel(module.name)}"]`);
    }
    return lines.join("\n");
  }

  for (const edge of context.graph.moduleEdges) {
    lines.push(`  ${nodeId(edge.from)}["${escapeLabel(edge.from)}"] --> ${nodeId(edge.to)}["${escapeLabel(edge.to)}"]`);
  }

  return lines.join("\n");
}

function nodeId(value: string): string {
  return value.replace(/[^A-Za-z0-9_]/g, "_") || "root";
}

function escapeLabel(value: string): string {
  return value.replace(/"/g, '\\"');
}
