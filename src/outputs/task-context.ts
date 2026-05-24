import type { ContextPackage, IndexedFile } from "../core/types.js";
import { bullet, code, heading, table } from "./markdown.js";

export function renderTaskContext(context: ContextPackage, task: string): string {
  const files = selectFilesForTask(context, task);
  return [
    heading(1, "Task Context"),
    "",
    `Task: ${task}`,
    "",
    heading(2, "Relevant Files"),
    table(
      ["File", "Score", "Why", "Summary"],
      files.map((file) => [
        code(file.path),
        String(file.importanceScore),
        file.importanceReasons.join(", ") || "keyword/module match",
        file.summary.replace(/\|/g, "\\|")
      ])
    ),
    "",
    heading(2, "Suggested Agent Workflow"),
    bullet([
      "Read `AGENTS.md` first.",
      "Open the relevant files above and nearby tests before editing.",
      "Check `dependency-graph.md` when changing shared modules or exports.",
      "Run detected test/check commands from `repo-summary.md` after edits."
    ])
  ].join("\n");
}

export function selectFilesForTask(context: ContextPackage, task: string): IndexedFile[] {
  const terms = task.toLowerCase().split(/[^a-z0-9_/-]+/).filter((term) => term.length >= 3);
  const scored = context.index.files.map((file) => {
    const haystack = [
      file.path,
      file.moduleName,
      file.summary,
      ...file.exports,
      ...file.symbols.map((symbol) => symbol.name)
    ].join(" ").toLowerCase();

    const matches = terms.filter((term) => haystack.includes(term)).length;
    return {
      file,
      score: file.importanceScore + matches * 20
    };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.file.path.localeCompare(b.file.path))
    .slice(0, 20)
    .map((item) => item.file);
}
