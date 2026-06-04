import assert from "node:assert/strict";
import test from "node:test";
import { calculateTokenSavings } from "../src/core/token-savings.js";
import type { IndexedFile, RepoScan } from "../src/core/types.js";

test("token savings respects the configured budget when possible", () => {
  const files = Array.from({ length: 12 }, (_, index) => indexedFile(index));
  const scan = repoScan(files);
  const report = calculateTokenSavings(scan, files, { tokenBudget: 2200 });

  assert.equal(report.tokenBudget, 2200);
  assert.equal(report.withinBudget, true);
  assert.ok(report.selectedFiles > 0);
  assert.ok(report.selectedFiles < files.length);
  assert.ok(report.contextPackTokens <= report.tokenBudget);
});

test("token savings reports when even the minimum context exceeds budget", () => {
  const files = [indexedFile(0)];
  const report = calculateTokenSavings(repoScan(files), files, { tokenBudget: 10 });

  assert.equal(report.selectedFiles, 1);
  assert.equal(report.withinBudget, false);
});

function indexedFile(index: number): IndexedFile {
  return {
    path: `src/module-${index}.ts`,
    absolutePath: `C:/repo/src/module-${index}.ts`,
    extension: ".ts",
    sizeBytes: 4000,
    kind: "source",
    language: "TypeScript",
    tokenEstimate: 1000,
    isBinary: false,
    isGenerated: false,
    isTest: false,
    imports: Array.from({ length: 5 }, (_, dependency) => ({
      specifier: `./dependency-${dependency}.js`,
      resolvedPath: `src/dependency-${dependency}.ts`,
      isExternal: false
    })),
    exports: [`export${index}`],
    symbols: Array.from({ length: 10 }, (_, symbol) => ({
      name: `symbol${index}_${symbol}`,
      kind: "function",
      filePath: `src/module-${index}.ts`,
      line: symbol + 1
    })),
    summary: `Module ${index} handles repository context processing and related operations.`,
    moduleName: `module-${index}`,
    importanceScore: 100 - index,
    importanceReasons: ["entrypoint", "shared dependency"]
  };
}

function repoScan(files: IndexedFile[]): RepoScan {
  return {
    root: "C:/repo",
    files,
    languages: ["TypeScript"],
    frameworks: [],
    packageManagers: ["npm"],
    configFiles: ["package.json"],
    entrypoints: ["src/module-0.ts"],
    testCommands: ["npm test"],
    runCommands: ["npm start"]
  };
}
