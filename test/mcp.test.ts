import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { executeCodeAgentPlusplusMcpTool, codeAgentPlusplusMcpToolNames } from "../src/mcp/server.js";
import { runGit } from "../src/core/git.js";

function createMcpRepo(): string {
  const root = mkdtempSync(path.join(tmpdir(), "code-agent-plusplus-mcp-"));
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
  assert.deepEqual(codeAgentPlusplusMcpToolNames, [
    "code_agent_plusplus_build",
    "code_agent_plusplus_plan",
    "code_agent_plusplus_pack",
    "code_agent_plusplus_retrieve",
    "code_agent_plusplus_tests",
    "code_agent_plusplus_impact",
    "code_agent_plusplus_verify",
    "code_agent_plusplus_explain",
    "code_agent_plusplus_start_loop",
    "code_agent_plusplus_step",
    "code_agent_plusplus_evaluate",
    "code_agent_plusplus_repair",
    "code_agent_plusplus_finalize"
  ]);
});

test("code_agent_plusplus_retrieve returns hits and suggested commands", async () => {
  const root = createMcpRepo();
  try {
    const result = await executeCodeAgentPlusplusMcpTool("code_agent_plusplus_retrieve", {
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

test("code_agent_plusplus_verify includes contract check output", async () => {
  const root = createMcpRepo();
  try {
    runGit(root, ["init"]);
    runGit(root, ["checkout", "-b", "main"]);
    runGit(root, ["config", "user.email", "code-agent-plusplus@example.com"]);
    runGit(root, ["config", "user.name", "Repo Context"]);
    runGit(root, ["add", "."]);
    runGit(root, ["commit", "-m", "initial"]);
    writeFileSync(path.join(root, "src", "auth", "session.ts"), "export function refreshSessionTimeout() { return 'fixed'; }\n", "utf8");

    const result = await executeCodeAgentPlusplusMcpTool("code_agent_plusplus_verify", {
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
    runGit(root, ["config", "user.email", "code-agent-plusplus@example.com"]);
    runGit(root, ["config", "user.name", "Repo Context"]);
    runGit(root, ["add", "."]);
    runGit(root, ["commit", "-m", "initial"]);

    const started = await executeCodeAgentPlusplusMcpTool("code_agent_plusplus_start_loop", {
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
    assert.equal(typeof started.blocking, "boolean");
    assert.ok(Array.isArray(started.requiredCommands));
    assert.ok(Array.isArray(started.allowedEditGlobs));
    assert.ok(Array.isArray(started.avoidEditGlobs));
    assert.ok(Array.isArray(started.missingEvidence));
    assert.equal(typeof (started.nextAction as { action?: unknown }).action, "string");

    writeFileSync(path.join(root, "src", "auth", "session.ts"), "export function refreshSessionTimeout() { return 'fixed'; }\n", "utf8");

    const step = await executeCodeAgentPlusplusMcpTool("code_agent_plusplus_step", {
      repo: root,
      traceId,
      agent: "codex",
      action: "edit",
      files: ["src/auth/session.ts"],
      reason: "timeout logic"
    });
    assert.equal(step.traceId, traceId);

    const missingEvidence = await executeCodeAgentPlusplusMcpTool("code_agent_plusplus_evaluate", {
      repo: root,
      task: "fix login timeout bug",
      traceId,
      type: "bugfix",
      base: "main",
      strict: true
    });
    assert.equal(missingEvidence.passed, false);
    assert.equal(missingEvidence.blocking, true);
    assert.ok((missingEvidence.missingEvidence as string[]).some((item) => item.includes("test") || item.includes("contract")));
    assert.ok((missingEvidence.requiredCommands as string[]).length > 0);
    assert.ok(Array.isArray(missingEvidence.mustInspect));
    assert.match(String(missingEvidence.markdown), /Policy Engine/);

    const repair = await executeCodeAgentPlusplusMcpTool("code_agent_plusplus_repair", {
      repo: root,
      task: "fix login timeout bug",
      traceId,
      type: "bugfix",
      base: "main"
    });
    assert.equal(repair.blocking, true);
    assert.ok(Array.isArray(repair.allowedEditGlobs));
    assert.ok((repair.requiredActions as string[]).some((action) => action.includes("validate-contracts")));

    await executeCodeAgentPlusplusMcpTool("code_agent_plusplus_step", {
      repo: root,
      traceId,
      action: "run-test",
      command: "npm test -- test/auth/session.test.ts",
      result: "passed"
    });
    await executeCodeAgentPlusplusMcpTool("code_agent_plusplus_step", {
      repo: root,
      traceId,
      action: "validate-contracts",
      command: "opencode-plusplus validate-contracts . --base main",
      result: "passed"
    });
    await executeCodeAgentPlusplusMcpTool("code_agent_plusplus_build", {
      repo: root,
      target: "codex"
    });

    const finalized = await executeCodeAgentPlusplusMcpTool("code_agent_plusplus_finalize", {
      repo: root,
      task: "fix login timeout bug",
      traceId,
      base: "main",
      finalState: "success"
    });
    assert.equal(finalized.passed, true);
    assert.equal(finalized.finalState, "success");
    assert.equal(finalized.blocking, false);
    assert.ok(Array.isArray(finalized.requiredCommands));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
