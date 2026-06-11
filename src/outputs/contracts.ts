import type { ContextPackage, IndexedFile, ModuleInfo } from "../core/types.js";

export interface RepoContracts {
  architecture: unknown;
  moduleBoundaries: unknown;
  commands: unknown;
  test: unknown;
  safety: unknown;
}

export function buildRepoContracts(context: ContextPackage): RepoContracts {
  return {
    architecture: buildArchitectureContract(context),
    moduleBoundaries: buildModuleBoundariesContract(context),
    commands: buildCommandsContract(context),
    test: buildTestContract(context),
    safety: buildSafetyContract(context)
  };
}

function buildArchitectureContract(context: ContextPackage): unknown {
  return {
    schemaVersion: 1,
    kind: "architecture-contract",
    purpose: "Constrain coding agents to preserve the detected repository architecture and dependency shape.",
    languages: context.scan.languages,
    frameworks: context.scan.frameworks,
    packageManagers: context.scan.packageManagers,
    entrypoints: context.scan.entrypoints,
    modules: context.index.modules.map((module) => ({
      name: module.name,
      owns: moduleOwns(module),
      imports: module.imports,
      summary: module.summary
    })),
    rules: [
      "Preserve detected entrypoints unless the task explicitly changes application wiring.",
      "Prefer extending existing modules over creating new top-level architecture.",
      "Do not add cross-module dependencies that are absent from module-boundaries.json without task-specific justification.",
      "Run commands from commands.contract.json after source or configuration edits."
    ]
  };
}

function buildModuleBoundariesContract(context: ContextPackage): unknown {
  const modules = Object.fromEntries(context.index.modules
    .filter((module) => module.name !== "root")
    .map((module) => [module.name, {
      owns: moduleOwns(module),
      allowedImports: allowedImportsFor(context, module),
      forbiddenImports: forbiddenImportsFor(context, module),
      observedImports: module.imports,
      publicFiles: publicFilesFor(context, module)
    }]));

  return {
    schemaVersion: 1,
    kind: "module-boundaries",
    purpose: "Constrain coding agents from crossing module ownership boundaries without explicit task justification.",
    modules,
    globalRules: [
      "Do not edit files outside the owning module unless listed in the task plan or impact report.",
      "Do not introduce imports from forbiddenImports.",
      "Prefer existing public files and exported symbols before reaching into another module internals.",
      "If a new cross-module import is required, update tests that cover both source and dependent modules."
    ]
  };
}

function buildCommandsContract(context: ContextPackage): unknown {
  return {
    schemaVersion: 1,
    kind: "commands-contract",
    run: context.scan.runCommands,
    test: context.scan.testCommands,
    lint: context.scan.lintCommands,
    typecheck: context.scan.typecheckCommands,
    requiredAfterChange: {
      source: requiredCommands(context, ["test", "typecheck"]),
      tests: requiredCommands(context, ["test"]),
      config: requiredCommands(context, ["typecheck", "lint", "test"]),
      docs: []
    },
    rules: [
      "Run the nearest focused test first when the task or impact report identifies a module.",
      "Run typecheck after TypeScript or configuration edits when a typecheck command exists.",
      "Do not skip validation because generated context appears sufficient."
    ]
  };
}

function buildTestContract(context: ContextPackage): unknown {
  const sourceFiles = context.index.files.filter((file) => file.kind === "source" && !file.isTest);
  const testFiles = context.index.files.filter((file) => file.isTest);
  return {
    schemaVersion: 1,
    kind: "test-contract",
    commands: context.scan.testCommands,
    testFiles: testFiles.map((file) => file.path),
    sourceToRelatedTests: Object.fromEntries(sourceFiles.map((file) => [file.path, relatedTestsFor(file, testFiles).map((test) => test.path)])),
    rules: [
      "When changing source behavior, update or add a related test unless the task explicitly says tests are out of scope.",
      "Do not remove or bypass existing tests to make a task pass.",
      "If no related test is detected, document the manual verification path in the final response."
    ]
  };
}

function buildSafetyContract(context: ContextPackage): unknown {
  const protectedFiles = context.index.files.filter((file) => file.isGenerated || file.kind === "lockfile" || context.scan.migrationFiles.includes(file.path));
  return {
    schemaVersion: 1,
    kind: "safety-contract",
    protectedPaths: {
      generated: context.index.files.filter((file) => file.isGenerated).map((file) => file.path),
      lockfiles: context.index.files.filter((file) => file.kind === "lockfile").map((file) => file.path),
      migrations: context.scan.migrationFiles,
      envExamples: context.scan.envExampleFiles,
      ci: context.scan.ciFiles
    },
    protectedFileCount: protectedFiles.length,
    rules: [
      "Do not edit generated files unless the task explicitly asks to regenerate artifacts.",
      "Do not edit lockfiles unless dependency changes are required and explained.",
      "Do not change migrations, schemas, CI, deployment, or env files unless they are in scope for the task.",
      "Do not introduce new global dependencies when local module code can satisfy the task.",
      "Use repo-context impact --base <ref> after edits to identify affected dependents and required verification."
    ]
  };
}

function moduleOwns(module: ModuleInfo): string[] {
  const root = moduleRoot(module);
  if (!root || root === ".") return ["*"];
  return [`${root.replace(/\/$/, "")}/**`];
}

function moduleRoot(module: ModuleInfo): string {
  const dirs = module.files
    .map((file) => file.split("/").slice(0, -1).join("/"))
    .filter(Boolean);
  const prefix = module.pathPrefix.replace(/\/$/, "");
  const matchingDir = dirs
    .filter((dir) => dir === prefix || dir.endsWith(`/${prefix}`))
    .sort((a, b) => a.length - b.length)[0];
  return matchingDir ?? prefix;
}

function allowedImportsFor(context: ContextPackage, module: ModuleInfo): string[] {
  const own = moduleOwns(module);
  const observed = module.imports
    .map((name) => context.index.modules.find((candidate) => candidate.name === name))
    .filter((candidate): candidate is ModuleInfo => Boolean(candidate))
    .flatMap(moduleOwns);
  const common = context.index.modules
    .filter((candidate) => /^(core|config|shared|common|utils?|lib)$/i.test(candidate.name.split("/").pop() ?? candidate.name))
    .flatMap(moduleOwns);
  return sortedUnique([...own, ...observed, ...common]);
}

function forbiddenImportsFor(context: ContextPackage, module: ModuleInfo): string[] {
  const moduleName = module.name.toLowerCase();
  const sensitive = context.index.modules
    .filter((candidate) => candidate.name !== module.name)
    .filter((candidate) => /(^|\/)(admin|payment|payments|billing|checkout|invoice|secret|secrets)(\/|$)/i.test(candidate.name) || /(^|\/)(admin|payment|payments|billing|checkout|invoice|secret|secrets)(\/|$)/i.test(candidate.pathPrefix))
    .filter((candidate) => !module.imports.includes(candidate.name))
    .flatMap(moduleOwns);

  const defaults = [
    "**/*.generated.*",
    "**/generated/**",
    "dist/**",
    "build/**"
  ];
  if (!/admin|payment|billing|checkout|invoice/.test(moduleName)) {
    defaults.push("src/admin/**", "src/payment/**", "src/payments/**", "src/billing/**");
  }
  return sortedUnique([...sensitive, ...defaults]);
}

function publicFilesFor(context: ContextPackage, module: ModuleInfo): string[] {
  const files = new Set(module.files.filter((file) => /(^|\/)(index|main|public|api)\.[cm]?[jt]sx?$/i.test(file)));
  for (const file of context.index.files) {
    if (module.files.includes(file.path) && file.exports.length > 0) files.add(file.path);
  }
  return [...files].sort();
}

function requiredCommands(context: ContextPackage, kinds: Array<"test" | "typecheck" | "lint">): string[] {
  const commands: string[] = [];
  if (kinds.includes("test")) commands.push(...context.scan.testCommands.slice(0, 2));
  if (kinds.includes("typecheck")) commands.push(...context.scan.typecheckCommands.slice(0, 1));
  if (kinds.includes("lint")) commands.push(...context.scan.lintCommands.slice(0, 1));
  return sortedUnique(commands);
}

function relatedTestsFor(source: IndexedFile, tests: IndexedFile[]): IndexedFile[] {
  const sourcePath = source.path.toLowerCase();
  const baseName = source.path.split("/").pop()?.replace(/\.[^.]+$/, "").toLowerCase() ?? "";
  return tests.filter((testFile) => {
    const testPath = testFile.path.toLowerCase();
    return testFile.imports.some((item) => item.resolvedPath === source.path)
      || (baseName.length >= 3 && testPath.includes(baseName))
      || (source.moduleName !== "root" && source.moduleName !== "test" && testPath.includes(source.moduleName.toLowerCase()))
      || sourcePath.split("/").some((segment) => segment.length >= 4 && testPath.includes(segment));
  });
}

function sortedUnique(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))].sort();
}