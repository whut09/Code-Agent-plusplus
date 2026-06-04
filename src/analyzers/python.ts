import type { LanguageAnalyzer } from "./types.js";
import type { AnalysisEvidence, ImportRef, SymbolInfo } from "../core/types.js";
import { resolveImport } from "./resolve-import.js";

export const pythonAnalyzer: LanguageAnalyzer = {
  name: "python",
  supports(file) {
    return file.language === "Python";
  },
  analyze(file, content, context) {
    const imports = extractImports(file.path, content, context.allPaths);
    const symbols = extractSymbols(file.path, content);
    const evidence: AnalysisEvidence[] = [
      ...imports.map((item) => ({ line: 1, kind: "import" as const, detail: `Imports ${item.specifier}.` })),
      ...symbols.map((symbol) => ({ line: symbol.line, kind: "symbol" as const, symbol: symbol.name, detail: `Declares ${symbol.kind} ${symbol.name}.` }))
    ];

    return {
      imports,
      symbols,
      exports: symbols.filter((symbol) => !symbol.name.startsWith("_")).map((symbol) => symbol.name).sort(),
      summary: `${file.path} contains ${symbols.length} detected Python symbol${symbols.length === 1 ? "" : "s"} and ${imports.length} import${imports.length === 1 ? "" : "s"}.`,
      confidence: symbols.length || imports.some((item) => !item.isExternal) ? "medium" : "low",
      evidence: evidence.slice(0, 120)
    };
  }
};

function extractImports(filePath: string, content: string, allPaths: Set<string>): ImportRef[] {
  const specs = new Set<string>();
  for (const match of content.matchAll(/^\s*import\s+([A-Za-z_][\w.]*)(?:\s+as\s+\w+)?/gm)) {
    specs.add(match[1]);
  }
  for (const match of content.matchAll(/^\s*from\s+([A-Za-z_.][\w.]*)\s+import\s+/gm)) {
    specs.add(match[1]);
  }

  return [...specs].map((specifier) => {
    const resolvedPath = resolvePythonImport(filePath, specifier, allPaths);
    return { specifier, resolvedPath, isExternal: !resolvedPath };
  });
}

function resolvePythonImport(filePath: string, specifier: string, allPaths: Set<string>): string | null {
  const leadingDots = specifier.match(/^\.+/)?.[0].length ?? 0;
  const modulePath = specifier.slice(leadingDots).replaceAll(".", "/");
  if (leadingDots) {
    const relative = leadingDots === 1
      ? `./${modulePath}`
      : `${"../".repeat(leadingDots - 1)}${modulePath}`;
    return resolveImport(filePath, relative || ".", allPaths);
  }

  const candidates = [
    `${modulePath}.py`,
    `${modulePath}/__init__.py`,
    `src/${modulePath}.py`,
    `src/${modulePath}/__init__.py`
  ];
  return candidates.find((candidate) => allPaths.has(candidate)) ?? null;
}

function extractSymbols(filePath: string, content: string): SymbolInfo[] {
  const symbols: SymbolInfo[] = [];
  const patterns: Array<{ kind: SymbolInfo["kind"]; pattern: RegExp }> = [
    { kind: "function", pattern: /^\s*def\s+([A-Za-z_]\w*)\s*\(/gm },
    { kind: "function", pattern: /^\s*async\s+def\s+([A-Za-z_]\w*)\s*\(/gm },
    { kind: "class", pattern: /^\s*class\s+([A-Za-z_]\w*)\s*[:(]/gm },
    { kind: "route", pattern: /^\s*@[\w.]+\.(get|post|put|patch|delete|options|head)\(\s*["']([^"']+)["']/gmi }
  ];

  for (const { kind, pattern } of patterns) {
    for (const match of content.matchAll(pattern)) {
      symbols.push({
        name: kind === "route" ? `${match[1].toUpperCase()} ${match[2]}` : match[1],
        kind,
        filePath,
        line: content.slice(0, match.index ?? 0).split(/\r?\n/).length
      });
    }
  }

  return symbols;
}
