import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { buildContextPackage } from "../src/core/context-builder.js";
import { validateContextPackage } from "../src/core/validator.js";
import { writeContextPackage } from "../src/outputs/writer.js";

test("validator detects token budget overflow and invalid generated JSON", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "code-agent-plusplus-validate-"));
  try {
    writeFileSync(path.join(root, "code-agent-plusplus.config.yml"), "tokenBudget: 10\n", "utf8");
    writeFileSync(path.join(root, "index.ts"), "export const value = 1;\n", "utf8");
    const context = await buildContextPackage(root);
    writeContextPackage(context);
    writeFileSync(path.join(root, ".agent-context", "index", "files.json"), "{invalid", "utf8");

    const report = validateContextPackage(context);

    assert.equal(report.valid, false);
    assert.ok(report.issues.some((issue) => issue.code === "token_budget_exceeded"));
    assert.ok(report.issues.some((issue) => issue.code === "invalid_generated_json"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
