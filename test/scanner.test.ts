import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { DEFAULT_CONFIG } from "../src/config/defaults.js";
import { scanRepository } from "../src/core/scanner.js";

test("scanner reports commands using the repository package manager", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "repo-context-scan-"));

  try {
    writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({
        scripts: {
          dev: "vite",
          test: "vitest",
          check: "tsc --noEmit"
        }
      }),
      "utf8"
    );
    writeFileSync(path.join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n", "utf8");

    const scan = await scanRepository(root, DEFAULT_CONFIG);

    assert.deepEqual(scan.packageManagers, ["pnpm"]);
    assert.deepEqual(scan.runCommands, ["pnpm run dev"]);
    assert.deepEqual(scan.testCommands, ["pnpm run test"]);
    assert.deepEqual(scan.typecheckCommands, ["pnpm run check"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
