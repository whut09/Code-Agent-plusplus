import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { buildContextPackage } from "../src/core/context-builder.js";
import { runGit } from "../src/core/git.js";
import { buildLoopControllerReport, renderLoopControllerReport, writeLoopControllerReport } from "../src/outputs/loop-controller.js";
import { writeContextPackage } from "../src/outputs/writer.js";

test("loop controller starts the agent from a clean preflight", async () => {
  const root = createLoopRepo();
  try {
    await prepareGeneratedContext(root);

    const context = await buildContextPackage(root);
    const report = buildLoopControllerReport(context, "fix login timeout bug", { phase: "preflight", type: "bugfix", base: "main" });
    const rendered = renderLoopControllerReport(report);

    assert.equal(report.status, "ready");
    assert.equal(report.changedFiles.length, 0);
    assert.ok(report.decisions.some((decision) => decision.action === "start-agent"));
    assert.match(rendered, /# Loop Controller/);
    assert.match(rendered, /repo-context run "fix login timeout bug"/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("loop controller asks for context refresh and tests after source edits", async () => {
  const root = createLoopRepo();
  try {
    await prepareGeneratedContext(root);
    writeFileSync(path.join(root, "src", "auth", "session.ts"), "export function loginSession() { return 'fixed'; }\n", "utf8");

    const context = await buildContextPackage(root);
    const report = buildLoopControllerReport(context, "fix login timeout bug", { phase: "after-edit", type: "bugfix", base: "main" });
    const result = writeLoopControllerReport(context, "fix login timeout bug", { phase: "after-edit", type: "bugfix", base: "main" });

    assert.ok(report.changedFiles.includes("src/auth/session.ts"));
    assert.ok(report.decisions.some((decision) => decision.action === "rebuild-context"));
    assert.ok(report.decisions.some((decision) => decision.action === "run-tests"));
    assert.ok(existsSync(path.join(result.dir, "loop.md")));
    assert.ok(existsSync(path.join(result.dir, "loop.json")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

function createLoopRepo(): string {
  const root = mkdtempSync(path.join(tmpdir(), "repo-context-loop-"));
  mkdirSync(path.join(root, "src", "auth"), { recursive: true });
  mkdirSync(path.join(root, "test", "auth"), { recursive: true });
  writeFileSync(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node --test", check: "tsc --noEmit" } }), "utf8");
  writeFileSync(path.join(root, "src", "auth", "session.ts"), "export function loginSession() { return 'ok'; }\n", "utf8");
  writeFileSync(path.join(root, "test", "auth", "session.test.ts"), "import { loginSession } from '../../src/auth/session.js';\nloginSession();\n", "utf8");
  runGit(root, ["init"]);
  runGit(root, ["checkout", "-b", "main"]);
  runGit(root, ["config", "user.email", "repo-context@example.com"]);
  runGit(root, ["config", "user.name", "Repo Context"]);
  runGit(root, ["add", "."]);
  runGit(root, ["commit", "-m", "initial"]);
  return root;
}

async function prepareGeneratedContext(root: string): Promise<void> {
  const context = await buildContextPackage(root);
  writeContextPackage(context);
  runGit(root, ["add", "."]);
  runGit(root, ["commit", "-m", "generated context"]);
}
