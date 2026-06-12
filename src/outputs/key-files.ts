import type { ContextPackage } from "../core/types.js";
import { code, heading, table } from "./markdown.js";

export function renderKeyFiles(context: ContextPackage): string {
  const rows = context.keyFiles
    .slice(0, 40)
    .map((file) => [
      code(file.path),
      String(file.importanceScore),
      file.kind,
      `${file.confidence} (${file.analysisStats.parser})`,
      `${file.analysisStats.importsResolved}/${file.imports.length}`,
      file.importanceReasons.join(", ") || "ranked signal",
      file.summary.replace(/\|/g, "\\|")
    ]);

  return [
    heading(1, "Key Files"),
    "",
    "L3 evidence index. Do not load this file by default; use it only after L1/L2 context identifies the task area.",
    "",
    table(["File", "Score", "Kind", "Analysis", "Resolved Imports", "Why", "Summary"], rows)
  ].join("\n");
}
