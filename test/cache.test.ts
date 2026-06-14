import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { buildContextPackage } from "../src/core/context-builder.js";

interface FileHashesJson {
  files: Record<string, { hash: string }>;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

test("build context writes and refreshes incremental cache", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "code-agent-plusplus-cache-"));

  try {
    mkdirSync(path.join(root, ".git"));
    mkdirSync(path.join(root, "src"), { recursive: true });
    writeFileSync(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node --test" } }), "utf8");
    writeFileSync(path.join(root, "src", "a.ts"), "export const a = 1;\n", "utf8");
    writeFileSync(path.join(root, "src", "b.ts"), "import { a } from './a.js';\nexport const b = a;\n", "utf8");

    const firstContext = await buildContextPackage(root);
    assert.equal(firstContext.cacheStats.enabled, true);
    assert.equal(firstContext.cacheStats.indexHits, 0);
    assert.ok(firstContext.cacheStats.indexMisses >= 3);

    const cacheDir = path.join(root, ".agent-context", "cache");
    for (const fileName of ["file-hashes.json", "index-cache.json", "graph-cache.json", "tokenizer-cache.json"]) {
      assert.ok(existsSync(path.join(cacheDir, fileName)), `${fileName} should exist`);
    }

    const firstHashes = readJson<FileHashesJson>(path.join(cacheDir, "file-hashes.json"));
    const firstAHash = firstHashes.files["src/a.ts"].hash;
    const firstBHash = firstHashes.files["src/b.ts"].hash;

    writeFileSync(path.join(root, "src", "a.ts"), "export const a = 2;\nexport const changed = true;\n", "utf8");
    const context = await buildContextPackage(root);
    const secondHashes = readJson<FileHashesJson>(path.join(cacheDir, "file-hashes.json"));

    assert.notEqual(secondHashes.files["src/a.ts"].hash, firstAHash);
    assert.equal(secondHashes.files["src/b.ts"].hash, firstBHash);
    assert.ok(context.cacheStats.indexHits >= 2);
    assert.ok(context.cacheStats.indexMisses >= 1);
    assert.equal(context.cacheStats.graphMisses, 1);
    assert.ok(context.index.files.some((file) => file.path === "src/a.ts" && file.exports.includes("changed")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
