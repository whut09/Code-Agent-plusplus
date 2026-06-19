import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { runGit } from "../core/git.js";
import { runSafeCommand, type SafeCommandRunResult } from "../core/safe-command.js";
import type { HarnessOrchestratorReport } from "../harness/control-plane/orchestrator.js";

export const OPENCODE_DEFAULT_EXECUTOR_COMMAND = 'opencode run --format json --dir {repo} --file {prompt} "Follow the attached Code Agent++ task prompt."';

export type OpencodeDoctorStatus = "pass" | "warn" | "fail";

export interface OpencodeDoctorCheck {
  id: string;
  label: string;
  status: OpencodeDoctorStatus;
  details: string;
  command?: string;
}

export interface OpencodeDoctorReport {
  repo: string;
  ok: boolean;
  checks: OpencodeDoctorCheck[];
}

export interface OpencodeReportLookupOptions {
  last?: boolean;
  taskId?: string;
}

export interface OpencodeReportLookupResult {
  report: HarnessOrchestratorReport;
  path: string;
}

export function runOpencodeDoctor(repo: string): OpencodeDoctorReport {
  const root = path.resolve(repo);
  const checks: OpencodeDoctorCheck[] = [];

  const version = runTool("opencode --version", root);
  checks.push({
    id: "opencode-installed",
    label: "OpenCode installed",
    status: commandPassed(version) ? "pass" : "fail",
    details: commandPassed(version) ? firstLine(version.stdout || version.stderr) || "opencode command resolved" : formatCommandFailure(version),
    command: "opencode --version"
  });

  const runHelp = runTool("opencode run --help", root);
  checks.push({
    id: "opencode-run",
    label: "OpenCode run command available",
    status: commandPassed(runHelp) ? "pass" : "fail",
    details: commandPassed(runHelp) ? "opencode run is available" : formatCommandFailure(runHelp),
    command: "opencode run --help"
  });

  const auth = runTool("opencode auth list", root);
  const authOutput = `${auth.stdout}\n${auth.stderr}`.trim();
  const hasProvider = commandPassed(auth) && hasAuthProvider(authOutput);
  checks.push({
    id: "opencode-auth",
    label: "OpenCode auth provider available",
    status: hasProvider ? "pass" : "fail",
    details: hasProvider ? firstLine(authOutput) || "auth provider detected" : authOutput || formatCommandFailure(auth),
    command: "opencode auth list"
  });

  const gitRepo = runGitCheck(root, ["rev-parse", "--is-inside-work-tree"]);
  checks.push({
    id: "git-repo",
    label: "Current repository is a git repo",
    status: gitRepo.ok && gitRepo.stdout.trim() === "true" ? "pass" : "fail",
    details: gitRepo.ok ? `git rev-parse returned ${JSON.stringify(gitRepo.stdout.trim())}` : gitRepo.error,
    command: "git rev-parse --is-inside-work-tree"
  });

  const agentContext = path.join(root, ".agent-context");
  checks.push({
    id: "agent-context",
    label: ".agent-context exists",
    status: existsSync(agentContext) ? "pass" : "warn",
    details: existsSync(agentContext)
      ? ".agent-context found"
      : "Run `code-agent-plusplus build .` or `code-agent-plusplus opencode run <task>` to generate context."
  });

  const status = runGitCheck(root, ["status", "--porcelain", "--untracked-files=all"]);
  const dirtyLines = status.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  checks.push({
    id: "working-tree-clean",
    label: "Working tree clean",
    status: status.ok && dirtyLines.length === 0 ? "pass" : "warn",
    details: status.ok ? (dirtyLines.length === 0 ? "working tree is clean" : `${dirtyLines.length} changed/untracked path(s) detected`) : status.error,
    command: "git status --porcelain --untracked-files=all"
  });

  return {
    repo: root,
    ok: checks.every((check) => check.status !== "fail"),
    checks
  };
}

export function renderOpencodeDoctorReport(report: OpencodeDoctorReport): string {
  return [
    "# OpenCode Doctor",
    "",
    `Repo: ${report.repo}`,
    "",
    ...report.checks.map((check) => {
      const marker = check.status === "pass" ? "PASS" : check.status === "warn" ? "WARN" : "FAIL";
      const command = check.command ? `\n  Command: ${check.command}` : "";
      return `- [${marker}] ${check.label}: ${check.details}${command}`;
    }),
    "",
    report.ok ? "Result: OpenCode preset is usable." : "Result: OpenCode preset is not ready. Fix failed checks before running the executor."
  ].join("\n");
}

export function renderOpencodeRunSummary(report: HarnessOrchestratorReport, commandName = "capp"): string {
  const blockingGates = report.gates.gates.filter((gate) => gate.status === "blocked");
  const warnings = report.gates.gates.filter((gate) => gate.status === "warning");
  return [
    "Code Agent++ OpenCode Run",
    "",
    `Task: ${report.task}`,
    `Decision: ${report.decision.action}`,
    `Confidence: ${report.decision.confidence.toFixed(2)}`,
    "",
    "Changed files:",
    ...formatList(report.changedFiles),
    "",
    "Blocking gates:",
    ...formatList(blockingGates.map((gate) => `${formatGuardName(gate.guard)}: ${gate.condition}`)),
    ...(warnings.length ? ["", "Warnings:", ...formatList(warnings.map((gate) => `${formatGuardName(gate.guard)}: ${gate.condition}`))] : []),
    "",
    "Next:",
    ...nextCommandsFor(report, commandName).map((command) => `  ${command}`),
    "",
    `Report: ${report.artifacts.orchestratorFiles.find((file) => file.endsWith("orchestrator.md")) ?? report.runDir}`
  ].join("\n");
}

export function renderOpencodeRepairGuidance(report: HarnessOrchestratorReport, commandName = "capp"): string {
  const blockingGates = report.gates.gates.filter((gate) => gate.status === "blocked");
  return [
    "Code Agent++ OpenCode Repair",
    "",
    `Task: ${report.task}`,
    `Decision: ${report.decision.action}`,
    `Confidence: ${report.decision.confidence.toFixed(2)}`,
    "",
    "Why repair is needed:",
    ...formatList(report.decision.reasons),
    "",
    "Blocking gates:",
    ...formatList(blockingGates.map((gate) => `${formatGuardName(gate.guard)}: ${gate.condition}`)),
    "",
    "Required commands:",
    ...formatList(report.decision.requiredCommands.map((command) => `\`${command}\``)),
    "",
    "Next:",
    `  ${commandName} oc "${escapeDoubleQuoted(report.task)}" --max-loops ${report.maxLoops}`,
    `  ${commandName} oc report --last`
  ].join("\n");
}

export function findOpencodeReport(repo: string, options: OpencodeReportLookupOptions = { last: true }): OpencodeReportLookupResult | undefined {
  const root = path.resolve(repo);
  const orchestratorDir = path.join(root, ".agent-context", "orchestrator");
  if (!existsSync(orchestratorDir)) return undefined;

  if (options.taskId) {
    return readReportIfExists(path.join(orchestratorDir, options.taskId, "orchestrator.json"));
  }

  if (!options.last) return undefined;
  const candidates = readdirSync(orchestratorDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(orchestratorDir, entry.name, "orchestrator.json"))
    .map((filePath) => {
      const result = readReportIfExists(filePath);
      if (!result) return undefined;
      return { ...result, mtimeMs: statSync(filePath).mtimeMs };
    })
    .filter((item): item is OpencodeReportLookupResult & { mtimeMs: number } => Boolean(item))
    .filter((item) => item.report.executor === "opencode")
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  return candidates[0];
}

function readReportIfExists(filePath: string): OpencodeReportLookupResult | undefined {
  if (!existsSync(filePath)) return undefined;
  try {
    const report = JSON.parse(readFileSync(filePath, "utf8")) as HarnessOrchestratorReport;
    return { report, path: filePath };
  } catch {
    return undefined;
  }
}

function formatList(items: string[]): string[] {
  return items.length ? items.map((item) => `- ${item}`) : ["- none"];
}

function formatGuardName(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)} Guard`;
}

function nextCommandsFor(report: HarnessOrchestratorReport, commandName: string): string[] {
  if (report.decision.action === "finalize") return [`${commandName} oc report --last`];
  if (report.decision.action === "run-tests") {
    return [...report.decision.requiredCommands.map((command) => command), `${commandName} oc repair`, `${commandName} oc report --last`];
  }
  if (report.decision.action === "repack")
    return [`${commandName} oc "${escapeDoubleQuoted(report.task)}" --max-loops ${report.maxLoops}`, `${commandName} oc report --last`];
  return [`${commandName} oc repair`, `${commandName} oc report --last`];
}

function escapeDoubleQuoted(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function runTool(command: string, cwd: string): SafeCommandRunResult {
  try {
    return runSafeCommand(command, { cwd, encoding: "utf8", maxBuffer: 1024 * 1024 });
  } catch (error) {
    return {
      command,
      file: "",
      args: [],
      stdout: "",
      stderr: error instanceof Error ? error.message : String(error),
      status: 1,
      error: error instanceof Error ? error : undefined
    };
  }
}

function commandPassed(result: SafeCommandRunResult): boolean {
  return result.status === 0 && !result.error;
}

function formatCommandFailure(result: SafeCommandRunResult): string {
  return firstLine(`${result.stderr}\n${result.stdout}`.trim()) || `command exited with ${result.status ?? "unknown"}`;
}

function hasAuthProvider(output: string): boolean {
  const normalized = output.trim().toLowerCase();
  if (!normalized) return false;
  return !/(no\s+(auth|provider|account|credential)|not\s+(logged|authenticated)|empty|missing)/i.test(normalized);
}

function firstLine(value: string): string {
  return (
    value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) ?? ""
  );
}

function runGitCheck(root: string, args: string[]): { ok: boolean; stdout: string; error: string } {
  try {
    return { ok: true, stdout: runGit(root, args), error: "" };
  } catch (error) {
    return { ok: false, stdout: "", error: error instanceof Error ? error.message : String(error) };
  }
}
