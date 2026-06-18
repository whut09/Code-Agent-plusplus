import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { buildContextPackage } from "../src/core/context-builder.js";
import { writeContextPackage } from "../src/outputs/renderers/writer.js";

test("writer honors optional output switches", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "code-agent-plusplus-"));

  try {
    writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({
        scripts: { test: "node --test", start: "node src/index.js" }
      }),
      "utf8"
    );
    writeFileSync(path.join(root, "src-index.ts"), "export const value = 1;\n", "utf8");

    const initialContext = await buildContextPackage(root);
    writeContextPackage(initialContext);
    assert.equal(existsSync(path.join(root, "AGENTS.md")), true);
    assert.equal(existsSync(path.join(root, "AGENTS.manual.md")), false);
    assert.equal(existsSync(path.join(root, ".agent-context", "AGENTS.generated.md")), true);
    assert.equal(existsSync(path.join(root, ".agent-context", "context-layers.md")), true);
    assert.equal(existsSync(path.join(root, ".agent-context", "graphs")), true);
    assert.equal(existsSync(path.join(root, ".agent-context", "rag")), true);

    writeFileSync(
      path.join(root, "code-agent-plusplus.config.yml"),
      `
outputs:
  agents: false
  modules: false
  graph: false
  tasks: false
  readiness: false
  rag: false
`,
      "utf8"
    );

    const context = await buildContextPackage(root);
    writeContextPackage(context);

    assert.equal(existsSync(path.join(root, "AGENTS.md")), false);
    assert.equal(existsSync(path.join(root, ".agent-context", "AGENTS.generated.md")), false);
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
    assert.equal(
      Object.keys(tokenReport.actualOutputTokens.files).some((file) => file.includes("index/files.json")),
      false
    );
    const onboarding = readFileSync(path.join(root, ".agent-context", "onboarding.md"), "utf8");
    assert.equal(onboarding.includes("AGENTS.md"), true);
    assert.equal(onboarding.includes("context-layers.md"), true);
    assert.equal(onboarding.includes("dependency-graph.md"), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("writer emits repo contract files for agent constraints", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "code-agent-plusplus-contracts-"));

  try {
    mkdirSync(path.join(root, "src", "auth"), { recursive: true });
    mkdirSync(path.join(root, "src", "core"), { recursive: true });
    mkdirSync(path.join(root, "src", "payment"), { recursive: true });
    mkdirSync(path.join(root, "test", "auth"), { recursive: true });
    writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({
        scripts: { test: "node --test", check: "tsc --noEmit", lint: "eslint ." }
      }),
      "utf8"
    );
    writeFileSync(path.join(root, "src", "core", "indexer.ts"), "export const indexer = 1;\n", "utf8");
    writeFileSync(path.join(root, "src", "auth", "session.ts"), "export const session = 1;\n", "utf8");
    writeFileSync(path.join(root, "src", "auth", "login.ts"), "import { session } from './session.js';\nexport const login = session;\n", "utf8");
    writeFileSync(path.join(root, "src", "payment", "charge.ts"), "export const charge = 1;\n", "utf8");
    writeFileSync(path.join(root, "test", "auth", "session.test.ts"), "import { session } from '../../src/auth/session.js';\nsession;\n", "utf8");
    writeFileSync(path.join(root, "package-lock.json"), "{}\n", "utf8");

    const context = await buildContextPackage(root);
    writeContextPackage(context);

    const contractsDir = path.join(root, ".agent-context", "contracts");
    for (const file of ["architecture.contract.json", "module-boundaries.json", "commands.contract.json", "test.contract.json", "safety.contract.json"]) {
      assert.equal(existsSync(path.join(contractsDir, file)), true);
    }

    const commands = JSON.parse(readFileSync(path.join(contractsDir, "commands.contract.json"), "utf8")) as { requiredAfterChange: { source: string[] } };
    assert.ok(commands.requiredAfterChange.source.includes("npm run test"));
    assert.ok(commands.requiredAfterChange.source.includes("npm run check"));

    const tests = JSON.parse(readFileSync(path.join(contractsDir, "test.contract.json"), "utf8")) as { sourceToRelatedTests: Record<string, string[]> };
    assert.ok(Object.values(tests.sourceToRelatedTests).some((related) => related.includes("test/auth/session.test.ts")));

    const safety = JSON.parse(readFileSync(path.join(contractsDir, "safety.contract.json"), "utf8")) as { protectedPaths: { lockfiles: string[] } };
    assert.ok(safety.protectedPaths.lockfiles.includes("package-lock.json"));

    const architecture = JSON.parse(readFileSync(path.join(contractsDir, "architecture.contract.json"), "utf8")) as {
      layers: Array<{ name: string; forbiddenImports: string[] }>;
    };
    assert.ok(architecture.layers.some((layer) => layer.name === "core" && layer.forbiddenImports.includes("src/outputs/**")));

    const boundaries = JSON.parse(readFileSync(path.join(contractsDir, "module-boundaries.json"), "utf8")) as {
      modules: Record<string, { owns: string[]; allowedImports: string[]; forbiddenImports: string[] }>;
    };
    assert.ok(boundaries.modules.auth.owns.includes("src/auth/**"));
    assert.ok(boundaries.modules.auth.allowedImports.includes("src/auth/**"));
    assert.ok(boundaries.modules.auth.forbiddenImports.includes("src/payment/**"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("writer migrates legacy AGENTS.md into AGENTS.manual.md and composes final AGENTS.md", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "code-agent-plusplus-agents-"));

  try {
    writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({
        scripts: { test: "node --test", start: "node src/index.js" }
      }),
      "utf8"
    );
    writeFileSync(path.join(root, "src-index.ts"), "export const value = 1;\n", "utf8");
    writeFileSync(
      path.join(root, "AGENTS.md"),
      `
# Team Notes

## 环境依赖版本
Node 20

## 安装步骤
pnpm install

## 启动命令
pnpm dev

## 常见故障与恢复步骤
重启服务
`,
      "utf8"
    );

    const context = await buildContextPackage(root);
    writeContextPackage(context);

    const manual = readFileSync(path.join(root, "AGENTS.manual.md"), "utf8");
    const generated = readFileSync(path.join(root, ".agent-context", "AGENTS.generated.md"), "utf8");
    const finalAgents = readFileSync(path.join(root, "AGENTS.md"), "utf8");

    assert.equal(manual.includes("migrated-from: AGENTS.md"), true);
    assert.equal(manual.includes("## 环境依赖版本"), true);
    assert.equal(manual.includes("## 安装步骤"), true);
    assert.equal(manual.includes("## 启动命令"), true);
    assert.equal(generated.includes("generated-file: .agent-context/AGENTS.generated.md"), true);
    assert.equal(finalAgents.includes("manual-sources: AGENTS.manual.md"), true);
    assert.equal(finalAgents.includes("generated-source: .agent-context/AGENTS.generated.md"), true);
    assert.equal(finalAgents.includes("## Manual Operations Context"), true);
    assert.equal(finalAgents.includes("## Generated Code Context"), false);
    assert.equal(finalAgents.includes("Load these files only for environment, deployment, configuration, or operations tasks"), true);
    assert.equal(finalAgents.includes("- AGENTS.manual.md"), true);
    assert.equal(finalAgents.includes("Node 20"), false);
    assert.equal(finalAgents.includes("L0 operating rules"), true);

    const layers = readFileSync(path.join(root, ".agent-context", "context-layers.md"), "utf8");
    assert.equal(layers.includes("## L0 Always Loaded"), true);
    assert.equal(layers.includes("## L1 Task Start"), true);
    assert.equal(layers.includes("## L2 Task Run"), true);
    assert.equal(layers.includes("## L2 Standalone Task Pack"), true);
    assert.equal(layers.includes("## L3 Deep Evidence"), true);
    assert.equal(layers.includes("Do not load the full `.agent-context/` directory by default."), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("RAG export respects chunkTokenLimit", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "code-agent-plusplus-rag-"));

  try {
    writeFileSync(
      path.join(root, "code-agent-plusplus.config.yml"),
      `
rag:
  provider: lightrag
  chunkTokenLimit: 12
`,
      "utf8"
    );
    writeFileSync(
      path.join(root, "index.ts"),
      `
export const alpha = 1;
export const beta = 2;
export const gamma = 3;
export const delta = 4;
export const epsilon = 5;
`,
      "utf8"
    );

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
