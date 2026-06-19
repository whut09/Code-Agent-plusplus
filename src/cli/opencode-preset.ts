import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
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

export interface OpencodeInitOptions {
  force?: boolean;
  dryRun?: boolean;
}

export interface OpencodeInitFile {
  path: string;
  status: "written" | "skipped" | "would-write";
  reason?: string;
}

export interface OpencodeInitReport {
  repo: string;
  files: OpencodeInitFile[];
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

export function initOpencodeProject(repo: string, options: OpencodeInitOptions = {}): OpencodeInitReport {
  const root = path.resolve(repo);
  const files = opencodeInitTemplates().map((template): OpencodeInitFile => {
    const absolutePath = path.join(root, template.path);
    if (existsSync(absolutePath) && !options.force) {
      return { path: template.path, status: "skipped", reason: "file already exists; pass --force to overwrite" };
    }

    if (options.dryRun) {
      return { path: template.path, status: "would-write" };
    }

    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, `${template.content.trim()}\n`, "utf8");
    return { path: template.path, status: "written" };
  });

  return { repo: root, files };
}

export function renderOpencodeInitReport(report: OpencodeInitReport): string {
  const written = report.files.filter((file) => file.status === "written");
  const skipped = report.files.filter((file) => file.status === "skipped");
  const wouldWrite = report.files.filter((file) => file.status === "would-write");
  return [
    "Code Agent++ OpenCode Init",
    "",
    `Repo: ${report.repo}`,
    "",
    "Generated OpenCode project integration files:",
    ...formatInitFiles(written, "written"),
    ...formatInitFiles(wouldWrite, "would-write"),
    ...(skipped.length ? ["", "Skipped:", ...skipped.map((file) => `- ${file.path} (${file.reason ?? "skipped"})`)] : []),
    "",
    "Next:",
    "  opencode",
    "  /capp <task>",
    "  /capp-verify"
  ].join("\n");
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

function opencodeInitTemplates(): Array<{ path: string; content: string }> {
  return [
    {
      path: ".opencode/commands/capp.md",
      content: `---
description: Run a coding task through Code Agent++ with OpenCode as the executor
---

# Code Agent++ Task Harness

Task: $ARGUMENTS

Use Code Agent++ as the external harness control plane for this coding task.

1. Run \`capp oc doctor .\` if this repository has not been checked yet.
2. Run \`capp oc "$ARGUMENTS" .\`.
3. Read the compact terminal decision summary.
4. If the decision is blocking, follow the listed \`Next\` commands before claiming completion.
5. Prefer \`capp oc report --last\` for the full report and \`capp oc repair\` for repair guidance.

Do not manually declare the task complete when Code Agent++ reports \`repair\`, \`repack\`, \`block\`, \`rollback\`, or \`human-review\`.`
    },
    {
      path: ".opencode/commands/capp-verify.md",
      content: `---
description: Verify the latest Code Agent++ OpenCode run
---

# Code Agent++ Verification

Verify the latest Code Agent++ run before finalizing.

1. Run \`capp oc report --last --summary\`.
2. Run \`capp verify --diff .\`.
3. Run \`capp policy . --base main --fail-on required\`.
4. If the latest decision is blocking, run \`capp oc repair\` and follow the required commands.
5. Summarize the final decision, changed files, blocking gates, and evidence collected.`
    },
    {
      path: ".opencode/agents/code-agent-plusplus.md",
      content: `---
description: Use OpenCode as the executor under the Code Agent++ reliability harness
---

# Code Agent++ Executor Agent

You are operating as a coding-agent executor under Code Agent++.

Code Agent++ owns context packaging, edit boundaries, trace evidence, policy checks, impact analysis, verification, and the final decision report. OpenCode owns reading source files, editing code, and running commands.

Operating rules:

- Start concrete coding tasks with \`capp oc "$TASK" .\` or the \`/capp\` command.
- Read source files before behavior-changing edits; generated summaries are guidance, not source of truth.
- Keep edits inside the Code Agent++ edit boundary unless the report explicitly requires expansion.
- Treat \`finalize\` as ready for review, not automatic merge.
- Treat \`repair\`, \`repack\`, \`run-tests\`, \`block\`, \`rollback\`, and \`human-review\` as active gates.
- Use \`capp oc report --last\` for details and \`capp oc repair\` for the next repair checklist.
- Do not claim tests passed without command evidence after the final edit.`
    }
  ];
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

function formatInitFiles(files: OpencodeInitFile[], label: OpencodeInitFile["status"]): string[] {
  if (!files.length) return [];
  return files.map((file) => `- ${file.path} (${label})`);
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
