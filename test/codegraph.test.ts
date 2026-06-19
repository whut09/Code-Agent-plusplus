import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { buildContextPackage } from "../src/core/context-builder.js";
import { normalizeCodeGraphHits, normalizeCodeGraphImpact, normalizeCodeGraphTests } from "../src/integrations/codegraph.js";

function createCodeGraphRepo(): string {
  const root = mkdtempSync(path.join(tmpdir(), "opencode-plusplus-codegraph-"));
  mkdirSync(path.join(root, "src", "auth"), { recursive: true });
  mkdirSync(path.join(root, "test", "auth"), { recursive: true });
  writeFileSync(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node --test" } }), "utf8");
  writeFileSync(path.join(root, "src", "auth", "session.ts"), "export function refreshSessionTimeout() { return 'ok'; }\n", "utf8");
  writeFileSync(path.join(root, "test", "auth", "session.test.ts"), "refreshSessionTimeout();\n", "utf8");
  return root;
}

test("CodeGraph adapter normalizes explore hits into context hits", async () => {
  const root = createCodeGraphRepo();
  try {
    const context = await buildContextPackage(root);
    const hits = normalizeCodeGraphHits(
      {
        results: [
          {
            path: "src/auth/session.ts",
            symbol: "refreshSessionTimeout",
            score: 87,
            snippet: "session timeout logic"
          }
        ]
      },
      context,
      5
    );

    assert.equal(hits.length, 1);
    assert.equal(hits[0]?.path, "src/auth/session.ts");
    assert.equal(hits[0]?.source, "codegraph");
    assert.equal(hits[0]?.moduleName, "auth");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("CodeGraph adapter normalizes affected output for impact and tests", () => {
  const raw = {
    directDependents: ["src/api/login.ts"],
    downstreamFiles: ["src/app.ts", "test/auth/session.test.ts"],
    tests: ["test/api/login.test.ts"],
    relatedTests: ["test/auth/session.test.ts"],
    riskFactors: ["symbol fanout is high"]
  };

  const impact = normalizeCodeGraphImpact(raw);
  assert.deepEqual(impact.directDependents, ["src/api/login.ts"]);
  assert.deepEqual(impact.transitiveDependents, ["src/app.ts"]);
  assert.deepEqual(impact.relatedTests, ["test/api/login.test.ts", "test/auth/session.test.ts"]);
  assert.deepEqual(impact.riskFactors, ["symbol fanout is high"]);

  const tests = normalizeCodeGraphTests(raw);
  assert.deepEqual(tests.minimalTests, ["test/api/login.test.ts"]);
  assert.deepEqual(tests.regressionTests, ["test/auth/session.test.ts"]);
});
