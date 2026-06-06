import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { buildContextPackage } from "../src/core/context-builder.js";
import { writeContextPackage } from "../src/outputs/writer.js";

test("writer honors optional output switches", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "repo-context-"));

  try {
    writeFileSync(path.join(root, "package.json"), JSON.stringify({
      scripts: { test: "node --test", start: "node src/index.js" }
    }), "utf8");
    writeFileSync(path.join(root, "src-index.ts"), "export const value = 1;\n", "utf8");

    const initialContext = await buildContextPackage(root);
    writeContextPackage(initialContext);
    assert.equal(existsSync(path.join(root, "AGENTS.md")), true);
    assert.equal(existsSync(path.join(root, ".agent-context", "graphs")), true);
    assert.equal(existsSync(path.join(root, ".agent-context", "rag")), true);

    writeFileSync(path.join(root, "repo-context.config.yml"), `
outputs:
  agents: false
  modules: false
  graph: false
  tasks: false
  readiness: false
  rag: false
`, "utf8");

    const context = await buildContextPackage(root);
    writeContextPackage(context);

    assert.equal(existsSync(path.join(root, "AGENTS.md")), false);
    assert.equal(existsSync(path.join(root, ".agent-context", "module-map.md")), false);
    assert.equal(existsSync(path.join(root, ".agent-context", "dependency-graph.md")), false);
    assert.equal(existsSync(path.join(root, ".agent-context", "readiness.md")), false);
    assert.equal(existsSync(path.join(root, ".agent-context", "tasks")), false);
    assert.equal(existsSync(path.join(root, ".agent-context", "rag")), false);
    assert.equal(existsSync(path.join(root, ".agent-context", "repo-summary.md")), true);
    assert.equal(existsSync(path.join(root, ".agent-context", "token-savings.md")), true);
    const tokenReport = JSON.parse(readFileSync(path.join(root, ".agent-context", "token-savings.json"), "utf8")) as {
      originalRepoTokens?: { mode: string; tokenizer: string; tokens: number };
      contextPackTokens?: { mode: string; total?: number; files?: Record<string, number> };
      actualOutputTokens?: { total: number; totalTokens: number; files: Record<string, number> };
    };
    assert.equal(tokenReport.originalRepoTokens?.mode, "estimated");
    assert.equal(tokenReport.contextPackTokens?.mode, "actual");
    assert.ok(tokenReport.actualOutputTokens);
    assert.ok(tokenReport.actualOutputTokens.total > 0);
    assert.ok(Object.keys(tokenReport.actualOutputTokens.files).length > 0);
    assert.equal(Object.keys(tokenReport.actualOutputTokens.files).some((file) => file.includes("index/files.json")), false);
    const onboarding = readFileSync(path.join(root, ".agent-context", "onboarding.md"), "utf8");
    assert.equal(onboarding.includes("AGENTS.md"), false);
    assert.equal(onboarding.includes("dependency-graph.md"), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("RAG export respects chunkTokenLimit", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "repo-context-rag-"));

  try {
    writeFileSync(path.join(root, "repo-context.config.yml"), `
rag:
  provider: lightrag
  chunkTokenLimit: 12
`, "utf8");
    writeFileSync(path.join(root, "index.ts"), `
export const alpha = 1;
export const beta = 2;
export const gamma = 3;
export const delta = 4;
export const epsilon = 5;
`, "utf8");

    const context = await buildContextPackage(root);
    writeContextPackage(context);

    const lines = readFileSync(path.join(root, ".agent-context", "rag", "documents.jsonl"), "utf8")
      .trim()
      .split(/\r?\n/)
      .map((line) => JSON.parse(line) as { kind: string; text: string; tokens: number });
    const source = lines.find((line) => line.kind === "source");

    assert.ok(source);
    assert.ok(source.text.endsWith("[truncated]"));
    assert.ok(source.tokens <= 12);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
