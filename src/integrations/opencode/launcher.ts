import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildContextPackage } from "../../core/context-builder.js";
import { runGit } from "../../core/git.js";
import { runSafeCommand } from "../../core/safe-command.js";
import { writeContextPackage } from "../../outputs/renderers/writer.js";
import { initOpencodeProject } from "./project-init.js";
import { OPENCODE_SIDECAR_PLUGIN_PATH, opencodeSidecarPluginTemplate } from "./sidecar-plugin-template.js";

export interface OpenCodeLauncherOptions {
  repo?: string;
  forcePlugin?: boolean;
  skipContext?: boolean;
  dryRun?: boolean;
}

export interface OpenCodeLauncherStep {
  name: string;
  status: "pass" | "warn" | "fail" | "skipped";
  details: string;
}

export interface OpenCodeLauncherResult {
  repo: string;
  steps: OpenCodeLauncherStep[];
  command: string[];
  launched: boolean;
  exitCode: number | null;
}

export async function launchOpenCodeWithSidecar(options: OpenCodeLauncherOptions = {}): Promise<OpenCodeLauncherResult> {
  const repo = path.resolve(options.repo ?? ".");
  const steps: OpenCodeLauncherStep[] = [];
  const opencode = checkCommand("opencode --version", repo);
  steps.push({
    name: "opencode",
    status: opencode.ok ? "pass" : "fail",
    details: opencode.ok ? opencode.details : `OpenCode is not available: ${opencode.details}`
  });

  const git = checkGitRepo(repo);
  steps.push({
    name: "git",
    status: git.ok ? "pass" : "fail",
    details: git.ok ? "inside git repository" : git.error
  });

  if (steps.some((step) => step.status === "fail")) {
    return { repo, steps, command: ["opencode", repo], launched: false, exitCode: 1 };
  }

  const contextDir = path.join(repo, ".agent-context");
  if (options.skipContext) {
    steps.push({ name: "context", status: "skipped", details: "context generation skipped by option" });
  } else if (existsSync(contextDir)) {
    steps.push({ name: "context", status: "pass", details: ".agent-context already exists" });
  } else {
    const context = await buildContextPackage(repo);
    const written = writeContextPackage(context);
    steps.push({ name: "context", status: "pass", details: `generated ${written.files.length} context file(s)` });
  }

  const opencodeInit = initOpencodeProject(repo, { dryRun: options.dryRun });
  const skipped = opencodeInit.files.filter((file) => file.status === "skipped").length;
  const wouldWrite = opencodeInit.files.filter((file) => file.status === "would-write").length;
  steps.push({
    name: "opencode-project",
    status: "pass",
    details: wouldWrite
      ? `OpenCode commands/agent would be generated (${wouldWrite} file(s))`
      : skipped
        ? `OpenCode commands/agent ready (${skipped} existing file(s) preserved)`
        : "OpenCode commands/agent generated"
  });

  const plugin = ensureSidecarPlugin(repo, { force: options.forcePlugin, dryRun: options.dryRun });
  steps.push(plugin);

  const command = ["opencode", repo];
  if (options.dryRun) {
    return { repo, steps, command, launched: false, exitCode: 0 };
  }

  const result = spawnOpenCodeTui(repo);
  return { repo, steps, command, launched: true, exitCode: typeof result.status === "number" ? result.status : result.error ? 1 : null };
}

export function renderOpenCodeLauncherResult(result: OpenCodeLauncherResult): string {
  return [
    "Code Agent++ OpenCode TUI",
    "",
    `Repo: ${result.repo}`,
    "",
    "Preflight:",
    ...result.steps.map((step) => `- [${step.status.toUpperCase()}] ${step.name}: ${step.details}`),
    "",
    `Command: ${result.command.join(" ")}`,
    result.launched ? `Exit code: ${result.exitCode ?? "unknown"}` : "Launch: skipped"
  ].join("\n");
}

function ensureSidecarPlugin(repo: string, options: { force?: boolean; dryRun?: boolean }): OpenCodeLauncherStep {
  const filePath = path.join(repo, OPENCODE_SIDECAR_PLUGIN_PATH);
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

function checkCommand(command: string, cwd: string): { ok: boolean; details: string } {
  const result = runSafeCommand(command, { cwd, encoding: "utf8", maxBuffer: 1024 * 1024 });
  const output = `${result.stdout}\n${result.stderr}`.trim().split(/\r?\n/).find(Boolean) ?? "";
  return { ok: result.status === 0 && !result.error, details: output || result.error?.message || `exit ${result.status ?? "unknown"}` };
}

function checkGitRepo(repo: string): { ok: boolean; error: string } {
  try {
    return { ok: runGit(repo, ["rev-parse", "--is-inside-work-tree"]).trim() === "true", error: "" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function spawnOpenCodeTui(repo: string): ReturnType<typeof spawnSync> {
  const result = spawnSync("opencode", [repo], { cwd: repo, stdio: "inherit", shell: false });
  if (!shouldTryWindowsCmdFallback(result.error)) return result;
  return spawnSync("cmd.exe", ["/d", "/s", "/c", `opencode.cmd ${windowsCmdQuote(repo)}`], { cwd: repo, stdio: "inherit", shell: false });
}

function shouldTryWindowsCmdFallback(error: Error | undefined): boolean {
  return process.platform === "win32" && Boolean(error && "code" in error && (error as NodeJS.ErrnoException).code === "ENOENT");
}

function windowsCmdQuote(value: string): string {
  if (value && !/[\s"&|<>^]/.test(value)) return value;
  return `"${value.replace(/(["^])/g, "^$1")}"`;
}
