import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { buildContextPackage } from "../src/core/context-builder.js";
import { runGit } from "../src/core/git.js";
import { appendExecutionTraceStep, startExecutionTrace } from "../src/outputs/execution-trace.js";
import { buildPolicyReport, renderPolicyReport } from "../src/outputs/policy-engine.js";
import { writeContextPackage } from "../src/outputs/writer.js";

test("policy engine requires trace evidence for source edits", async () => {
  const root = createPolicyRepo();
  try {
    await prepareGeneratedContext(root);
    writeFileSync(path.join(root, "src", "core", "session.ts"), "export function loginSession() { return 'fixed'; }\n", "utf8");

    const context = await buildContextPackage(root);
    const report = buildPolicyReport(context, { base: "main" });
    const rendered = renderPolicyReport(report);

    assert.equal(report.passed, false);
    assert.ok(report.findings.some((finding) => finding.id === "policy.required.tests" && finding.status === "missing"));
    assert.ok(report.findings.some((finding) => finding.id === "policy.required.contract-validation" && finding.status === "missing"));
    assert.match(rendered, /# Policy Engine/);
    assert.match(rendered, /policy\.required\.tests/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("policy engine accepts passed trace evidence for required checks", async () => {
  const root = createPolicyRepo();
  try {
    await prepareGeneratedContext(root);
    writeFileSync(path.join(root, "src", "core", "session.ts"), "export function loginSession() { return 'fixed'; }\n", "utf8");

    const trace = startExecutionTrace(root, "fix login timeout bug", { agent: "codex" });
    appendExecutionTraceStep(root, trace.id, {
      action: "run-test",
      command: "npm test -- test/core/session.test.ts",
      result: "passed"
    });
    appendExecutionTraceStep(root, trace.id, {
      action: "validate-contracts",
      command: "repo-context validate-contracts . --base main",
      result: "passed"
    });

    const context = await buildContextPackage(root);
    const report = buildPolicyReport(context, { base: "main", traceId: trace.id });

    assert.ok(report.findings.some((finding) => finding.id === "policy.required.tests" && finding.status === "satisfied"));
    assert.ok(report.findings.some((finding) => finding.id === "policy.required.contract-validation" && finding.status === "satisfied"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("policy engine blocks generated source output changes", async () => {
  const root = createPolicyRepo();
  try {
    mkdirSync(path.join(root, "src", "generated"), { recursive: true });
    writeFileSync(path.join(root, "src", "generated", "client.generated.ts"), "export const client = 1;\n", "utf8");
    await prepareGeneratedContext(root);
    writeFileSync(path.join(root, "src", "generated", "client.generated.ts"), "export const client = 2;\n", "utf8");

    const context = await buildContextPackage(root);
    const report = buildPolicyReport(context, { base: "main" });

    assert.equal(report.passed, false);
    assert.ok(report.findings.some((finding) => finding.id === "policy.forbidden.generated-source" && finding.status === "failed"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

function createPolicyRepo(): string {
  const root = mkdtempSync(path.join(tmpdir(), "repo-context-policy-"));
  mkdirSync(path.join(root, "src", "core"), { recursive: true });
  mkdirSync(path.join(root, "test", "core"), { recursive: true });
  writeFileSync(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node --test", check: "tsc --noEmit" } }), "utf8");
  writeFileSync(path.join(root, "src", "core", "session.ts"), "export function loginSession() { return 'ok'; }\n", "utf8");
  writeFileSync(path.join(root, "test", "core", "session.test.ts"), "import { loginSession } from '../../src/core/session.js';\nloginSession();\n", "utf8");
  return root;
}

async function prepareGeneratedContext(root: string): Promise<void> {
  const initialContext = await buildContextPackage(root);
  writeContextPackage(initialContext);
  runGit(root, ["init"]);
  runGit(root, ["checkout", "-b", "main"]);
  runGit(root, ["config", "user.email", "repo-context@example.com"]);
  runGit(root, ["config", "user.name", "Repo Context"]);
  runGit(root, ["add", "."]);
  runGit(root, ["commit", "-m", "initial"]);
}
