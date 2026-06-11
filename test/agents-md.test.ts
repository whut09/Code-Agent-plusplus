import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
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

    assert.match(agents, /# Generated Agent Guide/);
    assert.match(agents, /## Must-Read Rules/);
    assert.match(agents, /## Default Workflow/);
    assert.match(agents, /## Context Layers/);
    assert.match(agents, /npm run check/);
    assert.match(agents, /Do not load the full `\.agent-context\/` directory/);
    assert.match(agents, /Prefer source files over generated summaries/);
    assert.match(agents, /`L1 \.agent-context\/repo-summary\.md`/);
    assert.match(agents, /`L2 \.agent-context\/tasks\/`/);
    assert.match(agents, /`L3 \.agent-context\/key-files\.md`/);
    assert.doesNotMatch(agents, /## Project Overview/);
    assert.doesNotMatch(agents, /## Module Map/);
    assert.ok(agents.length < 4800);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("default AGENTS.md prefers source anchors over generic config anchors", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "repo-context-agents-"));

  try {
    mkdirSync(path.join(root, "src", "auth"), { recursive: true });
    writeFileSync(path.join(root, "package.json"), JSON.stringify({
      scripts: { typecheck: "tsc --noEmit", test: "node --test", dev: "node src/index.js" }
    }), "utf8");
    writeFileSync(path.join(root, "tsconfig.json"), JSON.stringify({ compilerOptions: { module: "esnext" } }), "utf8");
    writeFileSync(path.join(root, "src", "index.ts"), `
export { login } from "./auth/session.ts";
`, "utf8");
    writeFileSync(path.join(root, "src", "auth", "session.ts"), `
export function login() { return "ok"; }
`, "utf8");

    const context = await buildContextPackage(root);
    const agents = renderAgentsMd(context);

    assert.match(agents, /Anchor: `src\/index\.ts`|Anchor: `src\/auth\/session\.ts`/);
    assert.doesNotMatch(agents, /Anchor: `tsconfig\.json`/);
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

    assert.match(agents, /# Generated Agent Guide/);
    assert.match(agents, /## Default Workflow/);
    assert.match(agents, /## Project Overview/);
    assert.match(agents, /## Module Map/);
    assert.match(agents, /## Context Layers/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
