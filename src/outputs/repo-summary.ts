import type { ContextPackage } from "../core/types.js";
import { bullet, code, heading } from "./markdown.js";

export function renderRepoSummary(context: ContextPackage): string {
  const { scan, index, keyFiles } = context;
  const totalTokens = scan.files.reduce((sum, file) => sum + file.tokenEstimate, 0);
  const contextTokens = keyFiles.slice(0, 25).reduce((sum, file) => sum + file.tokenEstimate, 0);
  const compression = contextTokens ? Math.max(1, Math.round(totalTokens / contextTokens)) : 1;

  return [
    heading(1, "Repository Summary"),
    "",
    `Generated for target: ${code(context.target)}.`,
    "",
    heading(2, "Detected Stack"),
    bullet([
      `Languages: ${scan.languages.length ? scan.languages.join(", ") : "none detected"}`,
      `Frameworks: ${scan.frameworks.length ? scan.frameworks.join(", ") : "none detected"}`,
      `Package managers: ${scan.packageManagers.length ? scan.packageManagers.join(", ") : "none detected"}`,
      `Files scanned: ${scan.files.length}`,
      `Symbols detected: ${index.symbols.length}`,
      `Dependency edges detected: ${context.graph.fileEdges.length}`
    ]),
    "",
    heading(2, "Token Compression Estimate"),
    bullet([
      `Repository estimate: ${totalTokens.toLocaleString()} tokens`,
      `Top context estimate: ${contextTokens.toLocaleString()} tokens`,
      `Approximate compression: ${compression}x`
    ]),
    "",
    heading(2, "Entrypoints"),
    bullet(scan.entrypoints.map(code)),
    "",
    heading(2, "Run Commands"),
    bullet(scan.runCommands.map(code)),
    "",
    heading(2, "Test Commands"),
    bullet(scan.testCommands.map(code))
  ].join("\n");
}
