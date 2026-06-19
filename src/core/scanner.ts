import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import ignore from "ignore";
import type { OpenCodePlusplusConfig, RepoFile, RepoScan } from "./types.js";
import { classifyFile, isGeneratedPath, isTestPath } from "./file-classifier.js";
import { languageForExtension } from "./language.js";
import { estimateTokens } from "./token-estimator.js";
import { toPosixPath } from "./path-utils.js";

const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".pdf",
  ".zip",
  ".gz",
  ".woff",
  ".woff2",
  ".ttf",
  ".mp4",
  ".mp3",
  ".exe",
  ".dll"
]);

export async function scanRepository(root: string, config: OpenCodePlusplusConfig): Promise<RepoScan> {
  const absoluteRoot = path.resolve(root);
  const gitignore = loadGitignore(absoluteRoot);
  const entries = await fg(config.include, {
    cwd: absoluteRoot,
    dot: true,
    onlyFiles: true,
    unique: true,
    followSymbolicLinks: false,
    ignore: config.exclude
  });

  const files: RepoFile[] = entries
    .map(toPosixPath)
    .filter((filePath) => !gitignore.ignores(filePath))
    .map((filePath) => createRepoFile(absoluteRoot, filePath));

  const packageJson = readPackageJson(absoluteRoot);
  const languages = unique(files.map((file) => file.language).filter(Boolean) as string[]);
  const packageManagers = detectPackageManagers(files);
  const scriptRunner = packageManagers.find((manager) => ["pnpm", "yarn", "npm"].includes(manager)) ?? (packageJson ? "npm" : null);

  return {
    root: absoluteRoot,
    files,
    languages,
    frameworks: detectFrameworks(files, packageJson),
    packageManagers,
    configFiles: files.filter((file) => file.kind === "config").map((file) => file.path),
    entrypoints: detectEntrypoints(files, packageJson, absoluteRoot),
    testCommands: detectTestCommands(packageJson, scriptRunner),
    runCommands: detectRunCommands(packageJson, scriptRunner),
    lintCommands: detectNamedCommands(packageJson, scriptRunner, /lint|format/i),
    typecheckCommands: detectNamedCommands(packageJson, scriptRunner, /typecheck|type-check|check-types|tsc/i),
    ciFiles: files
      .filter((file) => file.path.startsWith(".github/workflows/") || /(^|\/)(gitlab-ci|Jenkinsfile|azure-pipelines)/i.test(file.path))
      .map((file) => file.path),
    envExampleFiles: files.filter((file) => /(^|\/)\.env(\.example|\.sample|\.template)$|(^|\/)env\.example$/i.test(file.path)).map((file) => file.path),
    migrationFiles: files.filter((file) => /(^|\/)(migrations?|prisma|db\/migrate)\//i.test(file.path)).map((file) => file.path)
  };
}

function createRepoFile(root: string, filePath: string): RepoFile {
  const absolutePath = path.join(root, filePath);
  const extension = path.extname(filePath);
  const stats = existsSync(absolutePath) ? statSync(absolutePath) : { size: 0 };
  const language = languageForExtension(extension);
  const isBinary = BINARY_EXTENSIONS.has(extension.toLowerCase());
  const kind = classifyFile(filePath, extension, language);

  return {
    path: filePath,
    absolutePath,
    extension,
    sizeBytes: stats.size,
    kind,
    language,
    tokenEstimate: estimateTokens(stats.size),
    isBinary,
    isGenerated: isGeneratedPath(filePath) || kind === "generated",
    isTest: isTestPath(filePath) || kind === "test"
  };
}

function loadGitignore(root: string): ReturnType<typeof ignore> {
  const ig = ignore();
  const gitignorePath = path.join(root, ".gitignore");
  if (existsSync(gitignorePath)) {
    ig.add(readFileSync(gitignorePath, "utf8"));
  }

  return ig;
}

function readPackageJson(root: string): Record<string, unknown> | null {
  const packagePath = path.join(root, "package.json");
  if (!existsSync(packagePath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(packagePath, "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function detectFrameworks(files: RepoFile[], packageJson: Record<string, unknown> | null): string[] {
  const deps = packageJson
    ? {
        ...objectValue(packageJson.dependencies),
        ...objectValue(packageJson.devDependencies)
      }
    : {};
  const names = new Set<string>();
  const fileSet = new Set(files.map((file) => file.path));

  if ("next" in deps || fileSet.has("next.config.js") || fileSet.has("next.config.mjs")) names.add("Next.js");
  if ("react" in deps) names.add("React");
  if ("vue" in deps) names.add("Vue");
  if ("svelte" in deps) names.add("Svelte");
  if ("express" in deps) names.add("Express");
  if ("fastify" in deps) names.add("Fastify");
  if ("vite" in deps || files.some((file) => file.path.startsWith("vite.config."))) names.add("Vite");
  if (fileSet.has("turbo.json")) names.add("Turborepo");
  if (fileSet.has("nx.json")) names.add("Nx");
  if (fileSet.has("pnpm-workspace.yaml")) names.add("pnpm Workspace");
  if (Array.isArray(packageJson?.workspaces) || typeof packageJson?.workspaces === "object") names.add("JavaScript Workspace");
  if (fileSet.has("pyproject.toml")) names.add("Python Project");
  if (fileSet.has("Cargo.toml")) names.add("Rust Cargo");
  if (fileSet.has("go.mod")) names.add("Go Module");

  return [...names].sort();
}

function detectPackageManagers(files: RepoFile[]): string[] {
  const fileSet = new Set(files.map((file) => file.path));
  const managers: string[] = [];

  if (fileSet.has("pnpm-lock.yaml")) managers.push("pnpm");
  if (fileSet.has("yarn.lock")) managers.push("yarn");
  if (fileSet.has("package-lock.json")) managers.push("npm");
  if (fileSet.has("poetry.lock")) managers.push("poetry");
  if (fileSet.has("requirements.txt")) managers.push("pip");
  if (fileSet.has("Cargo.toml")) managers.push("cargo");
  if (fileSet.has("go.mod")) managers.push("go");

  return managers;
}

function detectEntrypoints(files: RepoFile[], packageJson: Record<string, unknown> | null, root: string): string[] {
  const candidates = new Set<string>();
  const fileSet = new Set(files.map((file) => file.path));
  const common = [
    "src/main.ts",
    "src/index.ts",
    "src/app.ts",
    "src/server.ts",
    "src/main.py",
    "app.py",
    "main.py",
    "cmd/main.go",
    "main.go",
    "src/main.rs",
    "src/lib.rs"
  ];

  for (const candidate of common) {
    if (fileSet.has(candidate)) {
      candidates.add(candidate);
    }
  }

  const main = packageJson?.main;
  if (typeof main === "string" && fileSet.has(main)) {
    candidates.add(main);
  }

  const scripts = objectValue(packageJson?.scripts);
  for (const value of Object.values(scripts)) {
    if (typeof value !== "string") continue;
    for (const file of files) {
      if ((file.kind === "source" || file.kind === "test") && value.includes(file.path)) {
        candidates.add(file.path);
      }
    }
  }

  for (const entrypoint of detectPythonEntrypoints(root)) {
    candidates.add(entrypoint);
  }

  return [...candidates];
}

function detectPythonEntrypoints(root: string): string[] {
  const pyprojectPath = path.join(root, "pyproject.toml");
  if (!existsSync(pyprojectPath)) return [];

  try {
    const lines = readFileSync(pyprojectPath, "utf8").split(/\r?\n/);
    const sections = new Set(["project.scripts", "tool.poetry.scripts", "project.entry-points.console_scripts", "tool.poetry.plugins.console_scripts"]);
    const entrypoints: string[] = [];
    let section: string | null = null;
    for (const line of lines) {
      const sectionMatch = line.match(/^\[(.+)\]$/);
      if (sectionMatch) {
        section = sectionMatch[1];
        continue;
      }
      if (!section || !sections.has(section)) continue;
      const match = line.match(/^\s*([A-Za-z0-9_.-]+)\s*=\s*["']([^"']+)["']\s*$/);
      if (match) {
        entrypoints.push(`pyproject.toml:${match[1]} -> ${match[2]}`);
      }
    }
    return [...new Set(entrypoints)].sort();
  } catch {
    return [];
  }
}

function detectTestCommands(packageJson: Record<string, unknown> | null, scriptRunner: string | null): string[] {
  const scripts = objectValue(packageJson?.scripts);
  return Object.entries(scripts)
    .filter(([name]) => /test|spec|coverage|e2e|integration/i.test(name))
    .map(([name]) => formatScriptCommand(scriptRunner, name));
}

function detectRunCommands(packageJson: Record<string, unknown> | null, scriptRunner: string | null): string[] {
  const scripts = objectValue(packageJson?.scripts);
  return Object.entries(scripts)
    .filter(([name]) => /^(dev|start|serve|preview)$/i.test(name))
    .map(([name]) => formatScriptCommand(scriptRunner, name));
}

function detectNamedCommands(packageJson: Record<string, unknown> | null, scriptRunner: string | null, pattern: RegExp): string[] {
  const scripts = objectValue(packageJson?.scripts);
  return Object.entries(scripts)
    .filter(([name, command]) => pattern.test(name) || (typeof command === "string" && pattern.test(command)))
    .map(([name]) => formatScriptCommand(scriptRunner, name));
}

function formatScriptCommand(scriptRunner: string | null, scriptName: string): string {
  if (scriptRunner === "yarn") {
    return `yarn ${scriptName}`;
  }

  return `${scriptRunner ?? "npm"} run ${scriptName}`;
}

function objectValue(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value ? (value as Record<string, unknown>) : {};
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)].sort();
}
