import type { ContextPackage, IndexedFile } from "../core/types.js";
import { estimateTokens } from "../core/token-estimator.js";
import { heading } from "./markdown.js";

export interface RagDocument {
  id: string;
  title: string;
  path: string;
  moduleName: string;
  kind: string;
  tokens: number;
  text: string;
  metadata: Record<string, unknown>;
}

export function buildRagDocuments(context: ContextPackage): RagDocument[] {
  const docs: RagDocument[] = [];
  const tokenLimit = context.config.rag.chunkTokenLimit;
  const repoText = limitText(context.summaries.repoSummary, tokenLimit);
  const selectedFiles = context.keyFiles.slice(0, context.tokenSavings.selectedFiles);
  const selectedModules = new Set(selectedFiles.map((file) => file.moduleName));

  docs.push({
    id: "repo-summary",
    title: "Repository Summary",
    path: ".agent-context/repo-summary.md",
    moduleName: "repo",
    kind: "summary",
    tokens: estimateTokens(repoText),
    text: repoText,
    metadata: {
      target: context.target,
      languages: context.scan.languages,
      frameworks: context.scan.frameworks,
      readinessScore: context.readiness.score
    }
  });

  for (const module of context.summaries.moduleSummaries.filter((item) => selectedModules.has(item.moduleName))) {
    const moduleText = limitText(`${module.summary}\n\nEvidence:\n${module.evidence.map((file) => `- ${file}`).join("\n")}`, tokenLimit);
    docs.push({
      id: `module-${safeId(module.moduleName)}`,
      title: `Module: ${module.moduleName}`,
      path: `.agent-context/modules/${module.moduleName}`,
      moduleName: module.moduleName,
      kind: "module-summary",
      tokens: estimateTokens(moduleText),
      text: moduleText,
      metadata: {
        evidence: module.evidence
      }
    });
  }

  for (const file of selectedFiles) {
    docs.push(fileToRagDocument(file, tokenLimit));
  }

  return docs;
}

export function renderRagReadme(context: ContextPackage): string {
  return [
    heading(1, "LightRAG Export"),
    "",
    "This directory contains a LightRAG-friendly export of the repository context.",
    "",
    "Repo-to-Agent-Context does not require LightRAG at runtime. The recommended architecture is adapter-based:",
    "",
    "1. Generate `.agent-context/rag/documents.jsonl`.",
    "2. Import those documents into a local or remote LightRAG service.",
    "3. Keep the same embedding model for indexing and querying.",
    "",
    heading(2, "Files"),
    "",
    "- `documents.jsonl`: one JSON document per line.",
    "- `manifest.json`: export metadata.",
    "- `README.md`: this guide.",
    "",
    heading(2, "Config"),
    "",
    "Provider: LightRAG",
    "",
    "Direct LightRAG server synchronization is not implemented yet. Import `documents.jsonl` using your LightRAG deployment workflow."
  ].join("\n");
}

export function buildRagManifest(context: ContextPackage, documentCount: number): Record<string, unknown> {
  return {
    provider: "lightrag",
    mode: "export",
    documentCount,
    generatedFrom: "repo-to-agent-context",
    target: context.target,
    languages: context.scan.languages,
    frameworks: context.scan.frameworks,
    tokenSavings: context.tokenSavings,
    readiness: context.readiness
  };
}

function fileToRagDocument(file: IndexedFile, tokenLimit: number): RagDocument {
  const text = limitText([
    `Path: ${file.path}`,
    `Module: ${file.moduleName}`,
    `Kind: ${file.kind}`,
    `Summary: ${file.summary}`,
    `Exports: ${file.exports.join(", ") || "none"}`,
    `Symbols: ${file.symbols.map((symbol) => symbol.name).join(", ") || "none"}`,
    `Importance: ${file.importanceScore} (${file.importanceReasons.join(", ") || "no ranking signals"})`
  ].join("\n"), tokenLimit);

  return {
    id: `file-${safeId(file.path)}`,
    title: file.path,
    path: file.path,
    moduleName: file.moduleName,
    kind: file.kind,
    tokens: estimateTokens(text),
    text,
    metadata: {
      imports: file.imports,
      exports: file.exports,
      symbols: file.symbols,
      importanceScore: file.importanceScore,
      importanceReasons: file.importanceReasons,
      analyzer: file.analyzer,
      confidence: file.confidence,
      evidence: file.evidence
    }
  };
}

function safeId(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-|-$/g, "") || "root";
}

function limitText(text: string, tokenLimit: number): string {
  const characterLimit = Math.max(1, tokenLimit) * 4;
  if (text.length <= characterLimit) {
    return text;
  }

  return `${text.slice(0, characterLimit - 16).trimEnd()}\n[truncated]`;
}
