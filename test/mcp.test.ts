import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { executeRepoContextMcpTool, repoContextMcpToolNames } from "../src/mcp/server.js";
import { runGit } from "../src/core/git.js";

function createMcpRepo(): string {
  const root = mkdtempSync(path.join(tmpdir(), "repo-context-mcp-"));
  mkdirSync(path.join(root, "src", "auth"), { recursive: true });
  mkdirSync(path.join(root, "src", "api"), { recursive: true });
  mkdirSync(path.join(root, "test", "auth"), { recursive: true });
  writeFileSync(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node --test", check: "tsc --noEmit" } }), "utf8");
  writeFileSync(path.join(root, "src", "auth", "session.ts"), "export function refreshSessionTimeout() { return 'ok'; }\n", "utf8");
  writeFileSync(
    path.join(root, "src", "auth", "middleware.ts"),
    "import { refreshSessionTimeout } from './session.js';\nexport function authMiddleware() { return refreshSessionTimeout(); }\n",
    "utf8"
  );
  writeFileSync(
    path.join(root, "src", "api", "login.ts"),
    "import { authMiddleware } from '../auth/middleware.js';\nexport function loginApi() { return authMiddleware(); }\n",
    "utf8"
  );
  writeFileSync(
    path.join(root, "test", "auth", "session.test.ts"),
    "import { refreshSessionTimeout } from '../../src/auth/session.js';\nrefreshSessionTimeout();\n",
    "utf8"
  );
  return root;
}

test("mcp server exposes repo context tools", async () => {
  assert.deepEqual(repoContextMcpToolNames, [
    "repo_context_build",
    "repo_context_plan",
    "repo_context_pack",
    "repo_context_retrieve",
    "repo_context_tests",
    "repo_context_impact",
    "repo_context_verify",
    "repo_context_explain"
  ]);
});

test("repo_context_retrieve returns hits and suggested commands", async () => {
  const root = createMcpRepo();
  try {
    const result = await executeRepoContextMcpTool("repo_context_retrieve", {
      repo: root,
      task: "fix login timeout bug",
      provider: "hybrid",
      topK: 5,
      includeTests: true
    });
    const hits = result.hits as Array<{ path: string }>;
    const suggestedCommands = result.suggestedCommands as string[];

    assert.ok(Array.isArray(hits));
    assert.ok(hits.some((hit) => hit.path === "src/auth/session.ts"));
    assert.ok(suggestedCommands.some((command) => command.includes("npm run test")));
    assert.ok(suggestedCommands.some((command) => command.includes("check")));
    assert.equal(result.provider, "hybrid");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("repo_context_verify includes contract check output", async () => {
  const root = createMcpRepo();
  try {
    runGit(root, ["init"]);
    runGit(root, ["checkout", "-b", "main"]);
    runGit(root, ["config", "user.email", "repo-context@example.com"]);
    runGit(root, ["config", "user.name", "Repo Context"]);
    runGit(root, ["add", "."]);
    runGit(root, ["commit", "-m", "initial"]);
    writeFileSync(path.join(root, "src", "auth", "session.ts"), "export function refreshSessionTimeout() { return 'fixed'; }\n", "utf8");

    const result = await executeRepoContextMcpTool("repo_context_verify", {
      repo: root,
      base: "main",
      diff: true
    });

    assert.match(String(result.markdown), /# Task Verify/);
    assert.match(String(result.markdown), /## Contract check/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
