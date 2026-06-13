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
    "repo_context_explain",
    "repo_context_start_loop",
    "repo_context_step",
    "repo_context_evaluate",
    "repo_context_repair",
    "repo_context_finalize"
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

test("mcp runtime tools drive an agent loop with trace and policy evidence", async () => {
  const root = createMcpRepo();
  try {
    runGit(root, ["init"]);
    runGit(root, ["checkout", "-b", "main"]);
    runGit(root, ["config", "user.email", "repo-context@example.com"]);
    runGit(root, ["config", "user.name", "Repo Context"]);
    runGit(root, ["add", "."]);
    runGit(root, ["commit", "-m", "initial"]);

    const started = await executeRepoContextMcpTool("repo_context_start_loop", {
      repo: root,
      task: "fix login timeout bug",
      agent: "codex",
      type: "bugfix",
      base: "main"
    });
    const traceId = String(started.traceId);
    assert.equal(started.runtime, "agent-native");
    assert.equal(traceId, "fix-login-timeout-bug");
    assert.ok(Array.isArray(started.mustInspect));

    writeFileSync(path.join(root, "src", "auth", "session.ts"), "export function refreshSessionTimeout() { return 'fixed'; }\n", "utf8");

    const step = await executeRepoContextMcpTool("repo_context_step", {
      repo: root,
      traceId,
      agent: "codex",
      action: "edit",
      files: ["src/auth/session.ts"],
      reason: "timeout logic"
    });
    assert.equal(step.traceId, traceId);

    const missingEvidence = await executeRepoContextMcpTool("repo_context_evaluate", {
      repo: root,
      task: "fix login timeout bug",
      traceId,
      type: "bugfix",
      base: "main",
      strict: true
    });
    assert.equal(missingEvidence.passed, false);
    assert.match(String(missingEvidence.markdown), /Policy Engine/);

    const repair = await executeRepoContextMcpTool("repo_context_repair", {
      repo: root,
      task: "fix login timeout bug",
      traceId,
      type: "bugfix",
      base: "main"
    });
    assert.ok((repair.requiredActions as string[]).some((action) => action.includes("validate-contracts")));

    await executeRepoContextMcpTool("repo_context_step", {
      repo: root,
      traceId,
      action: "run-test",
      command: "npm test -- test/auth/session.test.ts",
      result: "passed"
    });
    await executeRepoContextMcpTool("repo_context_step", {
      repo: root,
      traceId,
      action: "validate-contracts",
      command: "repo-context validate-contracts . --base main",
      result: "passed"
    });
    await executeRepoContextMcpTool("repo_context_build", {
      repo: root,
      target: "codex"
    });

    const finalized = await executeRepoContextMcpTool("repo_context_finalize", {
      repo: root,
      task: "fix login timeout bug",
      traceId,
      base: "main",
      finalState: "success"
    });
    assert.equal(finalized.passed, true);
    assert.equal(finalized.finalState, "success");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
