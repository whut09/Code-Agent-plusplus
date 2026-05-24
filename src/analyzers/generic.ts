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
      summary: `${file.path} is a ${file.kind} file${file.language ? ` written as ${file.language}` : ""}.`
    };
  }
};
