import type { ContextPackage } from "../core/types.js";
import { code, heading, table } from "./renderers/markdown.js";

export function renderModuleMap(context: ContextPackage): string {
  const rows = [...context.index.modules]
    .sort((a, b) => b.importanceScore - a.importanceScore || a.name.localeCompare(b.name))
    .map((module) => [
      module.name,
      String(module.files.length),
      String(module.importanceScore),
      module.imports.length ? module.imports.map(code).join(", ") : "none",
      module.summary
    ]);

  return [heading(1, "Module Map"), "", table(["Module", "Files", "Score", "Depends On", "Summary"], rows)].join("\n");
}
