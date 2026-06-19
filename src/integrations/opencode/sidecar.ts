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

  return {
    repo: root,
    ok: checks.every((check) => check.status !== "fail"),
    pluginPath,
    eventLogPath,
    checks
  };
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
    result.ok ? "Result: ready" : "Result: failed"
  ].join("\n");
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
