import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { buildContextPackage } from "../src/core/context-builder.js";
import { buildContextDelta, renderContextDelta, writeContextDelta } from "../src/outputs/context-delta.js";
import { runGit } from "../src/core/git.js";
import { assessFreshness, buildContextManifest } from "../src/core/freshness.js";
import { writeContextPackage } from "../src/outputs/renderers/writer.js";

test("context delta reports stale outputs and agent re-read files", async () => {
  const root = createDeltaRepo();
  try {
    await prepareGeneratedContext(root);
    writeFileSync(path.join(root, "src", "auth", "session.ts"), "export function loginSession() { return 'fixed'; }\n", "utf8");

    const context = await buildContextPackage(root);
    const report = buildContextDelta(context, { base: "main" });
    const rendered = renderContextDelta(report);

    assert.equal(report.impact, "medium");
    assert.ok(report.changedFiles.some((file) => file.path === "src/auth/session.ts"));
    assert.ok(report.affectedGraphNodes.includes("src/api/login.ts"));
    assert.ok(report.affectedOutputs.includes("dependency-graph"));
    assert.ok(report.affectedOutputs.includes("task-packs"));
    assert.ok(report.agentMustReRead.includes("src/auth/session.ts"));
    assert.ok(report.agentMustReRead.includes("src/api/login.ts"));
    assert.match(rendered, /# Context Delta/);
    assert.match(rendered, /opencode-plusplus evolve \. --base main/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("context delta writes reports without making freshness stale", async () => {
  const root = createDeltaRepo();
  try {
    await prepareGeneratedContext(root);
    writeFileSync(path.join(root, "src", "auth", "session.ts"), "export function loginSession() { return 'fixed'; }\n", "utf8");

    const context = await buildContextPackage(root);
    const report = buildContextDelta(context, { base: "main" });
    const result = writeContextDelta(context, report);

    assert.ok(result.files.every((file) => existsSync(file)));
    assert.ok(existsSync(path.join(root, ".agent-context", "delta", "latest.json")));

    const writeResult = writeContextPackage(context);
    writeFileSync(
      path.join(root, ".agent-context", "manifest.json"),
      `${JSON.stringify(buildContextManifest(context, [...writeResult.files, ...result.files]), null, 2)}\n`,
      "utf8"
    );
    const freshContext = await buildContextPackage(root);
    assert.equal(assessFreshness(freshContext).status, "fresh");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

function createDeltaRepo(): string {
  const root = mkdtempSync(path.join(tmpdir(), "opencode-plusplus-delta-"));
  mkdirSync(path.join(root, "src", "auth"), { recursive: true });
  mkdirSync(path.join(root, "src", "api"), { recursive: true });
  mkdirSync(path.join(root, "test", "auth"), { recursive: true });
  writeFileSync(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node --test", check: "tsc --noEmit" } }), "utf8");
  writeFileSync(path.join(root, "src", "auth", "session.ts"), "export function loginSession() { return 'ok'; }\n", "utf8");
  writeFileSync(path.join(root, "src", "api", "login.ts"), "import { loginSession } from '../auth/session.js';\nexport const login = loginSession;\n", "utf8");
  writeFileSync(path.join(root, "test", "auth", "session.test.ts"), "import '../../src/auth/session.js';\n", "utf8");
  return root;
}

async function prepareGeneratedContext(root: string): Promise<void> {
  const context = await buildContextPackage(root);
  writeContextPackage(context);
  runGit(root, ["init"]);
  runGit(root, ["checkout", "-b", "main"]);
  runGit(root, ["config", "user.email", "opencode-plusplus@example.com"]);
  runGit(root, ["config", "user.name", "Repo Context"]);
  runGit(root, ["add", "."]);
  runGit(root, ["commit", "-m", "initial"]);
}
