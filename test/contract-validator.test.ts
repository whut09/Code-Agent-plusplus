import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { buildContextPackage } from "../src/core/context-builder.js";
import { runGit } from "../src/core/git.js";
import { renderContractValidationReport, validateContracts } from "../src/outputs/contract-validator.js";
import { renderTaskVerify } from "../src/outputs/task-harness.js";
import { writeContextPackage } from "../src/outputs/writer.js";

function createContractRepo(): string {
  const root = mkdtempSync(path.join(tmpdir(), "code-agent-plusplus-contract-validate-"));
  mkdirSync(path.join(root, "src", "core"), { recursive: true });
  mkdirSync(path.join(root, "src", "outputs"), { recursive: true });
  writeFileSync(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node --test", check: "tsc --noEmit" } }), "utf8");
  writeFileSync(path.join(root, "package-lock.json"), "{}\n", "utf8");
  writeFileSync(path.join(root, "src", "core", "indexer.ts"), "export const indexer = 1;\n", "utf8");
  writeFileSync(path.join(root, "src", "outputs", "markdown.ts"), "export const heading = 1;\n", "utf8");
  return root;
}

test("contract validator fails changed files that break edit boundaries", async () => {
  const root = createContractRepo();
  try {
    const initialContext = await buildContextPackage(root);
    writeContextPackage(initialContext);

    runGit(root, ["init"]);
    runGit(root, ["checkout", "-b", "main"]);
    runGit(root, ["config", "user.email", "code-agent-plusplus@example.com"]);
    runGit(root, ["config", "user.name", "Repo Context"]);
    runGit(root, ["add", "."]);
    runGit(root, ["commit", "-m", "initial"]);

    writeFileSync(path.join(root, "src", "core", "indexer.ts"), "import { heading } from '../outputs/markdown.js';\nexport const indexer = heading;\n", "utf8");
    writeFileSync(path.join(root, "package-lock.json"), '{"lockfileVersion":3}\n', "utf8");

    const context = await buildContextPackage(root);
    const report = validateContracts(context, { base: "main", diff: true });
    const markdown = renderContractValidationReport(context, { base: "main", diff: true });
    const verify = renderTaskVerify(context, { base: "main", diff: true });

    assert.equal(report.passed, false);
    assert.ok(report.violations.some((violation) => violation.rule === "architecture.contract.json#layers.core"));
    assert.ok(report.violations.some((violation) => violation.rule === "safety.contract.json#protectedPaths.lockfiles"));
    assert.match(markdown, /Contract check: failed/);
    assert.match(markdown, /src\/core\/indexer\.ts imports src\/outputs\/markdown\.ts/);
    assert.match(verify, /## Contract check/);
    assert.match(verify, /Contract check: failed/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("contract validator ignores regenerated repo context outputs", async () => {
  const root = createContractRepo();
  try {
    const initialContext = await buildContextPackage(root);
    writeContextPackage(initialContext);

    runGit(root, ["init"]);
    runGit(root, ["checkout", "-b", "main"]);
    runGit(root, ["config", "user.email", "code-agent-plusplus@example.com"]);
    runGit(root, ["config", "user.name", "Repo Context"]);
    runGit(root, ["add", "."]);
    runGit(root, ["commit", "-m", "initial"]);

    writeFileSync(path.join(root, ".agent-context", "repo-summary.md"), "# regenerated\n", "utf8");

    const context = await buildContextPackage(root);
    const report = validateContracts(context, { base: "main", diff: true });

    assert.equal(report.passed, true);
    assert.equal(
      report.violations.some((violation) => violation.file.startsWith(".agent-context/")),
      false
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
