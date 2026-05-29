import type { IndexedFile, RepoScan, TokenSavingsReport } from "./types.js";
import { estimateTokens } from "./token-estimator.js";

const DEFAULT_TOKEN_BUDGET = 60000;
const SUMMARY_OVERHEAD_TOKENS = 1200;
const MODULE_OVERHEAD_TOKENS = 140;
const GRAPH_EDGE_TOKENS = 12;
const MAX_GRAPH_EDGES = 120;
const MAX_SELECTED_FILES = 80;

export interface TokenSavingsOptions {
  tokenBudget?: number;
}

export function calculateTokenSavings(
  scan: RepoScan,
  keyFiles: IndexedFile[],
  options: TokenSavingsOptions = {}
): TokenSavingsReport {
  const originalTokens = scan.files.reduce((sum, file) => sum + file.tokenEstimate, 0);
  const tokenBudget = options.tokenBudget ?? DEFAULT_TOKEN_BUDGET;
  const selectedFiles = selectFilesForBudget(keyFiles, tokenBudget);
  const contextPackTokens = estimateContextPackTokens(scan, selectedFiles);
  const compressionRatio = contextPackTokens ? Math.max(1, Math.round(originalTokens / contextPackTokens)) : 1;

  return {
    originalTokens,
    contextPackTokens,
    compressionRatio,
    selectedFiles: selectedFiles.length,
    totalFiles: scan.files.length
  };
}

export function formatTokenSavings(report: TokenSavingsReport): string {
  return [
    `Original repo: ${report.originalTokens.toLocaleString()} tokens`,
    `Context pack: ${report.contextPackTokens.toLocaleString()} tokens`,
    `Compression: ${report.compressionRatio}x`
  ].join("\n");
}

function selectFilesForBudget(keyFiles: IndexedFile[], tokenBudget: number): IndexedFile[] {
  const selected: IndexedFile[] = [];
  let usedTokens = SUMMARY_OVERHEAD_TOKENS;

  for (const file of keyFiles.slice(0, MAX_SELECTED_FILES)) {
    const fileTokens = estimateCompactFileTokens(file);
    if (selected.length && usedTokens + fileTokens > tokenBudget) {
      break;
    }

    selected.push(file);
    usedTokens += fileTokens;
  }

  return selected;
}

function estimateContextPackTokens(scan: RepoScan, selectedFiles: IndexedFile[]): number {
  const selectedModules = new Set(selectedFiles.map((file) => file.moduleName));
  const fileTokens = selectedFiles.reduce((sum, file) => sum + estimateCompactFileTokens(file), 0);
  const moduleTokens = selectedModules.size * MODULE_OVERHEAD_TOKENS;
  const graphTokens = Math.min(MAX_GRAPH_EDGES, selectedFiles.reduce((sum, file) => sum + file.imports.length, 0)) * GRAPH_EDGE_TOKENS;
  const scanTokens = estimateTokens([
    scan.languages.join(", "),
    scan.frameworks.join(", "),
    scan.packageManagers.join(", "),
    scan.entrypoints.join("\n"),
    scan.testCommands.join("\n"),
    scan.runCommands.join("\n")
  ].join("\n"));

  return Math.max(1, Math.ceil(SUMMARY_OVERHEAD_TOKENS + scanTokens + fileTokens + moduleTokens + graphTokens));
}

function estimateCompactFileTokens(file: IndexedFile): number {
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

  return estimateTokens(compactText);
}
