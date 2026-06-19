import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { runOpencodeDoctor, type OpencodeDoctorCheck, type OpencodeDoctorReport } from "./opencode-preset.js";
import { OPENCODE_SIDECAR_PLUGIN_PATH } from "../integrations/opencode/sidecar-plugin-template.js";
import { verifyOpencodeSidecar } from "../integrations/opencode/sidecar.js";

export interface CappStatusReport {
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

export interface CappDoctorReport {
  repo: string;
  ok: boolean;
  checks: OpencodeDoctorCheck[];
}

export function readCappReport(repo = "."): { path: string; content: string; exists: boolean } {
  const root = path.resolve(repo);
  const reportPath = path.join(root, ".agent-context", "sidecar", "latest.md");
  if (!existsSync(reportPath)) {
    return {
      path: reportPath,
      content: [
        "Code Agent++ report is not available yet.",
        "",
        "Run `capp` to start OpenCode with the sidecar, or run `capp sidecar verify .` once to generate the first report."
      ].join("\n"),
      exists: false
    };
  }
  return { path: reportPath, content: readFileSync(reportPath, "utf8"), exists: true };
}

export function getCappStatus(repo = "."): CappStatusReport {
  const root = path.resolve(repo);
  const pluginPath = path.join(root, OPENCODE_SIDECAR_PLUGIN_PATH);
  const contextPath = path.join(root, ".agent-context");
  const eventLogPath = path.join(root, ".agent-context", "traces", "opencode-sidecar-events.jsonl");
  const latestPath = path.join(root, ".agent-context", "sidecar", "latest.json");
  const latest = readLatestJson(latestPath);
  const latestExists = existsSync(latestPath);
  const latestMtime = latestExists ? statSync(latestPath).mtime.toISOString() : null;
  const blockers = Array.isArray(latest?.blockers) ? latest.blockers.filter((item): item is string => typeof item === "string") : [];

  return {
    repo: root,
    active: existsSync(pluginPath) && existsSync(contextPath),
    pluginExists: existsSync(pluginPath),
    contextExists: existsSync(contextPath),
    eventLogExists: existsSync(eventLogPath),
    latestExists,
    latestPath,
    latestMtime,
    blockers
  };
}

export async function runCappDoctor(repo = "."): Promise<CappDoctorReport> {
  const root = path.resolve(repo);
  const opencode = runOpencodeDoctor(root);
  const sidecar = await verifyOpencodeSidecar(root);
  const sidecarChecks: OpencodeDoctorCheck[] = [
    {
      id: "sidecar-plugin",
      label: "Code Agent++ sidecar plugin",
      status: sidecar.checks.some((check) => check.name === OPENCODE_SIDECAR_PLUGIN_PATH && check.status === "pass") ? "pass" : "fail",
      details: sidecar.checks.find((check) => check.name === OPENCODE_SIDECAR_PLUGIN_PATH)?.details ?? "sidecar plugin check unavailable"
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
      details: existsSync(sidecar.latestMarkdownPath) ? ".agent-context/sidecar/latest.md found" : "run `capp sidecar verify .` after starting a session"
    }
  ];
  const checks = [...opencode.checks, ...sidecarChecks];
  return { repo: root, ok: checks.every((check) => check.status !== "fail"), checks };
}

export function renderCappStatus(report: CappStatusReport): string {
  return [
    "Code Agent++ Status",
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
    report.active ? "  capp report" : "  capp"
  ].join("\n");
}

export function renderCappDoctor(report: CappDoctorReport): string {
  return [
    "Code Agent++ Doctor",
    "",
    `Repo: ${report.repo}`,
    "",
    ...report.checks.map((check) => {
      const marker = check.status === "pass" ? "PASS" : check.status === "warn" ? "WARN" : "FAIL";
      const command = check.command ? `\n  Command: ${check.command}` : "";
      return `- [${marker}] ${check.label}: ${check.details}${command}`;
    }),
    "",
    report.ok ? "Result: ready for `capp`." : "Result: not ready. Fix failed checks before using `capp`."
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
