import type { IndexedFile, RepoScan, TokenizerConfig, TokenSavingsReport } from "./types.js";
import { countTokens, estimateTokens } from "./token-estimator.js";

const DEFAULT_TOKEN_BUDGET = 60000;
const SUMMARY_OVERHEAD_TOKENS = 1200;
const MODULE_OVERHEAD_TOKENS = 140;
const GRAPH_EDGE_TOKENS = 12;
const MAX_GRAPH_EDGES = 120;
const MAX_SELECTED_FILES = 80;

export interface TokenSavingsOptions {
  tokenBudget?: number;
  tokenizer?: TokenizerConfig;
}

export function calculateTokenSavings(
  scan: RepoScan,
  keyFiles: IndexedFile[],
  options: TokenSavingsOptions = {}
): TokenSavingsReport {
  const originalTokens = scan.files.reduce((sum, file) => sum + file.tokenEstimate, 0);
  const tokenBudget = options.tokenBudget ?? DEFAULT_TOKEN_BUDGET;
  const tokenizer = options.tokenizer ?? { mode: "chars_approx" };
  const selectedFiles = selectFilesForBudget(scan, keyFiles, tokenBudget);
  const contextPackTokens = estimateContextPackTokens(scan, selectedFiles, tokenizer);
  const compressionRatio = contextPackTokens ? Math.max(1, Math.round(originalTokens / contextPackTokens)) : 1;

  return {
    tokenBudget,
    originalTokens,
    contextPackTokenEstimate: contextPackTokens,
    contextPackTokens: {
      mode: "estimated",
      tokenizer: tokenizer.mode,
      model: tokenizer.model,
      tokens: contextPackTokens
    },
    compressionRatio,
    withinBudget: contextPackTokens <= tokenBudget,
    selectedFiles: selectedFiles.length,
    totalFiles: scan.files.length,
    estimatedTokenSavings: Math.max(0, originalTokens - contextPackTokens),
    originalRepoTokens: {
      mode: "estimated",
      tokenizer: "chars_approx",
      tokens: originalTokens
    },
    estimatedContextPackTokens: {
      mode: "estimated",
      tokenizer: tokenizer.mode,
      model: tokenizer.model,
      tokens: contextPackTokens
    }
  };
}

export function formatTokenSavings(report: TokenSavingsReport): string {
  const actual = report.contextPackTokens.mode === "actual" ? report.contextPackTokens : report.actualOutputTokens;
  const lines = [
    `Original repo (${report.originalRepoTokens.mode}, ${formatTokenizer(report.originalRepoTokens)}): ${report.originalRepoTokens.tokens.toLocaleString()} tokens`,
    `Estimated context pack (${formatTokenizer(report.estimatedContextPackTokens)}): ${report.estimatedContextPackTokens.tokens.toLocaleString()} tokens`,
    `Compression: ${report.compressionRatio}x`,
    `Token budget: ${report.tokenBudget.toLocaleString()} (${report.withinBudget ? "within budget" : "over budget"})`
  ];
  if (actual) {
    lines.push(`Actual context pack (${formatTokenizer(actual)}): ${actual.total.toLocaleString()} tokens`);
  }
  return lines.join("\n");
}

function selectFilesForBudget(scan: RepoScan, keyFiles: IndexedFile[], tokenBudget: number): IndexedFile[] {
  const selected: IndexedFile[] = [];
  for (const file of keyFiles.slice(0, MAX_SELECTED_FILES)) {
    const candidate = [...selected, file];
    if (selected.length && estimateContextPackTokens(scan, candidate, { mode: "chars_approx" }) > tokenBudget) {
      break;
    }

    selected.push(file);
  }

  return selected;
}

function estimateContextPackTokens(scan: RepoScan, selectedFiles: IndexedFile[], tokenizer: TokenizerConfig): number {
  const scanTokens = countTokens([
    scan.languages.join(", "),
    scan.frameworks.join(", "),
    scan.packageManagers.join(", "),
    scan.entrypoints.join("\n"),
    scan.testCommands.join("\n"),
    scan.runCommands.join("\n")
  ].join("\n"), tokenizer).tokens;

  return Math.max(1, Math.ceil(scanTokens + estimateContextPackTokensForFiles(selectedFiles, tokenizer)));
}

function estimateContextPackTokensForFiles(selectedFiles: IndexedFile[], tokenizer: TokenizerConfig): number {
  const selectedModules = new Set(selectedFiles.map((file) => file.moduleName));
  const fileTokens = selectedFiles.reduce((sum, file) => sum + estimateCompactFileTokens(file, tokenizer), 0);
  const moduleTokens = selectedModules.size * MODULE_OVERHEAD_TOKENS;
  const graphTokens = Math.min(MAX_GRAPH_EDGES, selectedFiles.reduce((sum, file) => sum + file.imports.length, 0)) * GRAPH_EDGE_TOKENS;

  return SUMMARY_OVERHEAD_TOKENS + fileTokens + moduleTokens + graphTokens;
}

function estimateCompactFileTokens(file: IndexedFile, tokenizer: TokenizerConfig): number {
  const compactText = [
    `Path: ${file.path}`,
    `Module: ${file.moduleName}`,
    `Kind: ${file.kind}`,
    `Summary: ${file.summary}`,
    `Why: ${file.importanceReasons.join(", ")}`,
    `Imports: ${file.imports.slice(0, 20).map((item) => item.specifier).join(", ")}`,
    `Exports: ${file.exports.slice(0, 20).join(", ")}`,
    `Symbols: ${file.symbols.slice(0, 40).map((symbol) => symbol.name).join(", ")}`
  ].join("\n");

  return countTokens(compactText, tokenizer).tokens;
}

function formatTokenizer(value: { tokenizer: string; model?: string }): string {
  return value.model ? `${value.tokenizer}, ${value.model}` : value.tokenizer;
}
