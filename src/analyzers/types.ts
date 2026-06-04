import type { AnalysisConfidence, AnalysisEvidence, ImportRef, RepoFile, SymbolInfo } from "../core/types.js";

export interface AnalysisContext {
  allPaths: Set<string>;
  pathAliases: Array<{
    pattern: string;
    targets: string[];
  }>;
}

export interface FileAnalysis {
  imports: ImportRef[];
  exports: string[];
  symbols: SymbolInfo[];
  summary: string;
  confidence: AnalysisConfidence;
  evidence: AnalysisEvidence[];
}

export interface LanguageAnalyzer {
  name: string;
  supports(file: RepoFile): boolean;
  analyze(file: RepoFile, content: string, context: AnalysisContext): FileAnalysis;
}
