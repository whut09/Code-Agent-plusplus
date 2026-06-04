import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { buildContextPackage } from "../src/core/context-builder.js";
import { buildTaskPack } from "../src/outputs/task-context.js";

test("task pack expands lexical matches through graph and related tests", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "repo-context-task-"));
  try {
    mkdirSync(path.join(root, "src", "auth"), { recursive: true });
    mkdirSync(path.join(root, "test", "auth"), { recursive: true });
    writeFileSync(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node --test" } }), "utf8");
    writeFileSync(path.join(root, "src", "auth", "session.ts"), `
export function loginSession() { return "ok"; }
`, "utf8");
    writeFileSync(path.join(root, "src", "auth", "middleware.ts"), `
import { loginSession } from "./session.js";
export function authMiddleware() { return loginSession(); }
`, "utf8");
    writeFileSync(path.join(root, "test", "auth", "session.test.ts"), `
import { loginSession } from "../../src/auth/session.js";
loginSession();
`, "utf8");

    const context = await buildContextPackage(root);
    const pack = buildTaskPack(context, "fix login timeout bug", { type: "bugfix", tokenBudget: 2000 });
    const paths = pack.files.map((file) => file.path);

    assert.equal(pack.type, "bugfix");
    assert.ok(paths.includes("src/auth/session.ts"));
    assert.ok(paths.includes("src/auth/middleware.ts"));
    assert.ok(paths.includes("test/auth/session.test.ts"));
    assert.ok(pack.estimatedTokens <= pack.tokenBudget);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
