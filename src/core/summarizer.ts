import type { RepoContextConfig, RepoIndex, RepoScan, SummaryBundle } from "./types.js";
import { createLlmClient } from "../llm/provider.js";

export async function summarizeRepository(
  scan: RepoScan,
  index: RepoIndex,
  config: RepoContextConfig
): Promise<SummaryBundle> {
  const offline = buildOfflineSummary(scan, index);
  const client = createLlmClient(config.llm);
  if (!client) {
    return {
      ...offline,
      llmAttempted: config.llm.enabled,
      fallbackReason: config.llm.enabled ? "missing_configuration" : "disabled"
    };
  }

  try {
    const repoSummary = await client.complete(buildRepoPrompt(scan, index, offline));
    return {
      ...offline,
      mode: "llm",
      llmAttempted: true,
      fallbackReason: undefined,
      repoSummary
    };
  } catch {
    return {
      ...offline,
      llmAttempted: true,
      fallbackReason: "request_failed"
    };
  }
}

function buildOfflineSummary(scan: RepoScan, index: RepoIndex): SummaryBundle {
  const moduleSummaries = index.modules
    .sort((a, b) => b.importanceScore - a.importanceScore || a.name.localeCompare(b.name))
    .map((module) => ({
      moduleName: module.name,
      summary: module.summary,
      evidence: module.files.slice(0, 8)
    }));

  const repoSummary = [
    `This repository contains ${scan.files.length} scanned files.`,
    `Detected languages: ${scan.languages.join(", ") || "none"}.`,
    `Detected frameworks: ${scan.frameworks.join(", ") || "none"}.`,
    `Detected modules: ${index.modules.length}.`,
    `Detected symbols: ${index.symbols.length}.`
  ].join(" ");

  return {
    mode: "offline",
    llmAttempted: false,
    fallbackReason: "disabled",
    repoSummary,
    moduleSummaries
  };
}

function buildRepoPrompt(scan: RepoScan, index: RepoIndex, offline: SummaryBundle): string {
  const modules = offline.moduleSummaries
    .slice(0, 12)
    .map((module) => `- ${module.moduleName}: ${module.summary} Evidence: ${module.evidence.join(", ")}`)
    .join("\n");

  const keyFiles = index.files
    .sort((a, b) => b.importanceScore - a.importanceScore)
    .slice(0, 15)
    .map((file) => `- ${file.path}: ${file.summary}`)
    .join("\n");

  return [
    "Create a concise repository summary for an AI coding agent.",
    "Use only the evidence below. Do not invent features.",
    "",
    `Languages: ${scan.languages.join(", ") || "none"}`,
    `Frameworks: ${scan.frameworks.join(", ") || "none"}`,
    `Entrypoints: ${scan.entrypoints.join(", ") || "none"}`,
    "",
    "Modules:",
    modules || "- None",
    "",
    "Key files:",
    keyFiles || "- None",
    "",
    "Return 3-5 short paragraphs plus a brief caution if the static analysis may be incomplete."
  ].join("\n");
}
