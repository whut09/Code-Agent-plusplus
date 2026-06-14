import type { ContextPackage } from "../core/types.js";
import { bullet, code, heading } from "./markdown.js";
import { formatTokenSavings } from "../core/token-savings.js";

export function renderRepoSummary(context: ContextPackage): string {
  const { scan, index, keyFiles } = context;
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
    formatTokenSavings(context.tokenSavings),
    "",
    heading(2, "Repository Summary"),
    context.summaries.repoSummary,
    "",
    heading(2, "Summary Mode"),
    bullet([
      `Mode: ${context.summaries.mode}`,
      `LLM attempted: ${context.summaries.llmAttempted ? "yes" : "no"}`,
      `Fallback reason: ${context.summaries.fallbackReason ?? "none"}`,
      "LLM summaries use local private configuration when `code-agent-plusplus.local.yml` is present."
    ]),
    "",
    heading(2, "Agent Readiness"),
    bullet([
      `Score: ${context.readiness.grade} / ${context.readiness.score}`,
      `Dimensions: ${context.readiness.dimensions.map((dimension) => `${dimension.category} ${dimension.score}/100`).join("; ")}`,
      `Caps applied: ${context.readiness.capsApplied.filter((cap) => cap.applied).length}`,
      `Missing signals: ${context.readiness.missing.length}`
    ]),
    "",
    heading(2, "Entrypoints"),
    bullet(scan.entrypoints.map(code)),
    "",
    heading(2, "Python CLI Entrypoints"),
    bullet(scan.entrypoints.filter((entrypoint) => entrypoint.startsWith("pyproject.toml:")).map(code)),
    "",
    heading(2, "Top Modules"),
    bullet(context.summaries.moduleSummaries.slice(0, 6).map((module) => `${code(module.moduleName)} - ${module.summary}`)),
    "",
    heading(2, "Key Entry Files"),
    bullet(keyFiles.slice(0, 8).map((file) => `${code(file.path)} - ${file.importanceReasons.slice(0, 2).join(", ") || file.kind}`)),
    "",
    heading(2, "Run Commands"),
    bullet(scan.runCommands.map(code)),
    "",
    heading(2, "Test Commands"),
    bullet(scan.testCommands.map(code))
  ].join("\n");
}
