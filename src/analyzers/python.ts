import type { LanguageAnalyzer } from "./types.js";
import type { ImportRef, SymbolInfo } from "../core/types.js";

export const pythonAnalyzer: LanguageAnalyzer = {
  name: "python",
  supports(file) {
    return file.language === "Python";
  },
  analyze(file, content) {
    const imports = extractImports(content);
    const symbols = extractSymbols(file.path, content);

    return {
      imports,
      symbols,
      exports: symbols.filter((symbol) => !symbol.name.startsWith("_")).map((symbol) => symbol.name).sort(),
      summary: `${file.path} contains ${symbols.length} detected Python symbol${symbols.length === 1 ? "" : "s"} and ${imports.length} import${imports.length === 1 ? "" : "s"}.`
    };
  }
};

function extractImports(content: string): ImportRef[] {
  const specs = new Set<string>();
  for (const match of content.matchAll(/^\s*import\s+([A-Za-z_][\w.]*)(?:\s+as\s+\w+)?/gm)) {
    specs.add(match[1]);
  }
  for (const match of content.matchAll(/^\s*from\s+([A-Za-z_.][\w.]*)\s+import\s+/gm)) {
    specs.add(match[1]);
  }

  return [...specs].map((specifier) => ({
    specifier,
    resolvedPath: null,
    isExternal: true
  }));
}

function extractSymbols(filePath: string, content: string): SymbolInfo[] {
  const symbols: SymbolInfo[] = [];
  const patterns: Array<{ kind: SymbolInfo["kind"]; pattern: RegExp }> = [
    { kind: "function", pattern: /^\s*def\s+([A-Za-z_]\w*)\s*\(/gm },
    { kind: "function", pattern: /^\s*async\s+def\s+([A-Za-z_]\w*)\s*\(/gm },
    { kind: "class", pattern: /^\s*class\s+([A-Za-z_]\w*)\s*[:(]/gm }
  ];

  for (const { kind, pattern } of patterns) {
    for (const match of content.matchAll(pattern)) {
      symbols.push({
        name: match[1],
        kind,
        filePath,
        line: content.slice(0, match.index ?? 0).split(/\r?\n/).length
      });
    }
  }

  return symbols;
}
