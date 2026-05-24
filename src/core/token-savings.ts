import type { IndexedFile, RepoScan, TokenSavingsReport } from "./types.js";

export function calculateTokenSavings(scan: RepoScan, keyFiles: IndexedFile[]): TokenSavingsReport {
  const originalTokens = scan.files.reduce((sum, file) => sum + file.tokenEstimate, 0);
  const contextPackTokens = keyFiles.slice(0, 25).reduce((sum, file) => sum + file.tokenEstimate, 0);
  const compressionRatio = contextPackTokens ? Math.max(1, Math.round(originalTokens / contextPackTokens)) : 1;

  return {
    originalTokens,
    contextPackTokens,
    compressionRatio,
    selectedFiles: Math.min(25, keyFiles.length),
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
