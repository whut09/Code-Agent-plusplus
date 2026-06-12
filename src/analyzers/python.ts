import type { LanguageAnalyzer } from "./types.js";
import type { AnalysisEvidence, SymbolInfo } from "../core/types.js";
import { resolveImport } from "./resolve-import.js";
import { spawnSync } from "node:child_process";
import { parsePythonWithTreeSitter } from "./tree-sitter.js";

export const pythonAnalyzer: LanguageAnalyzer = {
  name: "python-ast",
  supports(file) {
    return file.language === "Python";
  },
  analyze(file, content, context) {
    const parsed = parsePythonTreeSitter(content) ?? parsePythonAst(content) ?? parsePythonWithRegex(content);
    const imports = parsed.imports.map((item) => {
      const resolvedPath = resolvePythonImport(file.path, item.specifier, context.allPaths);
      return { specifier: item.specifier, resolvedPath, isExternal: !resolvedPath };
    });
    const symbols = parsed.symbols.map((symbol) => ({
      ...symbol,
      filePath: file.path
    }));
    const evidence: AnalysisEvidence[] = [
      ...imports.map((item) => ({ line: parsed.importLines.get(item.specifier) ?? 1, kind: "import" as const, detail: `Imports ${item.specifier}.` })),
      ...symbols.map((symbol) => ({ line: symbol.line, kind: "symbol" as const, symbol: symbol.name, detail: `Declares ${symbol.kind} ${symbol.name}.` }))
    ];

    return {
      imports,
      symbols,
      exports: symbols
        .filter((symbol) => !symbol.name.startsWith("_"))
        .map((symbol) => symbol.name)
        .sort(),
      summary: `${file.path} contains ${symbols.length} detected Python symbol${symbols.length === 1 ? "" : "s"} and ${imports.length} import${imports.length === 1 ? "" : "s"}.`,
      confidence: symbols.length || imports.some((item) => !item.isExternal) ? "medium" : "low",
      stats: {
        parser: parsed.parser,
        importsResolved: imports.filter((item) => !item.isExternal).length,
        importsUnresolved: imports.filter((item) => item.isExternal).length,
        symbolsDetected: symbols.length,
        routesDetected: symbols.filter((symbol) => symbol.kind === "route").length
      },
      evidence: evidence.slice(0, 120)
    };
  }
};

interface ParsedPython {
  parser: "tree-sitter-python" | "python-ast" | "regex-fallback";
  imports: Array<{ specifier: string }>;
  importLines: Map<string, number>;
  symbols: Array<Omit<SymbolInfo, "filePath">>;
}

function parsePythonTreeSitter(content: string): ParsedPython | null {
  const parsed = parsePythonWithTreeSitter(content);
  if (!parsed) return null;

  const importLines = new Map<string, number>();
  const imports = parsed.imports.map((item) => {
    importLines.set(item.specifier, item.line);
    return { specifier: item.specifier };
  });

  return {
    parser: "tree-sitter-python",
    imports,
    importLines,
    symbols: uniqueSymbols(parsed.symbols)
  };
}

const PYTHON_AST_SCRIPT = `
import ast, json, sys
source = sys.stdin.read()
tree = ast.parse(source)
imports = []
symbols = []
route_methods = {"get", "post", "put", "patch", "delete", "options", "head"}

def normalize_path(value):
    if not value:
        return "/"
    if not value.startswith("/"):
        value = "/" + value
    return value

def constant_string(node):
    return node.value if isinstance(node, ast.Constant) and isinstance(node.value, str) else None

def call_name(node):
    if isinstance(node, ast.Attribute):
        return node.attr
    if isinstance(node, ast.Name):
        return node.id
    return None

def decorator_name(node):
    if isinstance(node, ast.Call):
        return call_name(node.func)
    return call_name(node)

def route_methods_from_call(call):
    methods = []
    for keyword in call.keywords:
        if keyword.arg != "methods":
            continue
        value = keyword.value
        nodes = value.elts if isinstance(value, (ast.List, ast.Tuple, ast.Set)) else [value]
        for item in nodes:
            text = constant_string(item)
            if text:
                methods.append(text.upper())
    return methods or ["GET"]

def route_from_decorator(decorator):
    call = decorator if isinstance(decorator, ast.Call) else None
    name = decorator_name(call if call else decorator)
    if not name:
        return []
    lower = name.lower()
    if lower == "route":
        route_path = "/"
        if call and call.args:
            text = constant_string(call.args[0])
            if text:
                route_path = text
        return [method + " " + normalize_path(route_path) for method in route_methods_from_call(call)]
    if lower not in route_methods:
        return []
    route_path = "/"
    if call and call.args:
        text = constant_string(call.args[0])
        if text:
            route_path = text
    return [lower.upper() + " " + normalize_path(route_path)]

def is_fixture_decorator(decorator):
    name = decorator_name(decorator)
    return bool(name) and name.lower().endswith("fixture")

def is_main_guard(node):
    test = getattr(node, "test", None)
    if not isinstance(test, ast.Compare):
        return False
    if not isinstance(test.left, ast.Name) or test.left.id != "__name__":
        return False
    if len(test.ops) != 1 or not isinstance(test.ops[0], ast.Eq):
        return False
    if len(test.comparators) != 1:
        return False
    return constant_string(test.comparators[0]) == "__main__"

class Visitor(ast.NodeVisitor):
    def visit_Import(self, node):
        for alias in node.names:
            if alias.name:
                imports.append({"specifier": alias.name, "line": node.lineno})
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        prefix = "." * node.level
        module = node.module or ""
        if module:
            imports.append({"specifier": prefix + module, "line": node.lineno})
        else:
            for alias in node.names:
                imports.append({"specifier": prefix + alias.name, "line": node.lineno})
        self.generic_visit(node)

    def visit_FunctionDef(self, node):
        fixture = any(is_fixture_decorator(decorator) for decorator in node.decorator_list)
        symbols.append({"name": ("fixture " if fixture else "") + node.name, "kind": "fixture" if fixture else "function", "line": node.lineno})
        for decorator in node.decorator_list:
            for route in route_from_decorator(decorator):
                symbols.append({"name": route, "kind": "route", "line": getattr(decorator, "lineno", node.lineno)})
        self.generic_visit(node)

    def visit_AsyncFunctionDef(self, node):
        self.visit_FunctionDef(node)

    def visit_ClassDef(self, node):
        symbols.append({"name": node.name, "kind": "class", "line": node.lineno})
        self.generic_visit(node)

    def visit_Call(self, node):
        name = call_name(node.func)
        if name in {"path", "re_path"} and node.args:
            text = constant_string(node.args[0])
            if text:
                symbols.append({"name": "DJANGO " + normalize_path(text), "kind": "route", "line": node.lineno})
        self.generic_visit(node)

    def visit_If(self, node):
        if is_main_guard(node):
            symbols.append({"name": "CLI __main__", "kind": "const", "line": node.lineno})
        self.generic_visit(node)

Visitor().visit(tree)
print(json.dumps({"imports": imports, "symbols": symbols}))
`;

function parsePythonAst(content: string): ParsedPython | null {
  for (const candidate of pythonCandidates()) {
    const result = spawnSync(candidate.command, [...candidate.args, "-c", PYTHON_AST_SCRIPT], {
      input: content,
      encoding: "utf8",
      timeout: 5000,
      windowsHide: true
    });
    if (result.status !== 0 || !result.stdout) continue;
    try {
      const parsed = JSON.parse(result.stdout) as {
        imports: Array<{ specifier: string; line: number }>;
        symbols: Array<{ name: string; kind: SymbolInfo["kind"]; line: number }>;
      };
      const importLines = new Map<string, number>();
      const imports = uniqueBy(parsed.imports, (item) => item.specifier).map((item) => {
        importLines.set(item.specifier, item.line);
        return { specifier: item.specifier };
      });
      return {
        parser: "python-ast",
        imports,
        importLines,
        symbols: uniqueSymbols(parsed.symbols)
      };
    } catch {
      continue;
    }
  }

  return null;
}

function pythonCandidates(): Array<{ command: string; args: string[] }> {
  return [
    { command: "python", args: [] },
    { command: "python3", args: [] },
    { command: "py", args: ["-3"] }
  ];
}

function parsePythonWithRegex(content: string): ParsedPython {
  const specs = new Map<string, number>();
  for (const match of content.matchAll(/^\s*import\s+([A-Za-z_][\w.]*)(?:\s+as\s+\w+)?/gm)) {
    specs.set(match[1], lineNumber(content, match.index ?? 0));
  }
  for (const match of content.matchAll(/^\s*from\s+([A-Za-z_.][\w.]*)\s+import\s+([A-Za-z_][\w]*)/gm)) {
    const base = match[1];
    const specifier = base.match(/^\.+$/) ? `${base}${match[2]}` : base;
    specs.set(specifier, lineNumber(content, match.index ?? 0));
  }

  return {
    parser: "regex-fallback",
    imports: [...specs.keys()].map((specifier) => ({ specifier })),
    importLines: specs,
    symbols: extractSymbols(content)
  };
}

function resolvePythonImport(filePath: string, specifier: string, allPaths: Set<string>): string | null {
  const leadingDots = specifier.match(/^\.+/)?.[0].length ?? 0;
  const modulePath = specifier.slice(leadingDots).replaceAll(".", "/");
  if (leadingDots) {
    const relative = leadingDots === 1 ? `./${modulePath}` : `${"../".repeat(leadingDots - 1)}${modulePath}`;
    return resolveImport(filePath, relative || ".", allPaths);
  }

  const candidates = [`${modulePath}.py`, `${modulePath}/__init__.py`, `src/${modulePath}.py`, `src/${modulePath}/__init__.py`];
  return candidates.find((candidate) => allPaths.has(candidate)) ?? null;
}

function extractSymbols(content: string): Array<Omit<SymbolInfo, "filePath">> {
  const symbols: Array<Omit<SymbolInfo, "filePath">> = [];
  const patterns: Array<{ kind: SymbolInfo["kind"]; pattern: RegExp }> = [
    { kind: "function", pattern: /^\s*def\s+([A-Za-z_]\w*)\s*\(/gm },
    { kind: "function", pattern: /^\s*async\s+def\s+([A-Za-z_]\w*)\s*\(/gm },
    { kind: "class", pattern: /^\s*class\s+([A-Za-z_]\w*)\s*[:(]/gm },
    { kind: "fixture", pattern: /^\s*@(?:[\w.]+\.)?fixture\b/gm },
    { kind: "route", pattern: /^\s*@.*?\.(?:route|get|post|put|patch|delete|options|head)\(\s*["']([^"']+)["']/gim },
    { kind: "route", pattern: /^\s*(?:path|re_path)\(\s*["']([^"']+)["']/gim }
  ];

  for (const { kind, pattern } of patterns) {
    for (const match of content.matchAll(pattern)) {
      const name = kind === "route" ? `ROUTE ${match[1]}` : kind === "fixture" ? "fixture" : match[1];
      symbols.push({
        name,
        kind,
        line: lineNumber(content, match.index ?? 0)
      });
    }
  }

  return symbols;
}

function lineNumber(content: string, index: number): number {
  return content.slice(0, index).split(/\r?\n/).length;
}

function uniqueBy<T>(items: T[], keyFor: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keyFor(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueSymbols(symbols: Array<Omit<SymbolInfo, "filePath">>): Array<Omit<SymbolInfo, "filePath">> {
  return uniqueBy(symbols, (symbol) => `${symbol.kind}:${symbol.name}:${symbol.line}`);
}
