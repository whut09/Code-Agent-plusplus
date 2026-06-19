import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { buildContextPackage } from "../src/core/context-builder.js";
import { runGit } from "../src/core/git.js";
import { writeContextPackage } from "../src/outputs/renderers/writer.js";
import { launchOpenCodeWithSidecar } from "../src/integrations/opencode/launcher.js";
import { OPENCODE_SIDECAR_PLUGIN_PATH, opencodeSidecarPluginTemplate } from "../src/integrations/opencode/sidecar-plugin-template.js";
import {
  checkOpencodeSidecarCommand,
  ensureOpencodeSidecarPlugin,
  recordOpencodeSidecarTool,
  verifyOpencodeSidecar,
  writeOpencodeSidecarLatest
} from "../src/integrations/opencode/sidecar.js";
import { readExecutionTrace } from "../src/harness/observability/execution-trace.js";

test("OpenCode launcher dry-run prepares sidecar context without opening the TUI", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "code-agent-plusplus-opencode-launcher-"));
  const bin = path.join(root, "bin");
  const oldPath = process.env.PATH;
  try {
    mkdirSync(bin, { recursive: true });
    writeFakeOpenCode(bin);
    process.env.PATH = `${bin}${path.delimiter}${oldPath ?? ""}`;
    writeFileSync(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node -e \"console.log('ok')\"" } }), "utf8");
    runGit(root, ["init"]);
    runGit(root, ["checkout", "-b", "main"]);
    runGit(root, ["config", "user.email", "code-agent-plusplus@example.com"]);
    runGit(root, ["config", "user.name", "Code Agent Plus Plus"]);
    runGit(root, ["add", "."]);
    runGit(root, ["commit", "-m", "initial"]);

    const result = await launchOpenCodeWithSidecar({ repo: root, skipContext: true, dryRun: true });

    assert.equal(result.launched, false);
    assert.equal(result.exitCode, 0);
    assert.deepEqual(result.command, ["opencode", root]);
    assert.equal(result.steps.find((step) => step.name === "opencode")?.status, "pass");
    assert.equal(result.steps.find((step) => step.name === "git")?.status, "pass");
    assert.equal(result.steps.find((step) => step.name === "context")?.status, "skipped");
    assert.equal(result.steps.find((step) => step.name === "sidecar-plugin")?.status, "pass");
    assert.equal(existsSync(path.join(root, ".opencode")), false);
    assert.equal(existsSync(path.join(root, OPENCODE_SIDECAR_PLUGIN_PATH)), false);
  } finally {
    process.env.PATH = oldPath;
    rmSync(root, { recursive: true, force: true });
  }
});

test("OpenCode sidecar plugin template uses the project plugin export shape", () => {
  const source = opencodeSidecarPluginTemplate();

  assert.match(source, /export const CodeAgentPlusPlusSidecar/);
  assert.match(source, /event: async/);
  assert.match(source, /session\.created/);
  assert.match(source, /file\.edited/);
  assert.match(source, /file\.watcher\.updated/);
  assert.match(source, /session\.idle/);
  assert.match(source, /sidecar", "verify"/);
  assert.match(source, /--quiet/);
  assert.match(source, /tool\.execute\.before/);
  assert.match(source, /tool\.execute\.after/);
  assert.match(source, /sidecar", "check-command"/);
  assert.match(source, /sidecar",\s*"record-tool"/);
  assert.match(source, /rememberToolStart/);
  assert.match(source, /recordToolAfter/);
  assert.match(source, /currentWorkingTreeHash/);
  assert.match(source, /client\?\.app\?\.log/);
  assert.match(source, /VERIFY_DEBOUNCE_MS/);
  assert.match(source, /let dirty = false/);
  assert.match(source, /let verifying = false/);
  assert.match(source, /let lastVerifyAt = 0/);
  assert.match(source, /function markDirty/);
  assert.match(source, /function maybeVerifyOnIdle/);
  assert.match(source, /if \(!dirty\)/);
  assert.match(source, /if \(verifying\)/);
  assert.match(source, /now - lastVerifyAt < VERIFY_DEBOUNCE_MS/);
  assert.match(source, /dirty = false/);
  assert.match(source, /maybeVerifyOnIdle\(\)/);
  assert.match(source, /markDirty\("file\.edited"/);
  assert.match(source, /markDirty\("file\.watcher\.updated"/);
  assert.doesNotMatch(source, /sidecar noticed an edit/);
  assert.doesNotMatch(source, /sidecar active\./);
  assert.match(source, /sidecar verification blocked/);
  assert.match(source, /console\.log\(output\)/);
});

test("OpenCode sidecar records tool execution evidence into event logs and traces", () => {
  const root = mkdtempSync(path.join(tmpdir(), "code-agent-plusplus-sidecar-record-tool-"));
  try {
    runGit(root, ["init"]);
    runGit(root, ["checkout", "-b", "main"]);
    writeFileSync(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node -e 1" } }), "utf8");
    runGit(root, ["add", "."]);
    runGit(root, ["config", "user.email", "code-agent-plusplus@example.com"]);
    runGit(root, ["config", "user.name", "Code Agent Plus Plus"]);
    runGit(root, ["commit", "-m", "initial"]);
    writeFileSync(path.join(root, "src.ts"), "export const value = 1;\n", "utf8");

    const result = recordOpencodeSidecarTool(root, {
      tool: "bash",
      command: "npm run test",
      exitCode: 0,
      startedAt: "2026-06-19T10:00:00.000Z",
      finishedAt: "2026-06-19T10:00:01.000Z",
      stdout: "ok\n",
      stderr: "",
      workingTreeHashBefore: "a".repeat(64),
      workingTreeHashAfter: "b".repeat(64),
      sessionId: "session-123",
      paths: ["src.ts"]
    });

    assert.equal(existsSync(result.eventLogPath), true);
    assert.match(readFileSync(result.eventLogPath, "utf8"), /tool\.execute\.after/);
    assert.equal(path.basename(result.tracePath), "opencode-session-session-123.json");
    const trace = readExecutionTrace(root, result.traceId);
    const step = trace?.steps.at(-1);
    assert.equal(trace?.agent, "opencode");
    assert.equal(step?.action, "run-test");
    assert.equal(step?.command, "npm run test");
    assert.equal(step?.evidenceSource, "command");
    assert.equal(step?.capturedBy, "code-agent-plusplus");
    assert.equal(step?.exitCode, 0);
    assert.equal(step?.startedAt, "2026-06-19T10:00:00.000Z");
    assert.equal(step?.finishedAt, "2026-06-19T10:00:01.000Z");
    assert.match(step?.stdoutHash ?? "", /^[a-f0-9]{64}$/);
    assert.match(step?.stderrHash ?? "", /^[a-f0-9]{64}$/);
    assert.equal(step?.workingTreeHashBefore, "a".repeat(64));
    assert.equal(step?.workingTreeHashAfter, "b".repeat(64));
    assert.ok(step?.files.includes("src.ts"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("OpenCode sidecar verify checks plugin hooks, event log readiness, and guard stack", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "code-agent-plusplus-sidecar-verify-"));
  try {
    runGit(root, ["init"]);
    runGit(root, ["checkout", "-b", "main"]);
    writeFileSync(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node -e 1" } }), "utf8");
    runGit(root, ["add", "."]);
    runGit(root, ["config", "user.email", "code-agent-plusplus@example.com"]);
    runGit(root, ["config", "user.name", "Code Agent Plus Plus"]);
    runGit(root, ["commit", "-m", "initial"]);
    writeContextPackage(await buildContextPackage(root));
    ensureOpencodeSidecarPlugin(root);
    runGit(root, ["add", ".agent-context", "AGENTS.md"]);
    runGit(root, ["commit", "-m", "add generated context"]);
    runGit(root, ["add", ".opencode"]);
    runGit(root, ["commit", "-m", "add sidecar plugin"]);

    const report = await verifyOpencodeSidecar(root);

    assert.equal(report.ok, false);
    assert.equal(report.guardStack.ran, true);
    assert.equal(report.guardStack.contracts?.passed, true);
    assert.equal(report.guardStack.hallucination?.errors, 0);
    assert.equal(report.guardStack.regression?.matches, 0);
    assert.equal(report.guardStack.impact?.risk, "Low");
    assert.equal(typeof report.guardStack.tests?.fullConfidenceCommands, "number");
    assert.equal(report.guardStack.policy?.passed, false);
    assert.match(report.blockers.join("\n"), /Policy required evidence missing/);
    assert.equal(report.checks.find((check) => check.name === OPENCODE_SIDECAR_PLUGIN_PATH)?.status, "pass");
    assert.equal(report.checks.find((check) => check.name === "file.edited hook")?.status, "pass");
    assert.equal(report.checks.find((check) => check.name === "session.idle hook")?.status, "pass");
    assert.equal(report.checks.find((check) => check.name === "tool.execute.after hook")?.status, "pass");
    assert.equal(report.checks.find((check) => check.name === "sidecar-event-log")?.status, "warn");
    writeOpencodeSidecarLatest(report);
    assert.equal(existsSync(path.join(root, ".agent-context", "sidecar", "latest.json")), true);
    assert.equal(existsSync(path.join(root, ".agent-context", "sidecar", "latest.md")), true);
    assert.match(readFileSync(path.join(root, ".agent-context", "sidecar", "latest.md"), "utf8"), /Guard Stack/);
    assert.equal(existsSync(path.join(root, ".agent-context", "sidecar", "policy.md")), true);
    assert.equal(existsSync(path.join(root, ".agent-context", "sidecar", "task-verify.md")), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("OpenCode sidecar command guard blocks unknown scripts and protected paths", () => {
  const root = mkdtempSync(path.join(tmpdir(), "code-agent-plusplus-command-guard-"));
  try {
    writeFileSync(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node -e 1" } }), "utf8");
    writeFileSync(path.join(root, "Makefile"), "build:\n\t@echo build\n", "utf8");

    assert.equal(checkOpencodeSidecarCommand(root, { command: "npm run test" }).allowed, true);
    const missingScript = checkOpencodeSidecarCommand(root, { command: "npm run hallucinated" });
    assert.equal(missingScript.allowed, false);
    assert.match(missingScript.findings[0]?.message ?? "", /does not exist/);

    assert.equal(checkOpencodeSidecarCommand(root, { command: "make build" }).allowed, true);
    assert.equal(checkOpencodeSidecarCommand(root, { command: "make deploy-prod" }).allowed, false);

    const protectedPath = checkOpencodeSidecarCommand(root, { command: "path-check", paths: [".agent-context/repo-summary.md", ".env"] });
    assert.equal(protectedPath.allowed, false);
    assert.match(protectedPath.findings.map((finding) => finding.kind).join(","), /protected_path/);
    assert.match(protectedPath.findings.map((finding) => finding.kind).join(","), /secret_path/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("OpenCode sidecar command guard blocks dangerous shell commands", () => {
  const root = mkdtempSync(path.join(tmpdir(), "code-agent-plusplus-command-danger-"));
  try {
    const result = checkOpencodeSidecarCommand(root, { command: "git reset --hard HEAD" });
    assert.equal(result.allowed, false);
    assert.equal(result.findings[0]?.kind, "dangerous_command");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("OpenCode sidecar verify detects generated context blockers from current diff", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "code-agent-plusplus-sidecar-blocker-"));
  try {
    runGit(root, ["init"]);
    runGit(root, ["checkout", "-b", "main"]);
    mkdirSync(path.join(root, ".agent-context", "traces"), { recursive: true });
    ensureOpencodeSidecarPlugin(root);
    writeFileSync(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node -e 1" } }), "utf8");
    runGit(root, ["add", "."]);
    runGit(root, ["config", "user.email", "code-agent-plusplus@example.com"]);
    runGit(root, ["config", "user.name", "Code Agent Plus Plus"]);
    runGit(root, ["commit", "-m", "initial"]);

    writeFileSync(path.join(root, ".agent-context", "repo-summary.md"), "stale generated change\n", "utf8");
    const report = await verifyOpencodeSidecar(root);

    assert.equal(report.ok, false);
    assert.deepEqual(report.changedFiles, [".agent-context/repo-summary.md"]);
    assert.match(report.blockers.join("\n"), /Policy required evidence missing|Policy forbidden failures|Contract violations/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

function writeFakeOpenCode(bin: string): void {
  if (process.platform === "win32") {
    writeFileSync(path.join(bin, "opencode.cmd"), '@echo off\r\nif "%1"=="--version" echo opencode 0.0.0-test& exit /b 0\r\necho tui& exit /b 0\r\n', "utf8");
    return;
  }

  const script = path.join(bin, "opencode");
  writeFileSync(
    script,
    ["#!/usr/bin/env sh", 'if [ "$1" = "--version" ]; then echo "opencode 0.0.0-test"; exit 0; fi', "echo tui", "exit 0"].join("\n"),
    "utf8"
  );
  chmodSync(script, 0o755);
}
