import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { buildContextPackage } from "../src/core/context-builder.js";
import { runGit } from "../src/core/git.js";
import { buildTestSelection, renderTestSelection } from "../src/outputs/test-selector.js";

function createTestSelectorRepo(): string {
  const root = mkdtempSync(path.join(tmpdir(), "repo-context-tests-"));
  mkdirSync(path.join(root, "src", "auth"), { recursive: true });
  mkdirSync(path.join(root, "src", "api"), { recursive: true });
  mkdirSync(path.join(root, "test", "auth"), { recursive: true });
  mkdirSync(path.join(root, "test", "api"), { recursive: true });
  writeFileSync(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node --test", check: "tsc --noEmit" } }), "utf8");
  writeFileSync(path.join(root, "src", "auth", "session.ts"), "export function loginSession() { return 'ok'; }\n", "utf8");
  writeFileSync(
    path.join(root, "src", "auth", "middleware.ts"),
    "import { loginSession } from './session.js';\nexport function authMiddleware() { return loginSession(); }\n",
    "utf8"
  );
  writeFileSync(
    path.join(root, "src", "api", "login.ts"),
    "import { authMiddleware } from '../auth/middleware.js';\nexport function loginApi() { return authMiddleware(); }\n",
    "utf8"
  );
  writeFileSync(path.join(root, "test", "auth", "session.test.ts"), "import { loginSession } from '../../src/auth/session.js';\nloginSession();\n", "utf8");
  writeFileSync(path.join(root, "test", "api", "login.test.ts"), "import { loginApi } from '../../src/api/login.js';\nloginApi();\n", "utf8");
  return root;
}

test("test selector chooses minimal and regression tests for a file", async () => {
  const root = createTestSelectorRepo();
  try {
    const context = await buildContextPackage(root);
    const selection = buildTestSelection(context, { forPaths: ["src/auth/session.ts"] });

    assert.deepEqual(selection.minimalTests, ["test/auth/session.test.ts"]);
    assert.ok(selection.recommendedRegressionTests.includes("test/api/login.test.ts"));
    assert.ok(selection.minimalCommands.includes("npm run test -- test/auth/session.test.ts"));
    assert.ok(selection.recommendedCommands.includes("npm run test -- test/api/login.test.ts"));
    assert.ok(selection.recommendedCommands.includes("npm run check"));
    assert.ok(selection.fullConfidenceCommands.includes("npm run test"));

    const markdown = renderTestSelection(context, { forPaths: ["src/auth/session.ts"] });
    assert.match(markdown, /## Minimal tests/);
    assert.match(markdown, /## Recommended regression tests/);
    assert.match(markdown, /## Full confidence/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("test selector supports git diff targets", async () => {
  const root = createTestSelectorRepo();
  try {
    runGit(root, ["init"]);
    runGit(root, ["checkout", "-b", "main"]);
    runGit(root, ["config", "user.email", "repo-context@example.com"]);
    runGit(root, ["config", "user.name", "Repo Context"]);
    runGit(root, ["add", "."]);
    runGit(root, ["commit", "-m", "initial"]);
    writeFileSync(path.join(root, "src", "auth", "session.ts"), "export function loginSession() { return 'fixed'; }\n", "utf8");

    const context = await buildContextPackage(root);
    const selection = buildTestSelection(context, { diff: true, base: "main" });

    assert.deepEqual(selection.targetFiles, ["src/auth/session.ts"]);
    assert.ok(selection.minimalCommands.includes("npm run test -- test/auth/session.test.ts"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("test selector runs changed test files directly", async () => {
  const root = createTestSelectorRepo();
  try {
    const context = await buildContextPackage(root);
    const selection = buildTestSelection(context, { forPaths: ["test/auth/session.test.ts"] });

    assert.deepEqual(selection.minimalTests, ["test/auth/session.test.ts"]);
    assert.ok(selection.minimalCommands.includes("npm run test -- test/auth/session.test.ts"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("test selector diff includes untracked runnable tests", async () => {
  const root = createTestSelectorRepo();
  try {
    runGit(root, ["init"]);
    runGit(root, ["checkout", "-b", "main"]);
    runGit(root, ["config", "user.email", "repo-context@example.com"]);
    runGit(root, ["config", "user.name", "Repo Context"]);
    runGit(root, ["add", "."]);
    runGit(root, ["commit", "-m", "initial"]);
    writeFileSync(path.join(root, "test", "auth", "refresh.test.ts"), "import { loginSession } from '../../src/auth/session.js';\nloginSession();\n", "utf8");

    const context = await buildContextPackage(root);
    const selection = buildTestSelection(context, { diff: true, base: "main" });

    assert.ok(selection.targetFiles.includes("test/auth/refresh.test.ts"));
    assert.ok(selection.minimalCommands.includes("npm run test -- test/auth/refresh.test.ts"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
