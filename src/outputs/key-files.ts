import type { ContextPackage } from "../core/types.js";
import { code, heading, table } from "./markdown.js";

export function renderKeyFiles(context: ContextPackage): string {
  const rows = context.keyFiles.slice(0, 40).map((file) => [
    code(file.path),
    String(file.importanceScore),
    file.kind,
    file.importanceReasons.join(", ") || "ranked signal",
    file.summary.replace(/\|/g, "\\|")
  ]);

  return [
    heading(1, "Key Files"),
    "",
    "These files are ranked as the most useful starting context for an agent.",
    "",
    table(["File", "Score", "Kind", "Why", "Summary"], rows)
  ].join("\n");
}
