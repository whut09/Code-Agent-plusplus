import ts from "typescript";
import type { AnalysisEvidence, ImportRef, SymbolInfo } from "../core/types.js";
import { resolveImport } from "./resolve-import.js";
import type { AnalysisContext, FileAnalysis, LanguageAnalyzer } from "./types.js";

const ROUTE_METHODS = new Set(["get", "post", "put", "patch", "delete", "options", "head"]);

export const javascriptAnalyzer: LanguageAnalyzer = {
  name: "typescript-compiler-api",
  supports(file) {
    return ["JavaScript", "TypeScript"].includes(file.language ?? "");
  },
  analyze(file, content, context) {
    try {
      return analyzeWithCompilerApi(file.path, file.extension, content, context);
    } catch {
      return analyzeWithRegexFallback(file.path, content, context);
    }
  }
};

function analyzeWithCompilerApi(
  filePath: string,
  extension: string,
  content: string,
  context: AnalysisContext
): FileAnalysis {
  const source = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, scriptKind(extension));
  const imports = new Map<string, ImportRef>();
  const exports = new Set<string>();
  const symbols: SymbolInfo[] = [];
  const evidence: AnalysisEvidence[] = [];

  const addImport = (specifier: string, node: ts.Node) => {
    const resolvedPath = resolveImport(filePath, specifier, context.allPaths, context.pathAliases);
    imports.set(specifier, { specifier, resolvedPath, isExternal: !resolvedPath });
    evidence.push({ line: lineOf(source, node), kind: "import", detail: `Imports ${specifier}.` });
  };
  const addSymbol = (name: string, kind: SymbolInfo["kind"], node: ts.Node) => {
    symbols.push({ name, kind, filePath, line: lineOf(source, node) });
    evidence.push({ line: lineOf(source, node), kind: kind === "route" ? "route" : "symbol", symbol: name, detail: `Declares ${kind} ${name}.` });
  };
  const addExport = (name: string, node: ts.Node) => {
    exports.add(name);
    evidence.push({ line: lineOf(source, node), kind: "export", symbol: name, detail: `Exports ${name}.` });
  };

  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      addImport(node.moduleSpecifier.text, node);
    } else if (ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) addImport(node.moduleSpecifier.text, node);
      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const element of node.exportClause.elements) addExport(element.name.text, element);
      } else if (node.exportClause && ts.isNamespaceExport(node.exportClause)) {
        addExport(node.exportClause.name.text, node.exportClause);
      } else {
        addExport("*", node);
      }
    } else if (ts.isExportAssignment(node)) {
      addExport("default", node);
    } else if (ts.isFunctionDeclaration(node) && node.name) {
      addSymbol(node.name.text, "function", node);
      if (isExported(node)) addExport(node.name.text, node);
      if (isHttpHandlerName(node.name.text) && isExported(node)) addSymbol(node.name.text, "route", node);
    } else if (ts.isClassDeclaration(node) && node.name) {
      addSymbol(node.name.text, "class", node);
      if (isExported(node)) addExport(node.name.text, node);
    } else if (ts.isInterfaceDeclaration(node)) {
      addSymbol(node.name.text, "interface", node);
      if (isExported(node)) addExport(node.name.text, node);
    } else if (ts.isTypeAliasDeclaration(node)) {
      addSymbol(node.name.text, "type", node);
      if (isExported(node)) addExport(node.name.text, node);
    } else if (ts.isEnumDeclaration(node)) {
      addSymbol(node.name.text, "enum", node);
      if (isExported(node)) addExport(node.name.text, node);
    } else if (ts.isModuleDeclaration(node)) {
      addSymbol(node.name.getText(source), "namespace", node);
      if (isExported(node)) addExport(node.name.getText(source), node);
    } else if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue;
        addSymbol(declaration.name.text, "const", declaration);
        if (isExported(node)) addExport(declaration.name.text, declaration);
      }
    } else if (ts.isMethodDeclaration(node)) {
      for (const decorator of ts.canHaveDecorators(node) ? ts.getDecorators(node) ?? [] : []) {
        const route = routeFromDecorator(decorator);
        if (route) addSymbol(route, "route", decorator);
      }
    } else if (ts.isCallExpression(node)) {
      const specifier = importCallSpecifier(node);
      if (specifier) addImport(specifier, node);
      const route = routeFromCall(node);
      if (route) addSymbol(route, "route", node);
    }

    ts.forEachChild(node, visit);
  };
  visit(source);

  return {
    imports: [...imports.values()],
    exports: [...exports].sort(),
    symbols: uniqueSymbols(symbols),
    summary: summarize(filePath, imports.size, symbols.length, exports.size),
    confidence: "high",
    evidence: evidence.slice(0, 120)
  };
}

function routeFromDecorator(decorator: ts.Decorator): string | null {
  if (!ts.isCallExpression(decorator.expression) || !ts.isIdentifier(decorator.expression.expression)) return null;
  const method = decorator.expression.expression.text.toLowerCase();
  if (!ROUTE_METHODS.has(method)) return null;
  const argument = decorator.expression.arguments[0];
  return `${method.toUpperCase()} ${argument && ts.isStringLiteralLike(argument) ? argument.text : "/"}`;
}

function analyzeWithRegexFallback(filePath: string, content: string, context: AnalysisContext): FileAnalysis {
  const imports = [...content.matchAll(/(?:from\s+|require\(\s*|import\(\s*)["']([^"']+)["']/g)]
    .map((match) => match[1])
    .filter((value, index, values) => values.indexOf(value) === index)
    .map((specifier) => {
      const resolvedPath = resolveImport(filePath, specifier, context.allPaths, context.pathAliases);
      return { specifier, resolvedPath, isExternal: !resolvedPath };
    });
  const symbols = [...content.matchAll(/(?:function|class|interface|type|const)\s+([A-Za-z_$][\w$]*)/g)]
    .map((match): SymbolInfo => ({
      name: match[1],
      kind: "unknown",
      filePath,
      line: content.slice(0, match.index ?? 0).split(/\r?\n/).length
    }));
  return {
    imports,
    exports: [],
    symbols,
    summary: summarize(filePath, imports.length, symbols.length, 0),
    confidence: "low",
    evidence: symbols.slice(0, 40).map((symbol) => ({
      line: symbol.line,
      kind: "symbol",
      symbol: symbol.name,
      detail: `Regex fallback detected ${symbol.name}.`
    }))
  };
}

function importCallSpecifier(node: ts.CallExpression): string | null {
  if (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === "require")) {
    const argument = node.arguments[0];
    return argument && ts.isStringLiteral(argument) ? argument.text : null;
  }
  return null;
}

function routeFromCall(node: ts.CallExpression): string | null {
  if (!ts.isPropertyAccessExpression(node.expression)) return null;
  const method = node.expression.name.text.toLowerCase();
  if (!ROUTE_METHODS.has(method)) return null;
  const argument = node.arguments[0];
  if (!argument || !ts.isStringLiteralLike(argument)) return null;
  return `${method.toUpperCase()} ${argument.text}`;
}

function isExported(node: ts.Node): boolean {
  return ts.canHaveModifiers(node) && Boolean(ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword));
}

function isHttpHandlerName(name: string): boolean {
  return ROUTE_METHODS.has(name.toLowerCase());
}

function lineOf(source: ts.SourceFile, node: ts.Node): number {
  return source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
}

function scriptKind(extension: string): ts.ScriptKind {
  if (extension === ".tsx") return ts.ScriptKind.TSX;
  if (extension === ".jsx") return ts.ScriptKind.JSX;
  if ([".js", ".mjs", ".cjs"].includes(extension)) return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function uniqueSymbols(symbols: SymbolInfo[]): SymbolInfo[] {
  const seen = new Set<string>();
  return symbols.filter((symbol) => {
    const key = `${symbol.kind}:${symbol.name}:${symbol.line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function summarize(filePath: string, imports: number, symbols: number, exports: number): string {
  return `${filePath} contains ${symbols} detected symbol${symbols === 1 ? "" : "s"}, ${imports} import${imports === 1 ? "" : "s"}, ${exports} export${exports === 1 ? "" : "s"}.`;
}
