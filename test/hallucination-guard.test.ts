import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { buildContextPackage } from "../src/core/context-builder.js";
import { runGit } from "../src/core/git.js";
import { appendExecutionTraceStep, startExecutionTrace } from "../src/harness/observability/execution-trace.js";
import { buildHallucinationReport, renderHallucinationReport, writeHallucinationReport } from "../src/harness/verification-plane/guards/hallucination.js";
import { buildPolicyReport } from "../src/harness/verification-plane/policy-engine.js";
import { writeContextPackage } from "../src/outputs/renderers/writer.js";

test("hallucination guard detects missing files, commands, dependencies, config, and symbols", async () => {
  const root = createHallucinationRepo();
  try {
    await prepareGeneratedContext(root);
    writeFileSync(
      path.join(root, "src", "app.ts"),
      [
        "import { missingExport } from './utils';",
        "import leftPad from 'left-pad';",
        "export function run() { return `${missingExport()}-${leftPad('x', 2)}-${process.env.SECRET_TOKEN}`; }",
        ""
      ].join("\n"),
      "utf8"
    );

    const trace = startExecutionTrace(root, "fix hallucinated auth flow", { agent: "opencode" });
    appendExecutionTraceStep(root, trace.id, {
      action: "message",
      output: "I inspected src/auth/missing.ts and will run npm run unit."
    });
    appendExecutionTraceStep(root, trace.id, {
      action: "run-test",
      command: "npm run unit",
      result: "failed"
    });

    const context = await buildContextPackage(root);
    const report = buildHallucinationReport(context, { base: "main", traceId: trace.id });
    const rendered = renderHallucinationReport(report);
    const written = writeHallucinationReport(context, report);

    assert.ok(report.findings.some((finding) => finding.kind === "missing_file" && finding.claim === "src/auth/missing.ts"));
    assert.ok(report.findings.some((finding) => finding.kind === "missing_command" && finding.claim === "npm run unit"));
    assert.ok(report.findings.some((finding) => finding.kind === "missing_dependency" && finding.claim.includes("left-pad")));
    assert.ok(report.findings.some((finding) => finding.kind === "missing_config" && finding.claim.includes("SECRET_TOKEN")));
    assert.ok(report.findings.some((finding) => finding.kind === "missing_symbol" && finding.claim.includes("missingExport")));
    assert.match(rendered, /# Hallucination Guard/);
    assert.ok(existsSync(path.join(root, written.json)));
    assert.ok(existsSync(path.join(root, written.markdown)));
    assert.match(readFileSync(path.join(root, written.markdown), "utf8"), /missingExport/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("policy engine treats hallucinated commands as required failures", async () => {
  const root = createHallucinationRepo();
  try {
    await prepareGeneratedContext(root);
    const trace = startExecutionTrace(root, "run missing package script", { agent: "codex" });
    appendExecutionTraceStep(root, trace.id, {
      action: "run-test",
      command: "npm run unit",
      result: "failed"
    });

    const context = await buildContextPackage(root);
    const report = buildPolicyReport(context, { base: "main", traceId: trace.id, failOn: "required" });

    assert.equal(report.passed, false);
    assert.ok(report.findings.some((finding) => finding.id === "policy.required.hallucination.missing-command" && finding.status === "missing"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

function createHallucinationRepo(): string {
  const root = mkdtempSync(path.join(tmpdir(), "opencode-plusplus-hallucination-"));
  mkdirSync(path.join(root, "src"), { recursive: true });
  writeFileSync(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node -e \"console.log('ok')\"" }, dependencies: {} }), "utf8");
  writeFileSync(path.join(root, ".env.example"), "PUBLIC_URL=http://localhost\n", "utf8");
  writeFileSync(path.join(root, "src", "utils.ts"), "export function existingExport() { return 'ok'; }\n", "utf8");
  writeFileSync(path.join(root, "src", "app.ts"), "import { existingExport } from './utils';\nexport function run() { return existingExport(); }\n", "utf8");
  return root;
}

async function prepareGeneratedContext(root: string): Promise<void> {
  const initialContext = await buildContextPackage(root);
  writeContextPackage(initialContext);
  runGit(root, ["init"]);
  runGit(root, ["checkout", "-b", "main"]);
  runGit(root, ["config", "user.email", "opencode-plusplus@example.com"]);
  runGit(root, ["config", "user.name", "Repo Context"]);
  runGit(root, ["add", "."]);
  runGit(root, ["commit", "-m", "initial"]);
}
