import type { LanguageAnalyzer } from "./types.js";

export const genericAnalyzer: LanguageAnalyzer = {
  name: "generic",
  supports() {
    return true;
  },
  analyze(file) {
    return {
      imports: [],
      exports: [],
      symbols: [],
      summary: `${file.path} is a ${file.kind} file${file.language ? ` written as ${file.language}` : ""}.`,
      confidence: "low",
      stats: {
        parser: "generic",
        importsResolved: 0,
        importsUnresolved: 0,
        symbolsDetected: 0,
        routesDetected: 0
      },
      evidence: []
    };
  }
};
