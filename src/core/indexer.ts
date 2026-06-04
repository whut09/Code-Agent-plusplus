import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import type { IndexedFile, ImportEdge, ModuleInfo, RepoIndex, RepoScan, SymbolInfo } from "./types.js";
import { moduleNameFor } from "./path-utils.js";
import { javascriptAnalyzer } from "../analyzers/javascript.js";
import { pythonAnalyzer } from "../analyzers/python.js";
import { genericAnalyzer } from "../analyzers/generic.js";
import type { LanguageAnalyzer } from "../analyzers/types.js";

const ANALYZERS: LanguageAnalyzer[] = [
  javascriptAnalyzer,
  pythonAnalyzer,
  genericAnalyzer
];

export function indexRepository(scan: RepoScan): RepoIndex {
  const allPaths = new Set(scan.files.map((file) => file.path));
  const analysisContext = {
    allPaths,
    pathAliases: loadPathAliases(scan.root)
  };
  const files: IndexedFile[] = [];
  const imports: ImportEdge[] = [];
  const symbols: SymbolInfo[] = [];

  for (const file of scan.files) {
    const content = shouldRead(file.sizeBytes, file.isBinary)
      ? readFileSync(file.absolutePath, "utf8")
      : "";
    const analyzer = ANALYZERS.find((candidate) => candidate.supports(file)) ?? genericAnalyzer;
    const analysis = analyzer.analyze(file, content, analysisContext);
    const moduleName = moduleNameFor(file.path);

    const indexed: IndexedFile = {
      ...file,
      imports: analysis.imports,
      exports: analysis.exports,
      symbols: analysis.symbols,
      summary: analysis.summary,
      analyzer: analyzer.name,
      confidence: analysis.confidence,
      evidence: analysis.evidence,
      moduleName,
      importanceScore: 0,
      importanceReasons: []
    };

    files.push(indexed);
    symbols.push(...analysis.symbols);
    imports.push(...analysis.imports.map((importRef) => ({
      from: file.path,
      to: importRef.resolvedPath ?? importRef.specifier,
      specifier: importRef.specifier,
      isExternal: importRef.isExternal
    })));
  }

  return {
    files,
    imports,
    symbols,
    modules: buildModules(files, imports)
  };
}

function loadPathAliases(root: string): Array<{ pattern: string; targets: string[] }> {
  const configPath = ["tsconfig.json", "jsconfig.json"]
    .map((name) => path.join(root, name))
    .find(existsSync);
  if (!configPath) return [];

  try {
    const parsed = ts.parseConfigFileTextToJson(configPath, readFileSync(configPath, "utf8"));
    const compilerOptions = parsed.config?.compilerOptions as {
      baseUrl?: string;
      paths?: Record<string, string[]>;
    } | undefined;
    const baseUrl = compilerOptions?.baseUrl ?? ".";
    return Object.entries(compilerOptions?.paths ?? {}).map(([pattern, targets]) => ({
      pattern,
      targets: targets.map((target) => path.posix.normalize(path.posix.join(baseUrl.replaceAll("\\", "/"), target)))
    }));
  } catch {
    return [];
  }
}

function shouldRead(sizeBytes: number, isBinary: boolean): boolean {
  return !isBinary && sizeBytes <= 1024 * 1024;
}

function buildModules(files: IndexedFile[], imports: ImportEdge[]): ModuleInfo[] {
  const moduleMap = new Map<string, ModuleInfo>();

  for (const file of files) {
    const module = moduleMap.get(file.moduleName) ?? {
      name: file.moduleName,
      pathPrefix: file.moduleName === "root" ? "." : file.moduleName,
      files: [],
      imports: [],
      summary: "",
      importanceScore: 0
    };
    module.files.push(file.path);
    moduleMap.set(file.moduleName, module);
  }

  const fileToModule = new Map(files.map((file) => [file.path, file.moduleName]));
  for (const edge of imports) {
    if (edge.isExternal) continue;
    const fromModule = fileToModule.get(edge.from);
    const toModule = fileToModule.get(edge.to);
    if (!fromModule || !toModule || fromModule === toModule) continue;
    const module = moduleMap.get(fromModule);
    if (module && !module.imports.includes(toModule)) {
      module.imports.push(toModule);
    }
  }

  for (const module of moduleMap.values()) {
    module.files.sort();
    module.imports.sort();
    module.summary = `${module.name} contains ${module.files.length} file${module.files.length === 1 ? "" : "s"}${module.imports.length ? ` and depends on ${module.imports.join(", ")}` : ""}.`;
  }

  return [...moduleMap.values()].sort((a, b) => a.name.localeCompare(b.name));
}
