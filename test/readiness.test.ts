import assert from "node:assert/strict";
import test from "node:test";
import { assessReadiness } from "../src/core/readiness.js";
import type { DependencyGraph, RepoIndex, RepoScan } from "../src/core/types.js";

test("readiness reports missing architecture documentation and large undocumented modules", () => {
  const report = assessReadiness(scan(["README.md"]), index(false), graph());

  assert.ok(report.missing.includes("No architecture summary detected."));
  assert.ok(report.missing.includes("Large undocumented module: src/core."));
  assert.ok(report.score < 100);
});

test("readiness recognizes architecture documentation and documented modules", () => {
  const report = assessReadiness(scan(["README.md", "docs/architecture.md", "docs/core.md"]), index(true), graph());

  assert.ok(report.categories.find((category) => category.category === "architecture")?.evidence.includes("Architecture documentation detected."));
  assert.equal(report.missing.some((item) => item.includes("Large undocumented module")), false);
});

function scan(paths: string[]): RepoScan {
  return {
    root: "C:/repo",
    files: paths.map((path) => ({
      path,
      absolutePath: `C:/repo/${path}`,
      extension: ".md",
      sizeBytes: 100,
      kind: "docs",
      language: "Markdown",
      tokenEstimate: 25,
      isBinary: false,
      isGenerated: false,
      isTest: false
    })),
    languages: ["TypeScript"],
    frameworks: [],
    packageManagers: ["npm"],
    configFiles: [],
    entrypoints: ["src/index.ts"],
    testCommands: ["npm test"],
    runCommands: ["npm start"],
    lintCommands: [],
    typecheckCommands: [],
    ciFiles: [],
    envExampleFiles: [],
    migrationFiles: []
  };
}

function index(documentCore: boolean): RepoIndex {
  const coreFiles = Array.from({ length: 51 }, (_, index) => `src/core/file-${index}.ts`);
  return {
    files: documentCore ? [{
      path: "docs/core.md",
      absolutePath: "C:/repo/docs/core.md",
      extension: ".md",
      sizeBytes: 100,
      kind: "docs",
      language: "Markdown",
      tokenEstimate: 25,
      isBinary: false,
      isGenerated: false,
      isTest: false,
      imports: [],
      exports: [],
      symbols: [],
      summary: "Documents the core module.",
      analyzer: "generic",
      confidence: "low",
      evidence: [],
      moduleName: "docs",
      importanceScore: 0,
      importanceReasons: []
    }] : [],
    imports: [],
    symbols: [{ name: "main", kind: "function", filePath: "src/index.ts", line: 1 }],
    modules: [
      {
        name: "core",
        pathPrefix: "src/core",
        files: coreFiles,
        imports: [],
        summary: "core contains 51 files.",
        importanceScore: 100
      },
      {
        name: "cli",
        pathPrefix: "src/cli",
        files: ["src/cli/index.ts"],
        imports: ["core"],
        summary: "cli contains one file.",
        importanceScore: 20
      }
    ]
  };
}

function graph(): DependencyGraph {
  return {
    fileEdges: [{ from: "src/cli/index.ts", to: "src/core/file-0.ts", specifier: "../core/file-0.js", isExternal: false }],
    moduleEdges: [{ from: "cli", to: "core", count: 1 }]
  };
}
