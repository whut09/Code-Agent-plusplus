import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { runGit } from "../src/core/git.js";
import { readExecutionTrace } from "../src/outputs/execution-trace.js";
import { renderOrchestratorReport, runHarnessOrchestrator } from "../src/outputs/orchestrator.js";

test("harness orchestrator runs plan-pack-execute-evaluate-decision with mock executor", async () => {
  const root = createOrchestratorRepo();
  try {
    const result = await runHarnessOrchestrator(root, "fix login timeout bug", {
      executor: "mock",
      type: "bugfix",
      tokenBudget: 2000,
      base: "main"
    });
    const report = result.report;
    const rendered = renderOrchestratorReport(report);

    assert.equal(report.executor, "mock");
    assert.equal(report.taskId, "fix-login-timeout-bug");
    assert.deepEqual(report.phases, ["plan", "pack", "execute", "collect", "evaluate", "decision"]);
    assert.equal(report.executorResult.exitCode, 0);
    assert.equal(report.decision.action, "finalize");
    assert.equal(report.decision.blocking, false);
    assert.ok(report.artifacts.orchestratorFiles.includes(".agent-context/orchestrator/fix-login-timeout-bug/orchestrator.json"));
    assert.ok(existsSync(path.join(root, ".agent-context", "orchestrator", "fix-login-timeout-bug", "policy.md")));
    assert.ok(existsSync(path.join(root, ".agent-context", "runs", "fix-login-timeout-bug", "executor.mock.json")));
    assert.match(rendered, /# Harness Orchestrator/);
    assert.match(rendered, /Decision: finalize/);

    const trace = readExecutionTrace(root, report.traceId);
    assert.ok(trace);
    assert.ok(trace.steps.some((step) => step.action === "agent-execute"));
    assert.equal(trace.steps.at(-1)?.evidenceSource, "manual");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("harness orchestrator blocks when a selected executor has no command adapter", async () => {
  const root = createOrchestratorRepo();
  try {
    const result = await runHarnessOrchestrator(root, "fix login timeout bug", {
      executor: "opencode",
      type: "bugfix",
      tokenBudget: 2000,
      base: "main"
    });

    assert.equal(result.report.executor, "opencode");
    assert.equal(result.report.executorResult.exitCode, 2);
    assert.equal(result.report.decision.action, "block");
    assert.match(result.report.executorResult.stderr, /No executor command configured/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("harness orchestrator treats injected shell syntax as plain executor template data", async () => {
  const root = createOrchestratorRepo();
  try {
    const maliciousTask = "fix login timeout bug $(touch pwned-task.txt) `touch pwned-backtick.txt`";
    const result = await runHarnessOrchestrator(root, maliciousTask, {
      executor: "opencode",
      executorCommand: `"${process.execPath}" -e "console.log(process.argv[1])" {task}`,
      type: "bugfix",
      tokenBudget: 2000,
      base: "main"
    });

    assert.equal(result.report.executorResult.exitCode, 0);
    assert.match(result.report.taskId, /^fix-login-timeout-bug/);
    assert.match(result.report.executorResult.stdout, /\$\(touch pwned-task\.txt\)/);
    assert.equal(existsSync(path.join(root, "pwned-task.txt")), false);
    assert.equal(existsSync(path.join(root, "pwned-backtick.txt")), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

function createOrchestratorRepo(): string {
  const root = mkdtempSync(path.join(tmpdir(), "code-agent-plusplus-orchestrator-"));
  mkdirSync(path.join(root, "src", "auth"), { recursive: true });
  mkdirSync(path.join(root, "test", "auth"), { recursive: true });
  writeFileSync(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node -e \"console.log('ok')\"", check: "tsc --noEmit" } }), "utf8");
  writeFileSync(path.join(root, "src", "auth", "session.ts"), "export function loginSession() { return 'ok'; }\n", "utf8");
  writeFileSync(path.join(root, "test", "auth", "session.test.ts"), "import { loginSession } from '../../src/auth/session.js';\nloginSession();\n", "utf8");
  runGit(root, ["init"]);
  runGit(root, ["checkout", "-b", "main"]);
  runGit(root, ["config", "user.email", "code-agent-plusplus@example.com"]);
  runGit(root, ["config", "user.name", "Repo Context"]);
  runGit(root, ["add", "."]);
  runGit(root, ["commit", "-m", "initial"]);
  return root;
}
