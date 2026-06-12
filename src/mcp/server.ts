import path from "node:path";
import { pathToFileURL } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
import { buildContextPackage, type BuildOptions } from "../core/context-builder.js";
import { buildChangeImpactReport, renderChangeImpactReport } from "../outputs/impact.js";
import { renderTaskPlan, renderTaskVerify, writeTaskContextPack } from "../outputs/task-harness.js";
import { renderTaskContext } from "../outputs/task-context.js";
import { buildTestSelection, renderTestSelection } from "../outputs/test-selector.js";
import { writeContextPackage } from "../outputs/writer.js";
import { createContextRetriever } from "../retrievers/index.js";
import type { RetrieverProvider } from "../retrievers/types.js";

export const repoContextMcpToolNames = [
  "repo_context_build",
  "repo_context_plan",
  "repo_context_pack",
  "repo_context_retrieve",
  "repo_context_tests",
  "repo_context_impact",
  "repo_context_verify",
  "repo_context_explain"
] as const;

type RepoContextMcpToolName = (typeof repoContextMcpToolNames)[number];

interface RepoContextMcpResult {
  [key: string]: unknown;
}

interface RetrieveArguments {
  repo?: string;
  task: string;
  provider?: RetrieverProvider;
  topK?: number;
  modules?: string[];
  changedFiles?: string[];
  includeTests?: boolean;
}

export function createRepoContextMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: "repo-to-agent-context",
      version: "0.1.0"
    },
    { capabilities: { tools: {} } }
  );

  server.registerTool(
    "repo_context_build",
    {
      description: "Scan a repository and write AGENTS.md plus .agent-context outputs.",
      inputSchema: z.object({
        repo: z.string().optional().default("."),
        target: z.enum(["codex", "claude", "cursor", "all"]).optional().default("codex"),
        tokenBudget: z.number().int().positive().optional(),
        tokenizer: z.enum(["chars_approx", "cl100k_base", "o200k_base"]).optional(),
        model: z.string().optional(),
        llm: z.boolean().optional()
      })
    },
    async (args) => jsonToolResult(await runBuild(args))
  );

  server.registerTool(
    "repo_context_plan",
    {
      description: "Generate a task plan with suspected modules, must-inspect files, and validation commands.",
      inputSchema: z.object({
        repo: z.string().optional().default("."),
        task: z.string(),
        type: z.enum(["auto", "bugfix", "feature", "refactor"]).optional().default("auto"),
        tokenBudget: z.number().int().positive().optional()
      })
    },
    async (args) => jsonToolResult(await runTaskPlan(args))
  );

  server.registerTool(
    "repo_context_pack",
    {
      description: "Write a task context pack under .agent-context/tasks/<task-id>.",
      inputSchema: z.object({
        repo: z.string().optional().default("."),
        task: z.string(),
        type: z.enum(["auto", "bugfix", "feature", "refactor"]).optional().default("auto"),
        tokenBudget: z.number().int().positive().optional()
      })
    },
    async (args) => jsonToolResult(await runTaskPack(args))
  );

  server.registerTool(
    "repo_context_retrieve",
    {
      description: "Search repository context through the unified retrieval protocol.",
      inputSchema: z.object({
        repo: z.string().optional().default("."),
        task: z.string(),
        provider: z.enum(["static", "ripgrep", "hybrid", "lightrag", "embedding"]).optional().default("hybrid"),
        topK: z.number().int().positive().optional().default(8),
        modules: z.array(z.string()).optional(),
        changedFiles: z.array(z.string()).optional(),
        includeTests: z.boolean().optional().default(false)
      })
    },
    async (args) => jsonToolResult(await runRetrieve(args))
  );

  server.registerTool(
    "repo_context_tests",
    {
      description: "Select minimal, regression, and full-confidence tests for a file, diff, or task.",
      inputSchema: z.object({
        repo: z.string().optional().default("."),
        forPaths: z.array(z.string()).optional(),
        diff: z.boolean().optional(),
        base: z.string().optional().default("main")
      })
    },
    async (args) => jsonToolResult(await runTests(args))
  );

  server.registerTool(
    "repo_context_impact",
    {
      description: "Analyze changed files, dependents, related tests, and required verification.",
      inputSchema: z.object({
        repo: z.string().optional().default("."),
        base: z.string().optional().default("main")
      })
    },
    async (args) => jsonToolResult(await runImpact(args))
  );

  server.registerTool(
    "repo_context_verify",
    {
      description: "Verify changed files against affected modules, tests, contracts, and risk signals.",
      inputSchema: z.object({
        repo: z.string().optional().default("."),
        base: z.string().optional().default("main"),
        diff: z.boolean().optional().default(true)
      })
    },
    async (args) => jsonToolResult(await runVerify(args))
  );

  server.registerTool(
    "repo_context_explain",
    {
      description: "Explain a file or module from the generated repository index.",
      inputSchema: z.object({
        repo: z.string().optional().default("."),
        targetPath: z.string()
      })
    },
    async (args) => jsonToolResult(await runExplain(args))
  );

  return server;
}

export async function runRepoContextMcpServer(): Promise<void> {
  const server = createRepoContextMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

export async function executeRepoContextMcpTool(name: RepoContextMcpToolName, args: unknown): Promise<RepoContextMcpResult> {
  switch (name) {
    case "repo_context_build":
      return runBuild(args as BuildInput);
    case "repo_context_plan":
      return runTaskPlan(args as PlanInput);
    case "repo_context_pack":
      return runTaskPack(args as PackInput);
    case "repo_context_retrieve":
      return runRetrieve(args as RetrieveArguments);
    case "repo_context_tests":
      return runTests(args as TestsInput);
    case "repo_context_impact":
      return runImpact(args as ImpactInput);
    case "repo_context_verify":
      return runVerify(args as VerifyInput);
    case "repo_context_explain":
      return runExplain(args as ExplainInput);
  }
}

interface BuildInput extends BuildOptions {
  repo?: string;
}

interface PlanInput {
  repo?: string;
  task: string;
  type?: "auto" | "bugfix" | "feature" | "refactor";
  tokenBudget?: number;
}

type PackInput = PlanInput;

interface TestsInput {
  repo?: string;
  forPaths?: string[];
  diff?: boolean;
  base?: string;
}

interface ImpactInput {
  repo?: string;
  base?: string;
}

interface VerifyInput {
  repo?: string;
  base?: string;
  diff?: boolean;
}

interface ExplainInput {
  repo?: string;
  targetPath: string;
}

async function runBuild(args: BuildInput): Promise<RepoContextMcpResult> {
  const context = await buildContextPackage(args.repo ?? ".", {
    target: args.target,
    tokenBudget: args.tokenBudget,
    llm: args.llm,
    tokenizer: args.tokenizer,
    model: args.model
  });
  const result = writeContextPackage(context);

  return {
    repo: context.scan.root,
    readiness: {
      grade: context.readiness.grade,
      score: context.readiness.score
    },
    tokenSavings: {
      compressionRatio: context.tokenSavings.compressionRatio,
      withinBudget: context.tokenSavings.withinBudget,
      originalTokens: context.tokenSavings.originalRepoTokens.tokens,
      estimatedTokens: context.tokenSavings.estimatedContextPackTokens.tokens,
      actualTokens: context.tokenSavings.actualOutputTokens?.total ?? null
    },
    writtenFiles: result.files.map((file) => path.relative(context.scan.root, file).replaceAll("\\", "/"))
  };
}

async function runTaskPlan(args: PlanInput): Promise<RepoContextMcpResult> {
  const context = await buildContextPackage(args.repo ?? ".");
  const markdown = renderTaskPlan(context, args.task, { type: args.type ?? "auto", tokenBudget: args.tokenBudget });
  return {
    task: args.task,
    type: args.type ?? "auto",
    markdown
  };
}

async function runTaskPack(args: PackInput): Promise<RepoContextMcpResult> {
  const context = await buildContextPackage(args.repo ?? ".");
  const result = writeTaskContextPack(context, args.task, { type: args.type ?? "auto", tokenBudget: args.tokenBudget });
  return {
    task: args.task,
    taskId: result.taskId,
    dir: path.relative(context.scan.root, result.dir).replaceAll("\\", "/"),
    files: result.files.map((file) => path.relative(context.scan.root, file).replaceAll("\\", "/")),
    markdown: renderTaskContext(context, args.task, { type: args.type ?? "auto", tokenBudget: args.tokenBudget })
  };
}

async function runRetrieve(args: RetrieveArguments): Promise<RepoContextMcpResult> {
  const context = await buildContextPackage(args.repo ?? ".");
  const retriever = createContextRetriever(context, args.provider ?? "hybrid");
  const hits = await retriever.search(args.task, {
    topK: args.topK ?? 8,
    modules: args.modules,
    changedFiles: args.changedFiles,
    includeTests: args.includeTests ?? false
  });
  const selectionPaths = unique([
    ...(args.changedFiles ?? []),
    ...hits
      .slice(0, 3)
      .map((hit) => hit.path)
      .filter((pathName) => Boolean(pathName))
  ]);
  const selection = buildTestSelection(context, { forPaths: selectionPaths.length ? selectionPaths : undefined, diff: false });

  return {
    task: args.task,
    provider: args.provider ?? "hybrid",
    hits: hits.map((hit) => ({
      path: hit.path,
      reason: hit.title || hit.snippet || "Matches task terms",
      confidence: confidenceForScore(hit.score),
      evidence: [],
      score: Number(hit.score.toFixed(1)),
      moduleName: hit.moduleName,
      kind: hit.kind,
      source: hit.source
    })),
    suggestedCommands: unique([...selection.minimalCommands, ...selection.recommendedCommands]).slice(0, 6)
  };
}

async function runTests(args: TestsInput): Promise<RepoContextMcpResult> {
  const context = await buildContextPackage(args.repo ?? ".");
  const report = buildTestSelection(context, {
    forPaths: args.forPaths,
    diff: args.diff,
    base: args.base ?? "main"
  });
  return {
    markdown: renderTestSelection(context, { forPaths: args.forPaths, diff: args.diff, base: args.base ?? "main" }),
    ...report
  };
}

async function runImpact(args: ImpactInput): Promise<RepoContextMcpResult> {
  const context = await buildContextPackage(args.repo ?? ".");
  const report = buildChangeImpactReport(context, { base: args.base ?? "main" });
  return {
    markdown: renderChangeImpactReport(context, { base: args.base ?? "main" }),
    report
  };
}

async function runVerify(args: VerifyInput): Promise<RepoContextMcpResult> {
  const context = await buildContextPackage(args.repo ?? ".");
  return {
    markdown: renderTaskVerify(context, { base: args.base ?? "main", diff: args.diff ?? true })
  };
}

async function runExplain(args: ExplainInput): Promise<RepoContextMcpResult> {
  const context = await buildContextPackage(args.repo ?? ".");
  const targetPath = args.targetPath.replace(/\\/g, "/");
  const file = context.index.files.find((candidate) => candidate.path === targetPath);
  if (file) {
    return {
      kind: "file",
      path: file.path,
      moduleName: file.moduleName,
      summary: file.summary,
      analyzer: file.analyzer,
      confidence: file.confidence,
      imports: file.imports.map((item) => item.specifier),
      exports: file.exports,
      importanceScore: file.importanceScore,
      importanceReasons: file.importanceReasons
    };
  }

  const module = context.index.modules.find((candidate) => candidate.name === targetPath);
  if (module) {
    return {
      kind: "module",
      name: module.name,
      summary: module.summary,
      files: module.files,
      imports: module.imports
    };
  }

  return {
    kind: "error",
    message: `No file or module found for: ${args.targetPath}`
  };
}

function confidenceForScore(score: number): "high" | "medium" | "low" {
  if (score >= 40) return "high";
  if (score >= 15) return "medium";
  return "low";
}

function jsonToolResult(result: RepoContextMcpResult) {
  return {
    content: [
      {
        type: "text" as const,
        text: `${JSON.stringify(result, null, 2)}\n`
      }
    ]
  };
}

function unique(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runRepoContextMcpServer().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
