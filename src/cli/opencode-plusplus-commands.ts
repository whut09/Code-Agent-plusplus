import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { runOpencodeDoctor, type OpencodeDoctorCheck, type OpencodeDoctorReport } from "./opencode-preset.js";
import { OPENCODE_SIDECAR_PLUGIN_PATH } from "../integrations/opencode/sidecar-plugin-template.js";
import { verifyOpencodeSidecar } from "../integrations/opencode/sidecar.js";

export interface OpenCodePlusplusStatusReport {
  repo: string;
  active: boolean;
  pluginExists: boolean;
  contextExists: boolean;
  eventLogExists: boolean;
  latestExists: boolean;
  latestPath: string;
  latestMtime: string | null;
  blockers: string[];
}

export interface OpenCodePlusplusDoctorReport {
  repo: string;
  ok: boolean;
  checks: OpencodeDoctorCheck[];
}

export function readOpenCodePlusplusReport(repo = "."): { path: string; content: string; exists: boolean } {
  const root = path.resolve(repo);
  const reportPath = path.join(root, ".agent-context", "sidecar", "latest.md");
  if (!existsSync(reportPath)) {
    return {
      path: reportPath,
      content: [
        "OpenCode++ report is not available yet.",
        "",
        "Run `opencode-plusplus` to start OpenCode with the sidecar, or run `opencode-plusplus sidecar verify .` once to generate the first report."
      ].join("\n"),
      exists: false
    };
  }
  return { path: reportPath, content: readFileSync(reportPath, "utf8"), exists: true };
}

export function getOpenCodePlusplusStatus(repo = "."): OpenCodePlusplusStatusReport {
  const root = path.resolve(repo);
  const pluginPath = path.join(root, OPENCODE_SIDECAR_PLUGIN_PATH);
  const pluginExists = existsSync(pluginPath);
  const contextPath = path.join(root, ".agent-context");
  const eventLogPath = path.join(root, ".agent-context", "traces", "opencode-sidecar-events.jsonl");
  const latestPath = path.join(root, ".agent-context", "sidecar", "latest.json");
  const latest = readLatestJson(latestPath);
  const latestExists = existsSync(latestPath);
  const latestMtime = latestExists ? statSync(latestPath).mtime.toISOString() : null;
  const blockers = Array.isArray(latest?.blockers) ? latest.blockers.filter((item): item is string => typeof item === "string") : [];

  return {
    repo: root,
    active: pluginExists && existsSync(contextPath),
    pluginExists,
    contextExists: existsSync(contextPath),
    eventLogExists: existsSync(eventLogPath),
    latestExists,
    latestPath,
    latestMtime,
    blockers
  };
}

export async function runOpenCodePlusplusDoctor(repo = "."): Promise<OpenCodePlusplusDoctorReport> {
  const root = path.resolve(repo);
  const opencode = runOpencodeDoctor(root);
  const sidecar = await verifyOpencodeSidecar(root);
  const sidecarPluginCheck = sidecar.checks.find((check) => check.name.endsWith("opencode-plusplus.ts"));
  const sidecarChecks: OpencodeDoctorCheck[] = [
    {
      id: "sidecar-plugin",
      label: "OpenCode++ sidecar plugin",
      status: sidecarPluginCheck?.status === "pass" ? "pass" : "fail",
      details: sidecarPluginCheck?.details ?? "sidecar plugin check unavailable"
    },
    {
      id: "sidecar-hooks",
      label: "Sidecar hooks",
      status: sidecar.checks.filter((check) => ["file.edited hook", "session.idle hook"].includes(check.name)).every((check) => check.status === "pass")
        ? "pass"
        : "fail",
      details: "checks file.edited and session.idle hooks"
    },
    {
      id: "sidecar-latest",
      label: "Sidecar latest report",
      status: existsSync(sidecar.latestJsonPath) || existsSync(sidecar.latestMarkdownPath) ? "pass" : "warn",
      details: existsSync(sidecar.latestMarkdownPath)
        ? ".agent-context/sidecar/latest.md found"
        : "run `opencode-plusplus sidecar verify .` after starting a session"
    }
  ];
  const checks = [...opencode.checks, ...sidecarChecks];
  return { repo: root, ok: checks.every((check) => check.status !== "fail"), checks };
}

export function renderOpenCodePlusplusStatus(report: OpenCodePlusplusStatusReport): string {
  return [
    "OpenCode++ Status",
    "",
    `Repo: ${report.repo}`,
    `Sidecar: ${report.active ? "active" : "not active"}`,
    "",
    "Signals:",
    `- plugin: ${report.pluginExists ? "yes" : "no"}`,
    `- context: ${report.contextExists ? "yes" : "no"}`,
    `- event log: ${report.eventLogExists ? "yes" : "no"}`,
    `- latest report: ${report.latestExists ? "yes" : "no"}`,
    `- latest updated: ${report.latestMtime ?? "never"}`,
    "",
    "Blockers:",
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ["- none"]),
    "",
    "Next:",
    report.active ? "  opencode-plusplus report" : "  opencode-plusplus"
  ].join("\n");
}

export function renderOpenCodePlusplusDoctor(report: OpenCodePlusplusDoctorReport): string {
  return [
    "OpenCode++ Doctor",
    "",
    `Repo: ${report.repo}`,
    "",
    ...report.checks.map((check) => {
      const marker = check.status === "pass" ? "PASS" : check.status === "warn" ? "WARN" : "FAIL";
      const command = check.command ? `\n  Command: ${check.command}` : "";
      return `- [${marker}] ${check.label}: ${check.details}${command}`;
    }),
    "",
    report.ok ? "Result: ready for `opencode-plusplus`." : "Result: not ready. Fix failed checks before using `opencode-plusplus`."
  ].join("\n");
}

function readLatestJson(filePath: string): { blockers?: unknown } | null {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as { blockers?: unknown };
  } catch {
    return null;
  }
}
