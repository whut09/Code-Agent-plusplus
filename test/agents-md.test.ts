import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { buildContextPackage } from "../src/core/context-builder.js";
import { renderAgentsMd } from "../src/outputs/agents-md.js";

test("default AGENTS.md is minimal operating constraints", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "repo-context-agents-"));

  try {
    writeFileSync(path.join(root, "package.json"), JSON.stringify({
      scripts: { check: "tsc --noEmit", test: "node --test", dev: "tsx src/index.ts" }
    }), "utf8");
    writeFileSync(path.join(root, "src-index.ts"), "export const value = 1;\n", "utf8");

    const context = await buildContextPackage(root);
    const agents = renderAgentsMd(context);

    assert.match(agents, /# AGENTS\.md/);
    assert.match(agents, /## Must-Read Rules/);
    assert.match(agents, /## Deep Context/);
    assert.match(agents, /npm run check/);
    assert.match(agents, /\.agent-context\/key-files\.md/);
    assert.doesNotMatch(agents, /## Project Overview/);
    assert.doesNotMatch(agents, /## Module Map/);
    assert.ok(agents.length < 4800);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("balanced AGENTS.md keeps expanded summary behind explicit mode", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "repo-context-agents-"));

  try {
    writeFileSync(path.join(root, "repo-context.config.yml"), `
agents:
  mode: balanced
`, "utf8");
    writeFileSync(path.join(root, "package.json"), JSON.stringify({
      scripts: { check: "tsc --noEmit", test: "node --test" }
    }), "utf8");
    writeFileSync(path.join(root, "index.ts"), "export const value = 1;\n", "utf8");

    const context = await buildContextPackage(root);
    const agents = renderAgentsMd(context);

    assert.match(agents, /# Agent Guide/);
    assert.match(agents, /## Project Overview/);
    assert.match(agents, /## Module Map/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
