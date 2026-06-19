import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { runGit } from "../../core/git.js";
import { OPENCODE_SIDECAR_PLUGIN_PATH, opencodeSidecarPluginTemplate } from "./sidecar-plugin-template.js";

export interface OpenCodeSidecarEnsureOptions {
  force?: boolean;
  dryRun?: boolean;
}

export interface OpenCodeSidecarStep {
  name: string;
  status: "pass" | "warn" | "fail" | "skipped";
  details: string;
}

export interface OpenCodeSidecarVerifyCheck {
  name: string;
  status: "pass" | "warn" | "fail";
  details: string;
}

export interface OpenCodeSidecarVerifyResult {
  repo: string;
  ok: boolean;
  pluginPath: string;
  eventLogPath: string;
  latestJsonPath: string;
  latestMarkdownPath: string;
  generatedAt: string;
  changedFiles: string[];
  blockers: string[];
  warnings: string[];
  checks: OpenCodeSidecarVerifyCheck[];
}

export function ensureOpencodeSidecarPlugin(repo: string, options: OpenCodeSidecarEnsureOptions = {}): OpenCodeSidecarStep {
  const filePath = path.join(path.resolve(repo), OPENCODE_SIDECAR_PLUGIN_PATH);
  if (existsSync(filePath) && !options.force) {
    return { name: "sidecar-plugin", status: "pass", details: `${OPENCODE_SIDECAR_PLUGIN_PATH} already exists` };
  }

  if (options.dryRun) {
    return {
      name: "sidecar-plugin",
      status: existsSync(filePath) ? "warn" : "pass",
      details: existsSync(filePath) ? `${OPENCODE_SIDECAR_PLUGIN_PATH} would be overwritten with --force` : `${OPENCODE_SIDECAR_PLUGIN_PATH} would be generated`
    };
  }

  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, opencodeSidecarPluginTemplate(), "utf8");
  return { name: "sidecar-plugin", status: "pass", details: `${OPENCODE_SIDECAR_PLUGIN_PATH} generated` };
}

export function verifyOpencodeSidecar(repo = "."): OpenCodeSidecarVerifyResult {
  const root = path.resolve(repo);
  const pluginPath = path.join(root, OPENCODE_SIDECAR_PLUGIN_PATH);
  const eventLogPath = path.join(root, ".agent-context", "traces", "opencode-sidecar-events.jsonl");
  const latestJsonPath = path.join(root, ".agent-context", "sidecar", "latest.json");
  const latestMarkdownPath = path.join(root, ".agent-context", "sidecar", "latest.md");
  const generatedAt = new Date().toISOString();
  const checks: OpenCodeSidecarVerifyCheck[] = [];

  checks.push(checkGitRepo(root));
  checks.push(checkExists(".agent-context", path.join(root, ".agent-context"), "Code Agent++ context directory exists"));
  checks.push(checkExists(OPENCODE_SIDECAR_PLUGIN_PATH, pluginPath, "OpenCode sidecar plugin exists"));

  if (existsSync(pluginPath)) {
    const source = readFileSync(pluginPath, "utf8");
    checks.push(checkSource("plugin-export", source, /CodeAgentPlusPlusSidecar/, "exports CodeAgentPlusPlusSidecar"));
    checks.push(checkSource("file.edited hook", source, /file\.edited/, "listens for file.edited events"));
    checks.push(checkSource("session.idle hook", source, /session\.idle/, "listens for session.idle events"));
  }

  checks.push(
    existsSync(eventLogPath)
      ? { name: "sidecar-event-log", status: "pass", details: `${path.relative(root, eventLogPath)} exists` }
      : { name: "sidecar-event-log", status: "warn", details: "no sidecar event log yet; start OpenCode with capp and trigger a session/edit first" }
  );

  const changedFiles = collectCurrentChangedFiles(root);
  const blockers = detectBlockers(changedFiles);
  const warnings = detectWarnings(changedFiles);
  checks.push({
    name: "current-diff",
    status: blockers.length ? "fail" : "pass",
    details: changedFiles.length ? `${changedFiles.length} changed file(s), ${blockers.length} blocker(s)` : "no source diff detected"
  });

  const ok = checks.every((check) => check.status !== "fail");
  return {
    repo: root,
    ok,
    pluginPath,
    eventLogPath,
    latestJsonPath,
    latestMarkdownPath,
    generatedAt,
    changedFiles,
    blockers,
    warnings,
    checks
  };
}

export function writeOpencodeSidecarLatest(result: OpenCodeSidecarVerifyResult): void {
  mkdirSync(path.dirname(result.latestJsonPath), { recursive: true });
  writeFileSync(result.latestJsonPath, `${JSON.stringify(toPersistedSidecarResult(result), null, 2)}\n`, "utf8");
  writeFileSync(result.latestMarkdownPath, `${renderOpencodeSidecarLatestMarkdown(result)}\n`, "utf8");
}

export function renderOpencodeSidecarVerifyReport(result: OpenCodeSidecarVerifyResult): string {
  return [
    "Code Agent++ OpenCode Sidecar Verify",
    "",
    `Repo: ${result.repo}`,
    `Plugin: ${path.relative(result.repo, result.pluginPath)}`,
    `Event log: ${path.relative(result.repo, result.eventLogPath)}`,
    "",
    "Checks:",
    ...result.checks.map((check) => `- [${check.status.toUpperCase()}] ${check.name}: ${check.details}`),
    "",
    "Changed files:",
    ...(result.changedFiles.length ? result.changedFiles.map((file) => `- ${file}`) : ["- none"]),
    "",
    "Blockers:",
    ...(result.blockers.length ? result.blockers.map((blocker) => `- ${blocker}`) : ["- none"]),
    "",
    "Warnings:",
    ...(result.warnings.length ? result.warnings.map((warning) => `- ${warning}`) : ["- none"]),
    "",
    result.ok ? "Result: ready" : "Result: failed"
  ].join("\n");
}

export function renderOpencodeSidecarLatestMarkdown(result: OpenCodeSidecarVerifyResult): string {
  return [
    "# Code Agent++ Sidecar Latest",
    "",
    `Generated: ${result.generatedAt}`,
    `Result: ${result.ok ? "ready" : "blocked"}`,
    "",
    "## Changed Files",
    ...(result.changedFiles.length ? result.changedFiles.map((file) => `- \`${file}\``) : ["- none"]),
    "",
    "## Blockers",
    ...(result.blockers.length ? result.blockers.map((blocker) => `- ${blocker}`) : ["- none"]),
    "",
    "## Warnings",
    ...(result.warnings.length ? result.warnings.map((warning) => `- ${warning}`) : ["- none"]),
    "",
    "## Checks",
    ...result.checks.map((check) => `- **${check.status.toUpperCase()}** ${check.name}: ${check.details}`)
  ].join("\n");
}

function toPersistedSidecarResult(result: OpenCodeSidecarVerifyResult): Omit<
  OpenCodeSidecarVerifyResult,
  "pluginPath" | "eventLogPath" | "latestJsonPath" | "latestMarkdownPath"
> & {
  pluginPath: string;
  eventLogPath: string;
  latestJsonPath: string;
  latestMarkdownPath: string;
} {
  return {
    ...result,
    pluginPath: path.relative(result.repo, result.pluginPath),
    eventLogPath: path.relative(result.repo, result.eventLogPath),
    latestJsonPath: path.relative(result.repo, result.latestJsonPath),
    latestMarkdownPath: path.relative(result.repo, result.latestMarkdownPath)
  };
}

function checkGitRepo(repo: string): OpenCodeSidecarVerifyCheck {
  try {
    const inside = runGit(repo, ["rev-parse", "--is-inside-work-tree"]).trim() === "true";
    return inside ? { name: "git", status: "pass", details: "inside git repository" } : { name: "git", status: "fail", details: "not inside git repository" };
  } catch (error) {
    return { name: "git", status: "fail", details: error instanceof Error ? error.message : String(error) };
  }
}

function checkExists(name: string, absolutePath: string, okDetails: string): OpenCodeSidecarVerifyCheck {
  return existsSync(absolutePath) ? { name, status: "pass", details: okDetails } : { name, status: "fail", details: `${absolutePath} is missing` };
}

function checkSource(name: string, source: string, pattern: RegExp, okDetails: string): OpenCodeSidecarVerifyCheck {
  return pattern.test(source) ? { name, status: "pass", details: okDetails } : { name, status: "fail", details: `${name} missing from generated plugin` };
}

function collectCurrentChangedFiles(root: string): string[] {
  try {
    const changed = runGit(root, ["diff", "--name-only"]);
    const staged = runGit(root, ["diff", "--cached", "--name-only"]);
    const untracked = runGit(root, ["ls-files", "--others", "--exclude-standard"]);
    return [
      ...new Set([...parseGitPathList(changed), ...parseGitPathList(staged), ...parseGitPathList(untracked)].filter((file) => !isGeneratedSidecarOutput(file)))
    ].sort();
  } catch {
    return [];
  }
}

function parseGitPathList(output: string): string[] {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\\/g, "/"))
    .filter(Boolean);
}

function isGeneratedSidecarOutput(filePath: string): boolean {
  return filePath === ".agent-context/sidecar/latest.json" || filePath === ".agent-context/sidecar/latest.md";
}

function detectBlockers(files: string[]): string[] {
  const blockers: string[] = [];
  for (const file of files) {
    if (file.startsWith(".agent-context/") && !isGeneratedSidecarOutput(file)) blockers.push(`Generated context changed: ${file}`);
    if (file === "AGENTS.md") blockers.push("Generated AGENTS.md changed; regenerate context intentionally before finalizing.");
    if (isSecretLike(file)) blockers.push(`Secret/local configuration path changed: ${file}`);
    if (isLockfile(file) && !hasPackageManifest(files)) blockers.push(`Lockfile changed without a package manifest change: ${file}`);
  }
  return [...new Set(blockers)];
}

function detectWarnings(files: string[]): string[] {
  const warnings: string[] = [];
  for (const file of files) {
    if (isCiOrDeploy(file)) warnings.push(`CI/deploy configuration changed: ${file}`);
    if (isMigration(file)) warnings.push(`Migration/schema file changed: ${file}`);
  }
  return [...new Set(warnings)];
}

function isSecretLike(file: string): boolean {
  return /(^|\/)(\.env|.*\.local\.(yml|yaml|json)|code-agent-plusplus\.local\.yml)$/i.test(file);
}

function isLockfile(file: string): boolean {
  return /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb|poetry\.lock|Cargo\.lock|Gemfile\.lock)$/i.test(file);
}

function hasPackageManifest(files: string[]): boolean {
  return files.some((file) => /(^|\/)(package\.json|pyproject\.toml|Cargo\.toml|Gemfile|go\.mod)$/i.test(file));
}

function isCiOrDeploy(file: string): boolean {
  return file.startsWith(".github/workflows/") || /(^|\/)(Dockerfile|docker-compose\.ya?ml|fly\.toml|vercel\.json|netlify\.toml)$/i.test(file);
}

function isMigration(file: string): boolean {
  return /(^|\/)(migrations?|prisma|schema)\/|schema\.(sql|prisma)$/i.test(file);
}
