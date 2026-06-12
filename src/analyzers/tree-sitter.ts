import { spawnSync } from "node:child_process";
import type { SymbolInfo } from "../core/types.js";

export interface TreeSitterPythonParseResult {
  imports: Array<{ specifier: string; line: number }>;
  symbols: Array<{ name: string; kind: SymbolInfo["kind"]; line: number }>;
}

const TREE_SITTER_PYTHON_SCRIPT = String.raw`
import json
import re
import sys

source = sys.stdin.buffer.read()
try:
    from tree_sitter import Language, Parser
    import tree_sitter_python
except Exception:
    sys.exit(42)

try:
    language = Language(tree_sitter_python.language())
except Exception:
    language = tree_sitter_python.language()

parser = Parser()
try:
    parser.language = language
except Exception:
    parser.set_language(language)

tree = parser.parse(source)
imports = []
symbols = []
route_methods = {"get", "post", "put", "patch", "delete", "options", "head"}

def text(node):
    return source[node.start_byte:node.end_byte].decode("utf8", "replace")

def line(node):
    return node.start_point[0] + 1

def child_text(node, field):
    child = node.child_by_field_name(field)
    return text(child) if child else None

def add_import(specifier, node):
    if specifier:
        imports.append({"specifier": specifier, "line": line(node)})

def add_symbol(name, kind, node):
    if name:
        symbols.append({"name": name, "kind": kind, "line": line(node)})

def route_from_decorator(node):
    raw = text(node).strip()
    match = re.search(r"\.?(get|post|put|patch|delete|options|head)\s*\(\s*['\"]([^'\"]*)['\"]", raw, re.I)
    if not match:
        return None
    route_path = match.group(2) or "/"
    if not route_path.startswith("/"):
        route_path = "/" + route_path
    return match.group(1).upper() + " " + route_path

def visit(node, decorators=None):
    decorators = decorators or []
    if node.type == "import_statement":
        raw = text(node)
        for part in raw.replace("import", "", 1).split(","):
            name = part.strip().split(" as ")[0].strip()
            add_import(name, node)
    elif node.type == "import_from_statement":
        raw = text(node)
        match = re.match(r"\s*from\s+([^\s]+)\s+import\s+(.+)", raw, re.S)
        if match:
            module = match.group(1).strip()
            names = [item.strip().split(" as ")[0] for item in match.group(2).split(",")]
            if re.fullmatch(r"\.+", module):
                for name in names:
                    add_import(module + name, node)
            else:
                add_import(module, node)
    elif node.type in ("function_definition", "class_definition"):
        name = child_text(node, "name")
        add_symbol(name, "function" if node.type == "function_definition" else "class", node)
        if node.type == "function_definition":
            for decorator in decorators:
                route = route_from_decorator(decorator)
                if route:
                    add_symbol(route, "route", decorator)
    elif node.type == "decorated_definition":
        local_decorators = [child for child in node.children if child.type == "decorator"]
        for child in node.children:
            if child.type != "decorator":
                visit(child, local_decorators)
        return

    for child in node.children:
        visit(child, decorators)

visit(tree.root_node)
if tree.root_node.has_error and not imports and not symbols:
    sys.exit(43)
print(json.dumps({"imports": imports, "symbols": symbols}))
`;

let treeSitterPythonUnavailable = false;

export function parsePythonWithTreeSitter(content: string): TreeSitterPythonParseResult | null {
  if (treeSitterPythonUnavailable) return null;

  let missingBackendSignals = 0;
  for (const candidate of pythonCandidates()) {
    const result = spawnSync(candidate.command, [...candidate.args, "-c", TREE_SITTER_PYTHON_SCRIPT], {
      input: content,
      encoding: "utf8",
      timeout: 5000,
      windowsHide: true
    });
    if (result.status === 42) {
      missingBackendSignals += 1;
      continue;
    }
    if (result.status !== 0 || !result.stdout) continue;
    try {
      const parsed = JSON.parse(result.stdout) as TreeSitterPythonParseResult;
      return {
        imports: uniqueBy(parsed.imports, (item) => item.specifier),
        symbols: uniqueSymbols(parsed.symbols)
      };
    } catch {
      continue;
    }
  }

  treeSitterPythonUnavailable = missingBackendSignals > 0;
  return null;
}

function pythonCandidates(): Array<{ command: string; args: string[] }> {
  return [
    { command: "python", args: [] },
    { command: "python3", args: [] },
    { command: "py", args: ["-3"] }
  ];
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

function uniqueSymbols(symbols: Array<{ name: string; kind: SymbolInfo["kind"]; line: number }>): Array<{ name: string; kind: SymbolInfo["kind"]; line: number }> {
  return uniqueBy(symbols, (symbol) => `${symbol.kind}:${symbol.name}:${symbol.line}`);
}
