import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { buildContextPackage } from "../src/core/context-builder.js";
import { buildTaskPack, renderTaskContext } from "../src/outputs/task-context.js";

test("task pack expands lexical matches through graph and related tests", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "repo-context-task-"));
  try {
    mkdirSync(path.join(root, "src", "auth"), { recursive: true });
    mkdirSync(path.join(root, "test", "auth"), { recursive: true });
    writeFileSync(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node --test" } }), "utf8");
    writeFileSync(
      path.join(root, "src", "auth", "session.ts"),
      `
export function loginSession() { return "ok"; }
`,
      "utf8"
    );
    writeFileSync(
      path.join(root, "src", "auth", "middleware.ts"),
      `
import { loginSession } from "./session.js";
export function authMiddleware() { return loginSession(); }
`,
      "utf8"
    );
    writeFileSync(
      path.join(root, "test", "auth", "session.test.ts"),
      `
import { loginSession } from "../../src/auth/session.js";
loginSession();
`,
      "utf8"
    );

    const context = await buildContextPackage(root);
    const pack = buildTaskPack(context, "fix login timeout bug", { type: "bugfix", tokenBudget: 2000 });
    const paths = pack.files.map((file) => file.path);

    assert.equal(pack.type, "bugfix");
    assert.ok(paths.includes("src/auth/session.ts"));
    assert.ok(paths.includes("src/auth/middleware.ts"));
    assert.ok(paths.includes("test/auth/session.test.ts"));
    assert.ok(pack.estimatedTokens <= pack.tokenBudget);
    assert.ok(pack.readFirst.some((file) => file.path === "src/auth/session.ts"));
    assert.ok(pack.inspectIfNeeded.some((file) => file.path === "test/auth/session.test.ts"));
    assert.ok(pack.budget.buckets.some((bucket) => bucket.name === "direct-source" && bucket.tokens > 0));
    assert.ok(pack.budget.buckets.some((bucket) => bucket.name === "tests" && bucket.tokens > 0));
    assert.ok(pack.suggestedCommands.some((command) => command.includes("npm run test")));

    const markdown = renderTaskContext(context, "fix login timeout bug", { type: "bugfix", tokenBudget: 2000 });
    assert.match(markdown, /# Task Context: fix login timeout bug/);
    assert.match(markdown, /## Read First/);
    assert.match(markdown, /## Budget Packing/);
    assert.match(markdown, /Suggested Commands/);

    const chinesePack = buildTaskPack(context, "修复登录超时", { type: "bugfix", tokenBudget: 2000 });
    assert.ok(chinesePack.files.some((file) => file.path === "src/auth/session.ts"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
