import type { LanguageAnalyzer } from "./types.js";
import { resolveImport } from "./resolve-import.js";
import type { ImportRef, SymbolInfo } from "../core/types.js";

const JS_IMPORT_PATTERNS = [
  /import\s+(?:type\s+)?(?:[^'"]+\s+from\s+)?["']([^"']+)["']/g,
  /export\s+[^'"]+\s+from\s+["']([^"']+)["']/g,
  /require\(\s*["']([^"']+)["']\s*\)/g,
  /import\(\s*["']([^"']+)["']\s*\)/g
];

const SYMBOL_PATTERNS: Array<{ kind: SymbolInfo["kind"]; pattern: RegExp }> = [
  { kind: "function", pattern: /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g },
  { kind: "class", pattern: /(?:export\s+)?class\s+([A-Za-z_$][\w$]*)/g },
  { kind: "interface", pattern: /(?:export\s+)?interface\s+([A-Za-z_$][\w$]*)/g },
  { kind: "type", pattern: /(?:export\s+)?type\s+([A-Za-z_$][\w$]*)/g },
  { kind: "const", pattern: /(?:export\s+)?const\s+([A-Za-z_$][\w$]*)/g },
  { kind: "route", pattern: /\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]+)["'`]/g }
];

export const javascriptAnalyzer: LanguageAnalyzer = {
  name: "javascript",
  supports(file) {
    return ["JavaScript", "TypeScript"].includes(file.language ?? "");
  },
  analyze(file, content, allPaths) {
    const imports = extractImports(file.path, content, allPaths);
    const symbols = extractSymbols(file.path, content);
    const exports = extractExports(content, symbols);

    return {
      imports,
      symbols,
      exports,
      summary: summarize(file.path, imports, symbols, exports)
    };
  }
};

function extractImports(filePath: string, content: string, allPaths: Set<string>): ImportRef[] {
  const specs = new Set<string>();
  for (const pattern of JS_IMPORT_PATTERNS) {
    for (const match of content.matchAll(pattern)) {
      specs.add(match[1]);
    }
  }

  return [...specs].map((specifier) => {
    const resolvedPath = resolveImport(filePath, specifier, allPaths);
    return {
      specifier,
      resolvedPath,
      isExternal: !resolvedPath
    };
  });
}

function extractSymbols(filePath: string, content: string): SymbolInfo[] {
  const symbols: SymbolInfo[] = [];
  for (const { kind, pattern } of SYMBOL_PATTERNS) {
    for (const match of content.matchAll(pattern)) {
      const name = kind === "route" ? `${match[1].toUpperCase()} ${match[2]}` : match[1];
      symbols.push({
        name,
        kind,
        filePath,
        line: lineForIndex(content, match.index ?? 0)
      });
    }
  }

  return symbols;
}

function extractExports(content: string, symbols: SymbolInfo[]): string[] {
  const exports = new Set<string>();
  for (const symbol of symbols) {
    if (new RegExp(`export\\s+(?:async\\s+)?(?:function|class|interface|type|const)\\s+${escapeRegExp(symbol.name)}\\b`).test(content)) {
      exports.add(symbol.name);
    }
  }

  for (const match of content.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const part of match[1].split(",")) {
      const name = part.trim().split(/\s+as\s+/i)[0]?.trim();
      if (name) exports.add(name);
    }
  }

  if (/export\s+default\b/.test(content)) {
    exports.add("default");
  }

  return [...exports].sort();
}

function summarize(filePath: string, imports: ImportRef[], symbols: SymbolInfo[], exports: string[]): string {
  const parts = [
    `${filePath} contains ${symbols.length} detected symbol${symbols.length === 1 ? "" : "s"}`,
    `${imports.length} import${imports.length === 1 ? "" : "s"}`,
    `${exports.length} export${exports.length === 1 ? "" : "s"}`
  ];

  return `${parts.join(", ")}.`;
}

function lineForIndex(content: string, index: number): number {
  return content.slice(0, index).split(/\r?\n/).length;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
