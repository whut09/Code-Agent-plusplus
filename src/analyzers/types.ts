import type { ImportRef, RepoFile, SymbolInfo } from "../core/types.js";

export interface FileAnalysis {
  imports: ImportRef[];
  exports: string[];
  symbols: SymbolInfo[];
  summary: string;
}

export interface LanguageAnalyzer {
  name: string;
  supports(file: RepoFile): boolean;
  analyze(file: RepoFile, content: string, allPaths: Set<string>): FileAnalysis;
}
