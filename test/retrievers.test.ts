import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { buildContextPackage } from "../src/core/context-builder.js";
import { createContextRetriever, renderContextHits } from "../src/retrievers/index.js";

function createRetrieverRepo(): string {
  const root = mkdtempSync(path.join(tmpdir(), "opencode-plusplus-retriever-"));
  mkdirSync(path.join(root, "src", "auth"), { recursive: true });
  mkdirSync(path.join(root, "src", "billing"), { recursive: true });
  mkdirSync(path.join(root, "test", "auth"), { recursive: true });
  writeFileSync(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node --test", check: "tsc --noEmit" } }), "utf8");
  writeFileSync(path.join(root, "src", "auth", "session.ts"), "export function refreshSessionTimeout() { return 'session timeout'; }\n", "utf8");
  writeFileSync(
    path.join(root, "src", "auth", "middleware.ts"),
    "import { refreshSessionTimeout } from './session.js';\nexport function authMiddleware() { return refreshSessionTimeout(); }\n",
    "utf8"
  );
  writeFileSync(path.join(root, "src", "billing", "invoice.ts"), "export function invoiceTotal() { return 42; }\n", "utf8");
  writeFileSync(
    path.join(root, "test", "auth", "session.test.ts"),
    "import { refreshSessionTimeout } from '../../src/auth/session.js';\nrefreshSessionTimeout();\n",
    "utf8"
  );
  return root;
}

test("static retriever returns task-relevant context hits", async () => {
  const root = createRetrieverRepo();
  try {
    const context = await buildContextPackage(root);
    const retriever = createContextRetriever(context, "static");
    const hits = await retriever.search("fix session timeout", { topK: 5, includeTests: true });

    assert.ok(hits.some((hit) => hit.path === "src/auth/session.ts"));
    assert.ok(hits.every((hit) => hit.source === "static"));
    assert.ok(hits[0].score >= hits[hits.length - 1].score);

    const markdown = renderContextHits("fix session timeout", "static", hits);
    assert.match(markdown, /# Context Retrieval/);
    assert.match(markdown, /src\/auth\/session\.ts/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("hybrid retriever merges static and ripgrep protocol hits", async () => {
  const root = createRetrieverRepo();
  try {
    const context = await buildContextPackage(root);
    const retriever = createContextRetriever(context, "hybrid");
    const hits = await retriever.search("session timeout", { topK: 5, includeTests: true, changedFiles: ["src/auth/session.ts"] });

    assert.ok(hits.some((hit) => hit.path === "src/auth/session.ts"));
    assert.ok(hits.every((hit) => hit.source === "hybrid"));
    assert.ok(hits.some((hit) => Array.isArray(hit.metadata.sources)));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("CodeGraph retriever falls back when no CodeGraph project exists", async () => {
  const root = createRetrieverRepo();
  try {
    const context = await buildContextPackage(root);
    const retriever = createContextRetriever(context, "codegraph");
    const hits = await retriever.search("session timeout", { topK: 5, includeTests: true });

    assert.ok(hits.some((hit) => hit.path === "src/auth/session.ts"));
    assert.ok(hits.some((hit) => typeof hit.metadata.codegraphFallbackReason === "string"));

    const markdown = renderContextHits("session timeout", "codegraph", hits);
    assert.match(markdown, /Fallback: No \.codegraph directory detected/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("external retriever protocols fail with adapter guidance", async () => {
  const root = createRetrieverRepo();
  try {
    const context = await buildContextPackage(root);
    const retriever = createContextRetriever(context, "lightrag");
    await assert.rejects(() => retriever.search("session timeout", { topK: 3 }), /requires an external service adapter/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
