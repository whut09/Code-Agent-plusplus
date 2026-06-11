import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { buildContextPackage } from "../src/core/context-builder.js";
import { runGit } from "../src/core/git.js";
import { buildChangeImpactReport, renderChangeImpactReport } from "../src/outputs/impact.js";

function createImpactRepo(): string {
  const root = mkdtempSync(path.join(tmpdir(), "repo-context-impact-"));
  mkdirSync(path.join(root, "src", "auth"), { recursive: true });
  mkdirSync(path.join(root, "src", "api"), { recursive: true });
  mkdirSync(path.join(root, "test", "auth"), { recursive: true });
  mkdirSync(path.join(root, "test", "api"), { recursive: true });
  writeFileSync(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node --test", check: "tsc --noEmit" } }), "utf8");
  writeFileSync(path.join(root, "src", "auth", "session.ts"), "export function loginSession() { return 'ok'; }\n", "utf8");
  writeFileSync(path.join(root, "src", "auth", "middleware.ts"), "import { loginSession } from './session.js';\nexport function authMiddleware() { return loginSession(); }\n", "utf8");
  writeFileSync(path.join(root, "src", "api", "login.ts"), "import { authMiddleware } from '../auth/middleware.js';\nexport function loginApi() { return authMiddleware(); }\n", "utf8");
  writeFileSync(path.join(root, "src", "app.ts"), "import { loginApi } from './api/login.js';\nexport function app() { return loginApi(); }\n", "utf8");
  writeFileSync(path.join(root, "src", "server.ts"), "import { app } from './app.js';\napp();\n", "utf8");
  writeFileSync(path.join(root, "test", "auth", "session.test.ts"), "import { loginSession } from '../../src/auth/session.js';\nloginSession();\n", "utf8");
  writeFileSync(path.join(root, "test", "api", "login.test.ts"), "import { loginApi } from '../../src/api/login.js';\nloginApi();\n", "utf8");
  return root;
}

test("impact report traces dependents, related tests, risk, and verification", async () => {
  const root = createImpactRepo();
  try {
    runGit(root, ["init"]);
    runGit(root, ["checkout", "-b", "main"]);
    runGit(root, ["config", "user.email", "repo-context@example.com"]);
    runGit(root, ["config", "user.name", "Repo Context"]);
    runGit(root, ["add", "."]);
    runGit(root, ["commit", "-m", "initial"]);
    writeFileSync(path.join(root, "src", "auth", "session.ts"), "export function loginSession() { return 'fixed'; }\n", "utf8");

    const context = await buildContextPackage(root);
    const report = buildChangeImpactReport(context, { base: "main" });

    assert.deepEqual(report.changedFiles, ["src/auth/session.ts"]);
    assert.ok(report.directDependents.includes("src/auth/middleware.ts"));
    assert.ok(report.transitiveDependents.includes("src/api/login.ts"));
    assert.ok(report.transitiveDependents.includes("src/app.ts"));
    assert.ok(report.transitiveDependents.includes("src/server.ts"));
    assert.ok(report.relatedTests.includes("test/auth/session.test.ts"));
    assert.ok(report.relatedTests.includes("test/api/login.test.ts"));
    assert.equal(report.risk, "Medium");
    assert.ok(report.requiredVerification.includes("npm run test -- auth"));
    assert.ok(report.requiredVerification.includes("npm run test -- login"));
    assert.ok(report.requiredVerification.includes("npm run check"));

    const markdown = renderChangeImpactReport(context, { base: "main" });
    assert.match(markdown, /# Change Impact Report/);
    assert.match(markdown, /## Direct dependents/);
    assert.match(markdown, /## Required verification/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
