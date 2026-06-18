import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { buildContextPackage } from "../src/core/context-builder.js";
import { runGit } from "../src/core/git.js";
import { buildPolicyReport } from "../src/harness/verification-plane/policy-engine.js";
import { buildRegressionReport, renderRegressionReport, writeRegressionReport } from "../src/harness/verification-plane/guards/regression.js";
import { addRegressionMemoryFromCandidate, buildRegressionMemoryCandidate, writeFinalizeMemoryCandidate, writeRegressionMemoryCandidate } from "../src/harness/verification-plane/guards/regression-memory.js";
import { buildTaskPack } from "../src/outputs/task-context.js";
import { writeTaskRun } from "../src/outputs/task-run.js";
import { writeContextPackage } from "../src/outputs/renderers/writer.js";

test("regression guard matches structured memory and injects task-pack tests", async () => {
  const root = createRegressionRepo();
  try {
    await prepareRegressionContext(root);

    const context = await buildContextPackage(root);
    const pack = buildTaskPack(context, "fix session timeout ttl bug", { type: "bugfix" });
    const report = buildRegressionReport(context, { task: "fix session timeout ttl bug", base: "main" });
    const rendered = renderRegressionReport(report);
    const written = writeRegressionReport(context, report);
    const run = writeTaskRun(context, "fix session timeout ttl bug", { base: "main" });

    assert.equal(report.summary.matches, 1);
    assert.deepEqual(report.requiredTests, ["npm run test -- auth"]);
    assert.ok(pack.regression.antiRegressionNotes.some((note) => note.includes("server time")));
    assert.ok(pack.suggestedCommands.includes("npm run test -- auth"));
    assert.match(rendered, /Regression Guard/);
    assert.match(readFileSync(path.join(root, written.markdown), "utf8"), /auth-timeout-regression-001/);
    assert.ok(run.manifest.requiredRegressionTests.includes("npm run test -- auth"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("policy engine requires regression test evidence for changed risky modules", async () => {
  const root = createRegressionRepo();
  try {
    await prepareRegressionContext(root);
    writeFileSync(path.join(root, "src", "auth", "session.ts"), "export function sessionTtl() { return Date.now(); }\n", "utf8");

    const context = await buildContextPackage(root);
    const report = buildPolicyReport(context, { base: "main", failOn: "required" });

    assert.equal(report.passed, false);
    assert.ok(report.findings.some((finding) => finding.id === "policy.required.regression-tests" && finding.status === "missing"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("finalize memory candidates are written without mutating long-term regression memory", async () => {
  const root = createRegressionRepo();
  try {
    await prepareRegressionContext(root);
    writeFileSync(path.join(root, "src", "auth", "session.ts"), "export function sessionTtl() { return Date.now(); }\n", "utf8");

    const context = await buildContextPackage(root);
    const written = writeFinalizeMemoryCandidate(context, "fix login timeout bug", "main", ["src/auth/session.ts"]);

    assert.ok(written);
    assert.equal(written.file.startsWith(".agent-context/memory/candidates/"), true);
    assert.equal(written.candidate.source, "finalize");
    assert.deepEqual(written.candidate.changedFiles, ["src/auth/session.ts"]);
    assert.match(written.candidate.bugPattern, /fix login timeout bug/);
    assert.ok(existsSync(path.join(root, written.file)));
    assert.equal(existsSync(path.join(root, ".agent-context", "regression", "fix-history.json")), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("regression memory candidates require explicit confirmation before fix history is updated", async () => {
  const root = createRegressionRepo();
  try {
    await prepareRegressionContext(root);
    writeFileSync(path.join(root, "src", "auth", "session.ts"), "export function sessionTtl() { return Date.now(); }\n", "utf8");

    const context = await buildContextPackage(root);
    const candidate = buildRegressionMemoryCandidate(context, {
      source: "learn-from-pr",
      task: "timeout calculation must use server time",
      changedFiles: ["src/auth/session.ts"],
      bugPattern: "timeout calculation must use server time",
      requiredTests: ["npm test -- auth"],
      riskTriggers: ["timeout", "session", "ttl"]
    });
    const written = writeRegressionMemoryCandidate(context, candidate);

    assert.equal(written.file.startsWith(".agent-context/memory/candidates/"), true);
    assert.ok(existsSync(path.join(root, written.file)));
    assert.equal(existsSync(path.join(root, ".agent-context", "regression", "fix-history.json")), false);

    const added = addRegressionMemoryFromCandidate(root, written.file);
    const fixHistory = JSON.parse(readFileSync(path.join(root, added.memoryFile), "utf8")) as Array<{ id: string; files: string[]; pattern: string }>;

    assert.equal(added.entry.id, candidate.id.replace(/^candidate-/, "fix-"));
    assert.deepEqual(added.entry.files, ["src/auth/session.ts"]);
    assert.equal(added.entry.pattern, "timeout calculation must use server time");
    assert.ok(fixHistory.some((entry) => entry.id === added.entry.id));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

function createRegressionRepo(): string {
  const root = mkdtempSync(path.join(tmpdir(), "code-agent-plusplus-regression-"));
  mkdirSync(path.join(root, "src", "auth"), { recursive: true });
  mkdirSync(path.join(root, "test", "auth"), { recursive: true });
  writeFileSync(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node -e \"console.log('ok')\"" } }), "utf8");
  writeFileSync(path.join(root, "src", "auth", "session.ts"), "export function sessionTtl() { return 30; }\n", "utf8");
  writeFileSync(path.join(root, "test", "auth", "session.test.ts"), "import { sessionTtl } from '../../src/auth/session.js';\nsessionTtl();\n", "utf8");
  return root;
}

async function prepareRegressionContext(root: string): Promise<void> {
  const initialContext = await buildContextPackage(root);
  writeContextPackage(initialContext);
  writeFileSync(
    path.join(root, ".agent-context", "regression", "known-issues.json"),
    `${JSON.stringify(
      [
        {
          id: "auth-timeout-regression-001",
          module: "auth",
          files: ["src/auth/session.ts"],
          pattern: "session timeout must use server time, not client Date.now",
          requiredTests: ["npm run test -- auth"],
          riskTriggers: ["timeout", "session", "ttl", "expire"],
          lastFixedIn: "PR #123"
        }
      ],
      null,
      2
    )}\n`,
    "utf8"
  );
  runGit(root, ["init"]);
  runGit(root, ["checkout", "-b", "main"]);
  runGit(root, ["config", "user.email", "code-agent-plusplus@example.com"]);
  runGit(root, ["config", "user.name", "Repo Context"]);
  runGit(root, ["add", "."]);
  runGit(root, ["commit", "-m", "initial"]);
}
