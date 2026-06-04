import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { loadConfig } from "../src/config/load-config.js";
import { starterConfig } from "../src/config/starter-config.js";

test("invalid target fails instead of silently falling back", () => {
  const root = mkdtempSync(path.join(tmpdir(), "repo-context-config-"));
  try {
    writeFileSync(path.join(root, "repo-context.config.yml"), "target: curser\n", "utf8");
    assert.throws(() => loadConfig(root), /Invalid target "curser"/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("enabled LLM requires non-placeholder credentials", () => {
  const root = mkdtempSync(path.join(tmpdir(), "repo-context-config-"));
  try {
    writeFileSync(path.join(root, "repo-context.local.yml"), `
llm:
  enabled: true
  baseUrl: xx
  apiKey: xx
  model: xx
`, "utf8");
    assert.throws(() => loadConfig(root), /llm\.baseUrl must be configured/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("starter config is valid and contains all output switches", () => {
  const root = mkdtempSync(path.join(tmpdir(), "repo-context-config-"));
  try {
    const content = starterConfig();
    writeFileSync(path.join(root, "repo-context.config.yml"), content, "utf8");
    const config = loadConfig(root);
    assert.equal(config.target, "codex");
    assert.deepEqual(config.outputs, {
      agents: true,
      modules: true,
      graph: true,
      tasks: true,
      readiness: true,
      rag: true
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("unknown output switches fail fast", () => {
  const root = mkdtempSync(path.join(tmpdir(), "repo-context-config-"));
  try {
    writeFileSync(path.join(root, "repo-context.config.yml"), `
outputs:
  grahp: true
`, "utf8");
    assert.throws(() => loadConfig(root), /Unknown outputs option: grahp/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
