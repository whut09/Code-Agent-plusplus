import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import type { ContextCache } from "./cache.js";
import type { IndexedFile, ImportEdge, ModuleInfo, RepoIndex, RepoScan, SymbolInfo } from "./types.js";
import { moduleNameFor } from "./path-utils.js";
import { javascriptAnalyzer } from "../analyzers/javascript.js";
import { pythonAnalyzer } from "../analyzers/python.js";
import { genericAnalyzer } from "../analyzers/generic.js";
import type { LanguageAnalyzer } from "../analyzers/types.js";

const ANALYZERS: LanguageAnalyzer[] = [javascriptAnalyzer, pythonAnalyzer, genericAnalyzer];

export interface IndexRepositoryOptions {
  cache?: ContextCache | null;
  dependencyFingerprint?: string;
}

export function indexRepository(scan: RepoScan, options: IndexRepositoryOptions = {}): RepoIndex {
  const allPaths = new Set(scan.files.map((file) => file.path));
  const packagePrefixes = loadPackagePrefixes(scan.files.map((file) => file.path));
  const dependencyFingerprint = options.dependencyFingerprint ?? "";
  const analysisContext = {
    allPaths,
    pathAliases: [
      ...loadPathAliases(scan.root),
      ...loadPackageAliases(
        scan.root,
        scan.files.map((file) => file.path)
      )
    ]
  };
  const files: IndexedFile[] = [];
  const imports: ImportEdge[] = [];
  const symbols: SymbolInfo[] = [];

  for (const file of scan.files) {
    const analyzer = ANALYZERS.find((candidate) => candidate.supports(file)) ?? genericAnalyzer;
    const cached = options.cache?.getIndexedFile(file, dependencyFingerprint, analyzer.name);
    const indexed =
      cached ??
      (() => {
        const content = shouldRead(file.sizeBytes, file.isBinary) ? readFileSync(file.absolutePath, "utf8") : "";
        const analysis = analyzer.analyze(file, content, analysisContext);
        const moduleName = moduleNameFor(file.path, packagePrefixes);
        const analyzed: IndexedFile = {
          ...file,
          imports: analysis.imports,
          exports: analysis.exports,
          symbols: analysis.symbols,
          summary: analysis.summary,
          analyzer: analyzer.name,
          confidence: analysis.confidence,
          analysisStats: analysis.stats,
          evidence: analysis.evidence,
          moduleName,
          importanceScore: 0,
          importanceReasons: []
        };
        options.cache?.setIndexedFile(file, dependencyFingerprint, analyzer.name, analyzed);
        return analyzed;
      })();

    files.push(indexed);
    symbols.push(...indexed.symbols);
    imports.push(
      ...indexed.imports.map((importRef) => ({
        from: file.path,
        to: importRef.resolvedPath ?? importRef.specifier,
        specifier: importRef.specifier,
        isExternal: importRef.isExternal
      }))
    );
  }

  return {
    files,
    imports,
    symbols,
    modules: buildModules(files, imports)
  };
}

function loadPackageAliases(root: string, paths: string[]): Array<{ pattern: string; targets: string[] }> {
  const aliases: Array<{ pattern: string; targets: string[] }> = [];
  for (const packagePath of paths.filter((filePath) => filePath.endsWith("package.json"))) {
    const packageJson = readJson(path.join(root, packagePath));
    if (!packageJson) continue;
    const name = typeof packageJson?.name === "string" ? packageJson.name : null;
    if (!name) continue;

    const packageDir = path.posix.dirname(packagePath) === "." ? "" : path.posix.dirname(packagePath);
    const qualify = (target: string) => path.posix.normalize(path.posix.join(packageDir, stripPackageTarget(target)));
    const entryTargets = packageEntryTargets(packageJson);
    aliases.push({
      pattern: name,
      targets: entryTargets.length ? entryTargets.map(qualify) : [qualify("src/index"), qualify("index")]
    });
    aliases.push({
      pattern: `${name}/*`,
      targets: [qualify("src/*"), qualify("*")]
    });

    for (const alias of packageExportAliases(name, packageJson, qualify)) {
      aliases.push(alias);
    }
    for (const alias of packageImportAliases(packageJson, qualify)) {
      aliases.push(alias);
    }
  }

  return aliases;
}

function loadPackagePrefixes(paths: string[]): string[] {
  return paths
    .filter((filePath) => filePath.endsWith("package.json"))
    .map((filePath) => path.posix.dirname(filePath))
    .filter((dir) => dir !== ".")
    .sort((a, b) => b.length - a.length || a.localeCompare(b));
}

function readJson(filePath: string): Record<string, unknown> | null {
  try {
    return existsSync(filePath) ? (JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function packageEntryTargets(packageJson: Record<string, unknown>): string[] {
  const fields = [packageJson.source, packageJson.types, packageJson.module, packageJson.main];
  return fields.filter((field): field is string => typeof field === "string");
}

function packageExportAliases(
  name: string,
  packageJson: Record<string, unknown>,
  qualify: (target: string) => string
): Array<{ pattern: string; targets: string[] }> {
  const exportsValue = packageJson.exports;
  if (typeof exportsValue === "string") {
    return [{ pattern: name, targets: [qualify(exportsValue)] }];
  }
  if (!exportsValue || typeof exportsValue !== "object" || Array.isArray(exportsValue)) {
    return [];
  }

  const aliases: Array<{ pattern: string; targets: string[] }> = [];
  for (const [key, value] of Object.entries(exportsValue as Record<string, unknown>)) {
    const target = exportTarget(value);
    if (!target) continue;
    const subpath = key === "." ? "" : key.replace(/^\.\//, "/");
    aliases.push({
      pattern: `${name}${subpath}`,
      targets: [qualify(target)]
    });
  }
  return aliases;
}

function packageImportAliases(packageJson: Record<string, unknown>, qualify: (target: string) => string): Array<{ pattern: string; targets: string[] }> {
  const importsValue = packageJson.imports;
  if (!importsValue || typeof importsValue !== "object" || Array.isArray(importsValue)) {
    return [];
  }

  const aliases: Array<{ pattern: string; targets: string[] }> = [];
  for (const [key, value] of Object.entries(importsValue as Record<string, unknown>)) {
    if (!key.startsWith("#")) continue;
    const target = exportTarget(value);
    if (!target) continue;
    aliases.push({ pattern: key, targets: [qualify(target)] });
  }
  return aliases;
}

function exportTarget(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const candidate of value) {
      const target = exportTarget(candidate);
      if (target) return target;
    }
    return null;
  }
  if (!value || typeof value !== "object") return null;
  const object = value as Record<string, unknown>;
  for (const key of ["source", "import", "module", "require", "default", "types"]) {
    if (typeof object[key] === "string") return object[key];
  }
  return null;
}

function stripPackageTarget(target: string): string {
  return target.replace(/^\.\//, "");
}

function loadPathAliases(root: string): Array<{ pattern: string; targets: string[] }> {
  const configPath = ["tsconfig.json", "jsconfig.json"].map((name) => path.join(root, name)).find(existsSync);
  if (!configPath) return [];

  try {
    const parsed = ts.parseConfigFileTextToJson(configPath, readFileSync(configPath, "utf8"));
    const compilerOptions = parsed.config?.compilerOptions as
      | {
          baseUrl?: string;
          paths?: Record<string, string[]>;
        }
      | undefined;
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
