#!/usr/bin/env node
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Command } from "commander";
import type { AgentTarget, CacheStats, IndexedFile, TaskType } from "../core/types.js";
import { buildContextPackage } from "../core/context-builder.js";
import { changedFilesSince } from "../core/git.js";
import { writeContextPackage } from "../outputs/renderers/writer.js";
import { renderDependencyGraph } from "../outputs/dependency-graph.js";
import { summarizeReadiness } from "../core/readiness.js";
import { formatTokenSavings } from "../core/token-savings.js";
import { buildRagDocuments, buildRagManifest } from "../outputs/rag.js";
import { renderChangeImpactReport } from "../outputs/impact.js";
import { renderTaskContext } from "../outputs/task-context.js";
import { renderTestSelection } from "../outputs/test-selector.js";
import { renderBenchmarkReport, runBenchmark } from "../benchmarks/benchmark.js";
import { parseAgentBenchmarkModes, renderAgentBehaviorBenchmark, runAgentBehaviorBenchmark } from "../benchmarks/agent-benchmark.js";
import { renderTaskPlan, renderTaskVerify, writeTaskContextPack } from "../outputs/task-harness.js";
import { writeTaskRun } from "../outputs/task-run.js";
import { buildLoopControllerReport, renderLoopControllerReport, writeLoopControllerReport, type LoopPhase } from "../harness/control-plane/loop-controller.js";
import { renderOrchestratorReport, runHarnessOrchestrator, type AgentExecutorName, type OrchestratorCheckpointMode } from "../harness/control-plane/orchestrator.js";
import { buildPolicyReport, renderPolicyReport, type PolicyFailOn } from "../harness/verification-plane/policy-engine.js";
import { buildHallucinationReport, renderHallucinationReport, writeHallucinationReport } from "../harness/verification-plane/guards/hallucination.js";
import { buildRegressionReport, renderRegressionReport, writeRegressionReport } from "../harness/verification-plane/guards/regression.js";
import {
  addRegressionMemoryFromCandidate,
  buildRegressionMemoryCandidate,
  readLatestCandidate,
  writeRegressionMemoryCandidate,
  type RegressionMemoryOptions
} from "../harness/verification-plane/guards/regression-memory.js";
import {
  appendExecutionTraceStep,
  executionTracePath,
  readExecutionTrace,
  renderExecutionTrace,
  runTraceCommand,
  startExecutionTrace,
  type ExecutionEvidenceSource,
  type ExecutionFinalState,
  type ExecutionStepResult
} from "../harness/observability/execution-trace.js";
import { renderContractValidationReport, validateContracts } from "../outputs/contract-validator.js";
import { validateContextPackage } from "../core/validator.js";
import { assessDrift, assessFreshness, buildContextManifest, renderDriftReport, renderFreshnessReport } from "../core/freshness.js";
import { buildContextDelta, renderContextDelta, writeContextDelta } from "../outputs/context-delta.js";
import { starterConfig } from "../config/starter-config.js";
import { parseTokenizerMode } from "../core/token-estimator.js";
import { resolveTaskArguments } from "./task-args.js";
import { createContextRetriever, renderContextHits, type RetrieverProvider } from "../retrievers/index.js";
import type { CodeIntelligenceBackend } from "../integrations/codegraph.js";

const program = new Command();
const executableName = path.basename(process.argv[1] ?? "code-agent-plusplus").replace(/\.(js|cmd|ps1)$/i, "");
const invokedName = executableName && executableName !== "index" ? executableName : "code-agent-plusplus";

program.name(invokedName).description("Code Agent++: add context, boundaries, evidence, and verification gates to coding agents.").version("0.1.0");

program
  .command("build")
  .argument("[repo]", "repository path", ".")
  .option("-t, --target <target>", "agent target: codex, claude, cursor, all", parseTarget)
  .option("-b, --token-budget <tokens>", "target token budget", parseInteger)
  .option("--tokenizer <tokenizer>", "tokenizer: chars-approx, cl100k_base, o200k_base", parseTokenizerMode)
  .option("--model <model>", "model name used to infer tokenizer, for example gpt-4.1")
  .option("--llm", "enable LLM summaries using code-agent-plusplus.local.yml")
  .option("--no-llm", "disable LLM summaries")
  .description("Generate AGENTS.md and .agent-context outputs.")
  .action(
    async (
      repo: string,
      options: { target?: AgentTarget; tokenBudget?: number; tokenizer?: ReturnType<typeof parseTokenizerMode>; model?: string; llm?: boolean }
    ) => {
      const context = await buildContextPackage(repo, options);
      const result = writeContextPackage(context);
      console.log(`Generated agent context for ${context.scan.root}`);
      console.log(`Files scanned: ${context.scan.files.length}`);
      console.log(`Languages: ${context.scan.languages.join(", ") || "none detected"}`);
      console.log(`Key files: ${context.keyFiles.length}`);
      console.log(`Agent readiness: ${context.readiness.grade} / ${context.readiness.score}`);
      console.log(`Summary mode: ${context.summaries.mode}`);
      if (context.summaries.fallbackReason && context.summaries.fallbackReason !== "disabled") {
        console.log(`LLM fallback reason: ${context.summaries.fallbackReason}`);
      }
      console.log(formatTokenSavings(context.tokenSavings));
      console.log("Written:");
      for (const file of result.files) {
        console.log(`- ${path.relative(context.scan.root, file)}`);
      }
    }
  );

program
  .command("savings")
  .argument("[repo]", "repository path", ".")
  .option("-b, --token-budget <tokens>", "target token budget", parseInteger)
  .option("--actual", "write the context package first and report actual generated output tokens")
  .option("--tokenizer <tokenizer>", "tokenizer: chars-approx, cl100k_base, o200k_base", parseTokenizerMode)
  .option("--model <model>", "model name used to infer tokenizer, for example gpt-4.1")
  .description("Print the token savings report.")
  .action(async (repo: string, options: { tokenBudget?: number; actual?: boolean; tokenizer?: ReturnType<typeof parseTokenizerMode>; model?: string }) => {
    const context = await buildContextPackage(repo, options);
    if (options.actual) {
      writeContextPackage(context);
    }
    console.log(formatTokenSavings(context.tokenSavings));
  });

const rag = program.command("rag").description("RAG integration commands.");

rag
  .command("export")
  .argument("[repo]", "repository path", ".")
  .option("-b, --token-budget <tokens>", "target token budget", parseInteger)
  .description("Print a LightRAG-friendly export summary.")
  .action(async (repo: string, options: { tokenBudget?: number }) => {
    const context = await buildContextPackage(repo, options);
    const documents = buildRagDocuments(context);
    const manifest = buildRagManifest(context, documents.length);
    console.log("# LightRAG Export");
    console.log("");
    console.log(`Documents: ${documents.length}`);
    console.log(`Provider: ${manifest.provider}`);
    console.log(`Mode: ${manifest.mode}`);
    console.log("");
    console.log("Run `code-agent-plusplus build` to write `.agent-context/rag/documents.jsonl`.");
  });

const trace = program.command("trace").description("Record and inspect structured agent execution traces.");

trace
  .command("start")
  .argument("<args...>", "task description and optional repository path")
  .option("--repo <repo...>", "repository path; accepts multiple words when the path contains spaces or non-ASCII characters")
  .option("--agent <agent>", "agent name, for example codex, claude, cursor")
  .option("--id <id>", "trace id; defaults to a task slug")
  .option("--json", "print machine-readable execution trace")
  .description("Create .agent-context/traces/<trace-id>.json for a task.")
  .action((args: string[], options: { repo?: string | string[]; agent?: string; id?: string; json?: boolean }) => {
    const { task, repo } = resolveTaskArguments(args, options.repo);
    const root = path.resolve(repo);
    const item = startExecutionTrace(root, task, { id: options.id, agent: options.agent });
    console.log(options.json ? JSON.stringify(item, null, 2) : renderExecutionTrace(item));
    console.log(`Trace file: ${path.relative(root, executionTracePath(root, item.id)).replaceAll("\\", "/")}`);
  });

trace
  .command("add")
  .argument("<traceId>", "trace id")
  .argument("[repo]", "repository path", ".")
  .requiredOption("--action <action>", "step action, for example edit, run-test, verify, repair")
  .option("--agent <agent>", "agent name")
  .option("--files <files>", "comma-separated files touched by this step")
  .option("--reason <reason>", "why the step was taken")
  .option("--command <command>", "command that was run")
  .option("--test <test>", "test file or test target")
  .option("--result <result>", "result: passed, failed, skipped, unknown", parseTraceResult)
  .option("--output <output>", "short command output or observation")
  .option("--evidence-source <source>", "evidence source: manual, command, ci", parseEvidenceSource, "manual")
  .option("--exit-code <code>", "command or CI exit code", parseNonNegativeInteger)
  .option("--started-at <iso>", "command or CI start timestamp")
  .option("--finished-at <iso>", "command or CI finish timestamp")
  .option("--stdout-hash <sha256>", "stdout content hash")
  .option("--stderr-hash <sha256>", "stderr content hash")
  .option("--working-tree-hash-before <sha256>", "working tree hash before command")
  .option("--working-tree-hash-after <sha256>", "working tree hash after command")
  .option("--final-state <state>", "final state: planned, in_progress, partial_success, success, failed, blocked", parseTraceFinalState)
  .option("--json", "print machine-readable execution trace")
  .description("Append one structured step to an execution trace.")
  .action(
    (
      traceId: string,
      repo: string,
      options: {
        action: string;
        agent?: string;
        files?: string;
        reason?: string;
        command?: string;
        test?: string;
        result?: ExecutionStepResult;
        output?: string;
        evidenceSource: ExecutionEvidenceSource;
        exitCode?: number;
        startedAt?: string;
        finishedAt?: string;
        stdoutHash?: string;
        stderrHash?: string;
        workingTreeHashBefore?: string;
        workingTreeHashAfter?: string;
        finalState?: ExecutionFinalState;
        json?: boolean;
      }
    ) => {
      const root = path.resolve(repo);
      const item = appendExecutionTraceStep(root, traceId, {
        action: options.action,
        agent: options.agent,
        files: splitCsv(options.files),
        reason: options.reason,
        command: options.command,
        test: options.test,
        result: options.result,
        output: options.output,
        evidenceSource: options.evidenceSource,
        exitCode: options.exitCode,
        startedAt: options.startedAt,
        finishedAt: options.finishedAt,
        stdoutHash: options.stdoutHash,
        stderrHash: options.stderrHash,
        workingTreeHashBefore: options.workingTreeHashBefore,
        workingTreeHashAfter: options.workingTreeHashAfter,
        finalState: options.finalState
      });
      console.log(options.json ? JSON.stringify(item, null, 2) : renderExecutionTrace(item));
    }
  );

trace
  .command("run")
  .argument("<traceId>", "trace id")
  .argument("[repo]", "repository path", ".")
  .requiredOption("--command <command>", "command to execute and record as harness-captured evidence")
  .option("--action <action>", "step action, for example run-test, verify, validate-contracts", "run-test")
  .option("--agent <agent>", "agent name")
  .option("--files <files>", "comma-separated files touched or verified by this command")
  .option("--reason <reason>", "why the command was run")
  .option("--test <test>", "test file or test target")
  .option("--final-state <state>", "final state: planned, in_progress, partial_success, success, failed, blocked", parseTraceFinalState)
  .option("--json", "print machine-readable execution trace plus command output")
  .description("Run a command through the harness and append command evidence to an execution trace.")
  .action(
    (
      traceId: string,
      repo: string,
      options: {
        command: string;
        action: string;
        agent?: string;
        files?: string;
        reason?: string;
        test?: string;
        finalState?: ExecutionFinalState;
        json?: boolean;
      }
    ) => {
      const root = path.resolve(repo);
      const result = runTraceCommand(root, traceId, {
        action: options.action,
        agent: options.agent,
        command: options.command,
        files: splitCsv(options.files),
        reason: options.reason,
        test: options.test,
        finalState: options.finalState
      });
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(renderExecutionTrace(result.trace));
      }
      if (result.exitCode !== 0) process.exitCode = result.exitCode ?? 1;
    }
  );

trace
  .command("show")
  .argument("<traceId>", "trace id")
  .argument("[repo]", "repository path", ".")
  .option("--json", "print machine-readable execution trace")
  .description("Show a structured execution trace.")
  .action((traceId: string, repo: string, options: { json?: boolean }) => {
    const root = path.resolve(repo);
    const item = readExecutionTrace(root, traceId);
    if (!item) {
      console.error(`Execution trace not found: ${traceId}`);
      process.exitCode = 1;
      return;
    }
    console.log(options.json ? JSON.stringify(item, null, 2) : renderExecutionTrace(item));
  });

rag
  .command("search")
  .argument("<task>", "task or search query")
  .argument("[repo]", "repository path", ".")
  .option("--provider <provider>", "retriever provider: static, ripgrep, hybrid, lightrag, embedding, codegraph", parseRetrieverProvider, "hybrid")
  .option("-k, --top-k <count>", "number of context hits", parseInteger, 8)
  .option("--modules <modules>", "comma-separated module filter")
  .option("--changed-files <files>", "comma-separated changed file filter")
  .option("--include-tests", "include test files in retrieval results")
  .option("--json", "print machine-readable context hits")
  .description("Search repository context through the unified retrieval protocol.")
  .action(async (task: string, repo: string, options: RetrieveCliOptions) => {
    const context = await buildContextPackage(repo);
    const retriever = createContextRetriever(context, options.provider);
    const hits = await retriever.search(task, retrieveOptions(options));
    console.log(options.json ? JSON.stringify(hits, null, 2) : renderContextHits(task, options.provider, hits));
  });

program
  .command("init")
  .argument("[repo]", "repository path", ".")
  .description("Create a starter code-agent-plusplus.config.yml.")
  .action((repo: string) => {
    const root = path.resolve(repo);
    const configPath = path.join(root, "code-agent-plusplus.config.yml");

    if (existsSync(configPath)) {
      console.log(`Config already exists: ${configPath}`);
      return;
    }

    writeFileSync(configPath, starterConfig(), "utf8");
    console.log(`Created ${configPath}`);
  });

program
  .command("graph")
  .argument("[repo]", "repository path", ".")
  .description("Print the generated dependency graph markdown.")
  .action(async (repo: string) => {
    const context = await buildContextPackage(repo);
    console.log(renderDependencyGraph(context));
  });

program
  .command("readiness")
  .argument("[repo]", "repository path", ".")
  .description("Print the agent readiness score and missing context signals.")
  .action(async (repo: string) => {
    const context = await buildContextPackage(repo);
    console.log(summarizeReadiness(context));
  });

program
  .command("validate")
  .argument("[repo]", "repository path", ".")
  .description("Validate config, generated JSON, dependency edges, confidence, and token budget.")
  .action(async (repo: string) => {
    const context = await buildContextPackage(repo);
    const report = validateContextPackage(context);
    console.log(report.valid ? "Validation: passed" : "Validation: failed");
    for (const issue of report.issues) {
      console.log(`- ${issue.severity.toUpperCase()} ${issue.code}: ${issue.message}`);
    }
    if (!report.valid) process.exitCode = 1;
  });

program
  .command("policy")
  .argument("[repo]", "repository path", ".")
  .option("--base <ref>", "base git ref for runtime policy checks", "main")
  .option("--trace <id>", "execution trace id used as test and validation evidence")
  .option("--fail-on <level>", "failure threshold: forbidden, required, risk", parsePolicyFailOn)
  .option("--strict", "alias for --fail-on risk")
  .option("--json", "print machine-readable policy report")
  .description("Enforce runtime agent policies over diff, contracts, context freshness, tests, and execution trace evidence.")
  .action(async (repo: string, options: { base: string; trace?: string; failOn?: PolicyFailOn; strict?: boolean; json?: boolean }) => {
    const context = await buildContextPackage(repo);
    const report = buildPolicyReport(context, { base: options.base, traceId: options.trace, failOn: options.failOn, strict: options.strict });
    console.log(options.json ? JSON.stringify(report, null, 2) : renderPolicyReport(report));
    if (!report.passed) process.exitCode = 1;
  });

program
  .command("hallucination")
  .argument("[repo]", "repository path", ".")
  .option("--base <ref>", "base git ref for diff checks", "main")
  .option("--trace <id>", "execution trace id used as transcript evidence")
  .option("--task <task>", "task text used to derive the task id when no trace id is provided")
  .option("--no-write", "print the report without writing .agent-context hallucination artifacts")
  .option("--json", "print machine-readable hallucination report")
  .description("Detect deterministic agent hallucinations: missing files, symbols, commands, dependencies, and config keys.")
  .action(async (repo: string, options: { base: string; trace?: string; task?: string; write?: boolean; json?: boolean }) => {
    const context = await buildContextPackage(repo);
    const report = buildHallucinationReport(context, { base: options.base, traceId: options.trace, task: options.task });
    const written = options.write === false ? undefined : writeHallucinationReport(context, report);
    console.log(options.json ? JSON.stringify({ ...report, written }, null, 2) : renderHallucinationReport(report));
    if (report.summary.errors > 0) process.exitCode = 1;
  });

program
  .command("regression")
  .argument("[repo]", "repository path", ".")
  .option("--base <ref>", "base git ref for diff checks", "main")
  .option("--trace <id>", "execution trace id used as regression test evidence")
  .option("--task <task>", "task text used to match known issues and derive task id")
  .option("--no-write", "print the report without writing .agent-context regression artifacts")
  .option("--json", "print machine-readable regression report")
  .description("Match structured regression memory and require anti-regression test evidence.")
  .action(async (repo: string, options: { base: string; trace?: string; task?: string; write?: boolean; json?: boolean }) => {
    const context = await buildContextPackage(repo);
    const report = buildRegressionReport(context, { base: options.base, traceId: options.trace, task: options.task });
    const written = options.write === false ? undefined : writeRegressionReport(context, report);
    console.log(options.json ? JSON.stringify({ ...report, written }, null, 2) : renderRegressionReport(report));
    if (report.summary.missingRequiredTestEvidence > 0) process.exitCode = 1;
  });

const memory = program.command("memory").description("Create and confirm structured regression memory candidates.");

memory
  .command("learn-from-pr")
  .argument("[repo]", "repository path", ".")
  .option("--base <ref>", "base git ref used to infer changed files", "main")
  .option("--task <task>", "task or PR summary used as the candidate bug pattern")
  .option("--bug-pattern <text>", "explicit bug pattern to store in the candidate")
  .option("--changed-files <files>", "comma-separated changed files to store in the candidate")
  .option("--required-tests <commands>", "comma-separated required regression test commands")
  .option("--risk-triggers <terms>", "comma-separated trigger terms for future matching")
  .option("--json", "print machine-readable candidate output")
  .description("Learn from the current PR or diff and write a human-reviewable memory candidate.")
  .action(async (repo: string, options: MemoryCandidateCliOptions) => {
    const context = await buildContextPackage(repo);
    const candidate = buildRegressionMemoryCandidate(context, {
      ...memoryCandidateOptions(options),
      source: "learn-from-pr"
    });
    const written = writeRegressionMemoryCandidate(context, candidate);
    if (options.json) {
      console.log(JSON.stringify(written, null, 2));
      return;
    }
    console.log(`Wrote regression memory candidate: ${written.file}`);
    console.log("Review it, then confirm with `code-agent-plusplus memory add-fix . --candidate <file>`.");
  });

memory
  .command("add-fix")
  .argument("[repo]", "repository path", ".")
  .option("--candidate <path>", "candidate JSON path; defaults to the latest .agent-context/memory/candidates/*.json")
  .option("--json", "print machine-readable memory entry output")
  .description("Confirm a reviewed memory candidate into .agent-context/regression/fix-history.json.")
  .action((repo: string, options: MemoryAddFixCliOptions) => {
    const root = path.resolve(repo);
    const candidatePath = options.candidate ?? readLatestCandidate(root);
    if (!candidatePath) {
      console.error("No regression memory candidate found. Run `code-agent-plusplus memory learn-from-pr .` first or pass --candidate.");
      process.exitCode = 1;
      return;
    }
    const result = addRegressionMemoryFromCandidate(root, candidatePath);
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    console.log(`Added regression fix memory: ${result.entry.id}`);
    console.log(`Updated: ${result.memoryFile}`);
  });

program
  .command("validate-contracts")
  .argument("[repo]", "repository path", ".")
  .option("--diff", "validate changed files from git diff and working tree", true)
  .option("--base <ref>", "base git ref", "main")
  .description("Validate changed files against generated agent contracts and edit boundaries.")
  .action(async (repo: string, options: { diff?: boolean; base: string }) => {
    const context = await buildContextPackage(repo);
    const report = validateContracts(context, { base: options.base, diff: options.diff });
    console.log(renderContractValidationReport(context, { base: options.base, diff: options.diff }));
    if (!report.passed) process.exitCode = 1;
  });

program
  .command("freshness")
  .argument("[repo]", "repository path", ".")
  .option("--json", "print machine-readable freshness report")
  .description("Check whether AGENTS.md and .agent-context were generated from the current source, config, and commit.")
  .action(async (repo: string, options: { json?: boolean }) => {
    const context = await buildContextPackage(repo);
    const report = assessFreshness(context);
    console.log(options.json ? JSON.stringify(report, null, 2) : renderFreshnessReport(report));
    if (report.status !== "fresh") process.exitCode = 1;
  });

program
  .command("drift")
  .argument("[repo]", "repository path", ".")
  .option("--json", "print machine-readable drift report")
  .description("Detect stale generated context, dependency graph, task pack, and contract drift.")
  .action(async (repo: string, options: { json?: boolean }) => {
    const context = await buildContextPackage(repo);
    const report = assessDrift(context);
    console.log(options.json ? JSON.stringify(report, null, 2) : renderDriftReport(report));
    if (report.status !== "clean") process.exitCode = 1;
  });

program
  .command("delta")
  .argument("[repo]", "repository path", ".")
  .option("--base <ref>", "base git ref for context delta analysis", "main")
  .option("--json", "print machine-readable context delta")
  .description("Show what changed, which context outputs are stale, and what an agent must re-read.")
  .action(async (repo: string, options: { base: string; json?: boolean }) => {
    const context = await buildContextPackage(repo);
    const report = buildContextDelta(context, { base: options.base });
    console.log(options.json ? JSON.stringify(report, null, 2) : renderContextDelta(report));
  });

program
  .command("evolve")
  .argument("[repo]", "repository path", ".")
  .option("--base <ref>", "base git ref for context delta analysis", "main")
  .option("--json", "print machine-readable evolve report after updating context")
  .description("Refresh the agent context with cache-aware full output rebuild and write .agent-context/delta/latest.*.")
  .action(async (repo: string, options: { base: string; json?: boolean }) => {
    const context = await buildContextPackage(repo);
    const delta = buildContextDelta(context, { base: options.base });
    const result = writeContextPackage(context);
    const deltaResult = writeContextDelta(context, delta);
    const rewrittenOutputs = [...result.files, ...deltaResult.files].map((file) => path.relative(context.scan.root, file).replaceAll("\\", "/"));
    const evolveReport = {
      mode: "cache-aware-full-refresh",
      selectiveWrite: false,
      note: "evolve currently reuses scan/index/graph/token caches, then refreshes the full generated context plus delta reports. Selective output writes are planned.",
      cache: summarizeCacheStats(context.cacheStats),
      delta,
      rewrittenOutputs
    };
    writeFileSync(
      path.join(context.scan.root, ".agent-context", "manifest.json"),
      `${JSON.stringify(buildContextManifest(context, [...result.files, ...deltaResult.files]), null, 2)}\n`,
      "utf8"
    );
    if (options.json) {
      console.log(JSON.stringify(evolveReport, null, 2));
      return;
    }
    console.log(renderContextDelta(delta));
    console.log("");
    console.log("Evolve mode: cache-aware full refresh (selective output writes: planned)");
    console.log(`Cache: ${formatCacheStats(context.cacheStats)}`);
    console.log(`Rewritten outputs: ${rewrittenOutputs.length}`);
    for (const file of rewrittenOutputs.slice(0, 12)) console.log(`- ${file}`);
    if (rewrittenOutputs.length > 12) console.log(`- ... ${rewrittenOutputs.length - 12} more`);
  });

program
  .command("run")
  .argument("<args...>", "task description and optional repository path")
  .option("--repo <repo...>", "repository path; accepts multiple words when the path contains spaces or non-ASCII characters")
  .option("--type <type>", "task type: auto, bugfix, feature, refactor", parseTaskType, "auto")
  .option("-b, --token-budget <tokens>", "task run context token budget", parseInteger)
  .option("--base <ref>", "base git ref for impact and verification reports", "main")
  .description("Agent-led handoff: write .agent-context/runs/<task-id> without spawning a code-agent executor.")
  .action(async (args: string[], options: { repo?: string | string[]; type: TaskType; tokenBudget?: number; base: string }) => {
    const { task, repo } = resolveTaskArguments(args, options.repo);
    const context = await buildContextPackage(repo);
    const result = writeTaskRun(context, task, { type: options.type, tokenBudget: options.tokenBudget, base: options.base });
    console.log(`Wrote task run: ${path.relative(context.scan.root, result.dir).replaceAll("\\", "/")}`);
    console.log(`Risk level: ${result.manifest.riskLevel}`);
    console.log(`Context budget: ${result.manifest.contextBudget.usedTokens.toLocaleString()} / ${result.manifest.contextBudget.maxTokens.toLocaleString()}`);
    for (const file of result.files) {
      console.log(`- ${path.relative(context.scan.root, file).replaceAll("\\", "/")}`);
    }
  });

program
  .command("loop")
  .argument("<args...>", "task description and optional repository path")
  .option("--repo <repo...>", "repository path; accepts multiple words when the path contains spaces or non-ASCII characters")
  .option("--phase <phase>", "loop phase: preflight, after-edit, repair", parseLoopPhase, "after-edit")
  .option("--type <type>", "task type: auto, bugfix, feature, refactor", parseTaskType, "auto")
  .option("-b, --token-budget <tokens>", "task context token budget", parseInteger)
  .option("--base <ref>", "base git ref for diff, tests, impact, and contract checks", "main")
  .option("--trace <id>", "execution trace id used as loop evidence")
  .option("--write", "write loop.md and loop.json under .agent-context/loops/<task-id>")
  .option("--json", "print machine-readable loop controller report")
  .description("Decide the next agent-loop step from context freshness, diff, contracts, tests, and impact signals.")
  .action(
    async (
      args: string[],
      options: {
        repo?: string | string[];
        phase: LoopPhase;
        type: TaskType;
        tokenBudget?: number;
        base: string;
        trace?: string;
        write?: boolean;
        json?: boolean;
      }
    ) => {
      const { task, repo } = resolveTaskArguments(args, options.repo);
      const context = await buildContextPackage(repo);
      const loopOptions = {
        phase: options.phase,
        type: options.type,
        tokenBudget: options.tokenBudget,
        base: options.base,
        traceId: options.trace
      };
      const report = buildLoopControllerReport(context, task, loopOptions);
      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(renderLoopControllerReport(report));
      }
      if (options.write) {
        const result = writeLoopControllerReport(context, task, loopOptions);
        console.log("");
        console.log(`Wrote loop report: ${path.relative(context.scan.root, result.dir).replaceAll("\\", "/")}`);
        for (const file of result.files) console.log(`- ${path.relative(context.scan.root, file).replaceAll("\\", "/")}`);
      }
      if (report.status === "needs-repair" || report.status === "blocked") process.exitCode = 1;
    }
  );

program
  .command("orchestrate")
  .argument("<args...>", "task description and optional repository path")
  .option("--repo <repo...>", "repository path; accepts multiple words when the path contains spaces or non-ASCII characters")
  .option("--executor <executor>", "executor: codex, claude-code, opencode, mimocode, cursor, mock", parseAgentExecutor, "mock")
  .option("--executor-command <command>", "argv-style command used to run the selected executor; supports {prompt}, {task}, {repo}, {runDir}, {agent}")
  .option("--opencode-transcript <path>", "optional OpenCode session transcript file to normalize into the execution trace")
  .option("--agent <agent>", "executor-specific agent/profile name")
  .option("--max-loops <count>", "maximum orchestrator iterations before requiring human review", parseInteger, 1)
  .option("--type <type>", "task type: auto, bugfix, feature, refactor", parseTaskType, "auto")
  .option("-b, --token-budget <tokens>", "task context token budget", parseInteger)
  .option("--base <ref>", "base git ref for diff, policy, tests, impact, and verify", "main")
  .option("--fail-on <level>", "policy failure threshold: forbidden, required, risk", parsePolicyFailOn, "required")
  .option("--checkpoint <mode>", "checkpoint mode: none, git-worktree", parseOrchestratorCheckpoint, "none")
  .option("--dry-run", "exercise the harness using the mock executor without editing files")
  .option("--json", "print machine-readable orchestrator report")
  .description("Harness-led flow: plan/pack -> executor -> diff/trace evidence -> policy/impact/verify -> final decision.")
  .action(
    async (
      args: string[],
      options: {
        repo?: string | string[];
        executor: AgentExecutorName;
        executorCommand?: string;
        opencodeTranscript?: string;
        agent?: string;
        maxLoops: number;
        type: TaskType;
        tokenBudget?: number;
        base: string;
        failOn: PolicyFailOn;
        checkpoint: OrchestratorCheckpointMode;
        dryRun?: boolean;
        json?: boolean;
      }
    ) => {
      const { task, repo } = resolveTaskArguments(args, options.repo);
      const result = await runHarnessOrchestrator(repo, task, {
        executor: options.executor,
        executorCommand: options.executorCommand,
        opencodeTranscript: options.opencodeTranscript,
        agent: options.agent,
        maxLoops: options.maxLoops,
        type: options.type,
        tokenBudget: options.tokenBudget,
        base: options.base,
        failOn: options.failOn,
        checkpoint: options.checkpoint,
        dryRun: options.dryRun
      });
      console.log(options.json ? JSON.stringify(result.report, null, 2) : renderOrchestratorReport(result.report));
      if (result.report.decision.blocking) process.exitCode = 1;
    }
  );

const agent = program.command("agent").description("Harness-led executor commands for external coding agents.");

agent
  .command("run")
  .argument("<args...>", "task description and optional repository path")
  .option("--repo <repo...>", "repository path; accepts multiple words when the path contains spaces or non-ASCII characters")
  .option("--executor <executor>", "executor: codex, claude-code, opencode, mimocode, cursor, mock", parseAgentExecutor, "mock")
  .option("--executor-command <command>", "argv-style command used to run the selected executor; supports {prompt}, {task}, {repo}, {runDir}, {agent}")
  .option("--opencode-transcript <path>", "optional OpenCode session transcript file to normalize into the execution trace")
  .option("--agent <agent>", "executor-specific agent/profile name")
  .option("--type <type>", "task type: auto, bugfix, feature, refactor", parseTaskType, "auto")
  .option("-b, --token-budget <tokens>", "task context token budget", parseInteger)
  .option("--base <ref>", "base git ref for diff, policy, tests, impact, and verify", "main")
  .option("--fail-on <level>", "policy failure threshold: forbidden, required, risk", parsePolicyFailOn, "required")
  .option("--checkpoint <mode>", "checkpoint mode: none, git-worktree", parseOrchestratorCheckpoint, "none")
  .option("--dry-run", "exercise the harness using the mock executor without editing files")
  .option("--json", "print machine-readable orchestrator report")
  .description("Harness-led alias for one orchestrator pass with a selected coding agent executor.")
  .action(
    async (
      args: string[],
      options: {
        repo?: string | string[];
        executor: AgentExecutorName;
        executorCommand?: string;
        opencodeTranscript?: string;
        agent?: string;
        type: TaskType;
        tokenBudget?: number;
        base: string;
        failOn: PolicyFailOn;
        checkpoint: OrchestratorCheckpointMode;
        dryRun?: boolean;
        json?: boolean;
      }
    ) => {
      const { task, repo } = resolveTaskArguments(args, options.repo);
      const result = await runHarnessOrchestrator(repo, task, {
        executor: options.executor,
        executorCommand: options.executorCommand,
        opencodeTranscript: options.opencodeTranscript,
        agent: options.agent,
        maxLoops: 1,
        type: options.type,
        tokenBudget: options.tokenBudget,
        base: options.base,
        failOn: options.failOn,
        checkpoint: options.checkpoint,
        dryRun: options.dryRun
      });
      console.log(options.json ? JSON.stringify(result.report, null, 2) : renderOrchestratorReport(result.report));
      if (result.report.decision.blocking) process.exitCode = 1;
    }
  );

program
  .command("plan")
  .argument("<args...>", "task description and optional repository path")
  .option("--repo <repo...>", "repository path; accepts multiple words when the path contains spaces or non-ASCII characters")
  .option("--type <type>", "task type: auto, bugfix, feature, refactor", parseTaskType, "auto")
  .option("-b, --token-budget <tokens>", "task planning token budget", parseInteger)
  .description("Generate a task plan with inspection, risk, and validation guidance.")
  .action(async (args: string[], options: { repo?: string | string[]; type: TaskType; tokenBudget?: number }) => {
    const { task, repo } = resolveTaskArguments(args, options.repo);
    const context = await buildContextPackage(repo);
    console.log(renderTaskPlan(context, task, { type: options.type, tokenBudget: options.tokenBudget }));
  });

program
  .command("pack")
  .argument("<args...>", "task description and optional repository path")
  .option("--repo <repo...>", "repository path; accepts multiple words when the path contains spaces or non-ASCII characters")
  .option("--type <type>", "task type: auto, bugfix, feature, refactor", parseTaskType, "auto")
  .option("-b, --token-budget <tokens>", "task context token budget", parseInteger)
  .description("Write a task context pack under .agent-context/tasks/<task-id>.")
  .action(async (args: string[], options: { repo?: string | string[]; type: TaskType; tokenBudget?: number }) => {
    const { task, repo } = resolveTaskArguments(args, options.repo);
    const context = await buildContextPackage(repo);
    const result = writeTaskContextPack(context, task, { type: options.type, tokenBudget: options.tokenBudget });
    console.log(`Wrote task pack: ${path.relative(context.scan.root, result.dir).replaceAll("\\", "/")}`);
    for (const file of result.files) {
      console.log(`- ${path.relative(context.scan.root, file).replaceAll("\\", "/")}`);
    }
  });

program
  .command("verify")
  .argument("[repo]", "repository path", ".")
  .option("--diff", "verify changed files from git diff and working tree", true)
  .option("--base <ref>", "base git ref", "main")
  .option("--trace <id>", "execution trace id used as regression test evidence")
  .description("Verify changed files against affected modules, tests, and risk signals.")
  .action(async (repo: string, options: { diff?: boolean; base: string; trace?: string }) => {
    const context = await buildContextPackage(repo);
    console.log(renderTaskVerify(context, { base: options.base, diff: options.diff, traceId: options.trace }));
  });

program
  .command("task")
  .argument("<args...>", "task description and optional repository path")
  .option("--repo <repo...>", "repository path; accepts multiple words when the path contains spaces or non-ASCII characters")
  .option("--type <type>", "task type: auto, bugfix, feature, refactor", parseTaskType, "auto")
  .option("-b, --token-budget <tokens>", "task context token budget", parseInteger)
  .description("Generate a task-focused context recommendation.")
  .action(async (args: string[], options: { repo?: string | string[]; type: TaskType; tokenBudget?: number }) => {
    const { task, repo } = resolveTaskArguments(args, options.repo);
    const context = await buildContextPackage(repo);
    console.log(renderTaskContext(context, task, { type: options.type, tokenBudget: options.tokenBudget }));
  });

program
  .command("tests")
  .argument("[repo]", "repository path", ".")
  .option("--for <path...>", "select tests for one or more changed source files")
  .option("--diff", "select tests for files changed from the base ref")
  .option("--base <ref>", "base git ref for --diff", "main")
  .option("--backend <backend>", "code intelligence backend: internal, codegraph", parseCodeBackend, "internal")
  .description("Select minimal, regression, and full-confidence tests for a file or diff.")
  .action(async (repo: string, options: { for?: string[]; diff?: boolean; base: string; backend: CodeIntelligenceBackend }) => {
    const context = await buildContextPackage(repo);
    console.log(renderTestSelection(context, { forPaths: options.for, diff: options.diff, base: options.base, backend: options.backend }));
  });

program
  .command("impact")
  .argument("[repo]", "repository path", ".")
  .option("--base <ref>", "base git ref", "main")
  .option("--backend <backend>", "code intelligence backend: internal, codegraph", parseCodeBackend, "internal")
  .description("Analyze changed files, dependents, related tests, and required verification.")
  .action(async (repo: string, options: { base: string; backend: CodeIntelligenceBackend }) => {
    const context = await buildContextPackage(repo);
    console.log(renderChangeImpactReport(context, { base: options.base, backend: options.backend }));
  });

program
  .command("benchmark")
  .argument("[benchmarkDir]", "benchmark directory", "benchmarks")
  .option("-k, --top-k <count>", "top-K files used for recall/precision", parseInteger, 8)
  .option("--json", "print machine-readable benchmark results")
  .description("Run the loop behavior benchmark over benchmark fixtures.")
  .action(async (benchmarkDir: string, options: { topK: number; json?: boolean }) => {
    const result = await runBenchmark({ benchmarkDir, topK: options.topK });
    console.log(options.json ? JSON.stringify(result, null, 2) : renderBenchmarkReport(result));
  });

program
  .command("benchmark-agent")
  .argument("[benchmarkDir]", "benchmark directory", "benchmarks")
  .option("--executor <executor>", "executor: codex, claude-code, opencode, mimocode, cursor, mock", parseAgentExecutor, "mock")
  .option("--executor-command <command>", "argv-style command; supports {prompt}, {task}, {repo}, {runDir}, {agent}")
  .option("--agent <agent>", "executor-specific agent/profile name")
  .option("--max-loops <count>", "maximum loop count for harness-led mode", parseInteger, 3)
  .option("--fail-on <level>", "policy failure threshold: forbidden, required, risk", parsePolicyFailOn, "required")
  .option("--base <ref>", "base git ref created in each fixture workspace", "main")
  .option("--modes <modes>", "comma-separated modes: no-context, agents-md, context-pack, loop-enabled-harness", parseAgentBenchmarkModes)
  .option("--task <ids>", "comma-separated task ids to run")
  .option("--dry-run", "exercise executor paths without editing files")
  .option("--keep-workdirs", "keep temporary fixture workdirs for inspection")
  .option("--json", "print machine-readable agent behavior benchmark results")
  .description("Run the real-agent behavior benchmark across context modes using a selected executor.")
  .action(
    async (
      benchmarkDir: string,
      options: {
        executor: AgentExecutorName;
        executorCommand?: string;
        agent?: string;
        maxLoops: number;
        failOn: PolicyFailOn;
        base: string;
        modes?: ReturnType<typeof parseAgentBenchmarkModes>;
        task?: string;
        dryRun?: boolean;
        keepWorkdirs?: boolean;
        json?: boolean;
      }
    ) => {
      const result = await runAgentBehaviorBenchmark({
        benchmarkDir,
        executor: options.executor,
        executorCommand: options.executorCommand,
        agent: options.agent,
        maxLoops: options.maxLoops,
        failOn: options.failOn,
        base: options.base,
        modes: options.modes,
        taskIds: splitCsv(options.task),
        dryRun: options.dryRun,
        keepWorkdirs: options.keepWorkdirs
      });
      console.log(options.json ? JSON.stringify(result, null, 2) : renderAgentBehaviorBenchmark(result));
    }
  );

program
  .command("retrieve")
  .argument("<task>", "task or search query")
  .argument("[repo]", "repository path", ".")
  .option("--provider <provider>", "retriever provider: static, ripgrep, hybrid, lightrag, embedding, codegraph", parseRetrieverProvider, "hybrid")
  .option("-k, --top-k <count>", "number of context hits", parseInteger, 8)
  .option("--modules <modules>", "comma-separated module filter")
  .option("--changed-files <files>", "comma-separated changed file filter")
  .option("--include-tests", "include test files in retrieval results")
  .option("--json", "print machine-readable context hits")
  .description("Search repository context through the unified retrieval protocol.")
  .action(async (task: string, repo: string, options: RetrieveCliOptions) => {
    const context = await buildContextPackage(repo);
    const retriever = createContextRetriever(context, options.provider);
    const hits = await retriever.search(task, retrieveOptions(options));
    console.log(options.json ? JSON.stringify(hits, null, 2) : renderContextHits(task, options.provider, hits));
  });

program
  .command("diff")
  .argument("[repo]", "repository path", ".")
  .option("--base <ref>", "base git ref", "main")
  .description("Generate context for files changed since a git base ref.")
  .action(async (repo: string, options: { base: string }) => {
    const context = await buildContextPackage(repo);
    const changed = new Set(changedFilesSince(context.scan.root, options.base));
    const files = context.index.files.filter((file) => changed.has(file.path));
    console.log("# Diff Context");
    console.log("");
    console.log(`Base: ${options.base}`);
    console.log("");
    printFileList(files);
  });

program
  .command("update")
  .argument("[repo]", "repository path", ".")
  .option("--since <ref>", "show changed files since a git ref after rebuilding", "main")
  .description("Rebuild the context package and report files changed since a git ref.")
  .action(async (repo: string, options: { since: string }) => {
    const context = await buildContextPackage(repo);
    const result = writeContextPackage(context);
    const changed = changedFilesSince(context.scan.root, options.since);
    console.log(`Updated agent context for ${context.scan.root}`);
    console.log(`Written files: ${result.files.length}`);
    console.log(`Changed since ${options.since}:`);
    for (const file of changed) {
      console.log(`- ${file}`);
    }
  });

program
  .command("explain")
  .argument("<path>", "file path or module name to explain")
  .argument("[repo]", "repository path", ".")
  .description("Explain a file or module from the generated repository index.")
  .action(async (targetPath: string, repo: string) => {
    const context = await buildContextPackage(repo);
    const normalized = targetPath.replace(/\\/g, "/");
    const file = context.index.files.find((candidate) => candidate.path === normalized);
    if (file) {
      console.log(`# ${file.path}`);
      console.log("");
      console.log(file.summary);
      console.log(`Kind: ${file.kind}`);
      console.log(`Module: ${file.moduleName}`);
      console.log(`Analyzer: ${file.analyzer} (${file.confidence} confidence)`);
      console.log(
        `Analysis stats: ${file.analysisStats.parser}, imports ${file.analysisStats.importsResolved}/${file.imports.length} resolved, ${file.analysisStats.routesDetected} routes`
      );
      console.log(`Importance: ${file.importanceScore} (${file.importanceReasons.join(", ") || "no ranking signals"})`);
      console.log(`Imports: ${file.imports.map((item) => item.specifier).join(", ") || "none"}`);
      console.log(`Exports: ${file.exports.join(", ") || "none"}`);
      return;
    }

    const module = context.index.modules.find((candidate) => candidate.name === normalized);
    if (module) {
      console.log(`# ${module.name}`);
      console.log("");
      console.log(module.summary);
      console.log(`Files: ${module.files.length}`);
      console.log(`Depends on: ${module.imports.join(", ") || "none"}`);
      for (const moduleFile of module.files.slice(0, 30)) {
        console.log(`- ${moduleFile}`);
      }
      return;
    }

    console.error(`No file or module found for: ${targetPath}`);
    process.exitCode = 1;
  });

program.parseAsync().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

interface MemoryCandidateCliOptions {
  base: string;
  task?: string;
  bugPattern?: string;
  changedFiles?: string;
  requiredTests?: string;
  riskTriggers?: string;
  json?: boolean;
}

interface MemoryAddFixCliOptions {
  candidate?: string;
  json?: boolean;
}

function memoryCandidateOptions(options: MemoryCandidateCliOptions): RegressionMemoryOptions {
  return {
    base: options.base,
    task: options.task,
    bugPattern: options.bugPattern,
    changedFiles: splitCsv(options.changedFiles),
    requiredTests: splitCsv(options.requiredTests),
    riskTriggers: splitCsv(options.riskTriggers)
  };
}

interface RetrieveCliOptions {
  provider: RetrieverProvider;
  topK: number;
  modules?: string;
  changedFiles?: string;
  includeTests?: boolean;
  json?: boolean;
}

function retrieveOptions(options: RetrieveCliOptions) {
  return {
    topK: options.topK,
    modules: splitCsv(options.modules),
    changedFiles: splitCsv(options.changedFiles),
    includeTests: options.includeTests ?? false
  };
}

function splitCsv(value: string | undefined): string[] | undefined {
  const items =
    value
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? [];
  return items.length ? items : undefined;
}

function parseRetrieverProvider(value: string): RetrieverProvider {
  if (value === "static" || value === "ripgrep" || value === "hybrid" || value === "lightrag" || value === "embedding" || value === "codegraph") return value;
  throw new Error(`Unsupported retriever provider: ${value}`);
}

function parseCodeBackend(value: string): CodeIntelligenceBackend {
  if (value === "internal" || value === "codegraph") return value;
  throw new Error(`Unsupported code intelligence backend: ${value}`);
}

function parseTarget(value: string): AgentTarget {
  if (value === "codex" || value === "claude" || value === "cursor" || value === "all") {
    return value;
  }

  throw new Error(`Unsupported target: ${value}`);
}

function parseInteger(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Expected a positive integer, got: ${value}`);
  }

  return parsed;
}

function parseTaskType(value: string): TaskType {
  if (value === "auto" || value === "bugfix" || value === "feature" || value === "refactor") return value;
  throw new Error(`Unsupported task type: ${value}`);
}

function parseLoopPhase(value: string): LoopPhase {
  if (value === "preflight" || value === "after-edit" || value === "repair") return value;
  throw new Error(`Unsupported loop phase: ${value}`);
}

function parseAgentExecutor(value: string): AgentExecutorName {
  if (value === "codex" || value === "claude-code" || value === "opencode" || value === "mimocode" || value === "cursor" || value === "mock") return value;
  throw new Error(`Unsupported agent executor: ${value}`);
}

function parseOrchestratorCheckpoint(value: string): OrchestratorCheckpointMode {
  if (value === "none" || value === "git-worktree") return value;
  throw new Error(`Unsupported orchestrator checkpoint mode: ${value}`);
}

function parseTraceResult(value: string): ExecutionStepResult {
  if (value === "passed" || value === "failed" || value === "skipped" || value === "unknown") return value;
  throw new Error(`Unsupported trace result: ${value}`);
}

function parseTraceFinalState(value: string): ExecutionFinalState {
  if (value === "planned" || value === "in_progress" || value === "partial_success" || value === "success" || value === "failed" || value === "blocked")
    return value;
  throw new Error(`Unsupported trace final state: ${value}`);
}

function parsePolicyFailOn(value: string): PolicyFailOn {
  if (value === "forbidden" || value === "required" || value === "risk") return value;
  throw new Error(`Unsupported policy failure threshold: ${value}`);
}

function parseEvidenceSource(value: string): ExecutionEvidenceSource {
  if (value === "manual" || value === "command" || value === "ci") return value;
  throw new Error(`Unsupported evidence source: ${value}`);
}

function parseNonNegativeInteger(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Expected a non-negative integer, got: ${value}`);
  }

  return parsed;
}

function summarizeCacheStats(stats: CacheStats) {
  return {
    enabled: stats.enabled,
    reusedIndexedFiles: stats.indexHits,
    reindexedFiles: stats.indexMisses,
    reusedFileHashes: stats.fileHashHits,
    recalculatedFileHashes: stats.fileHashMisses,
    graphReused: stats.graphHits > 0,
    graphRebuilt: stats.graphMisses > 0,
    tokenCacheHits: stats.tokenHits,
    tokenCacheMisses: stats.tokenMisses,
    prunedFileHashes: stats.prunedFileHashes,
    prunedIndexEntries: stats.prunedIndexEntries
  };
}

function formatCacheStats(stats: CacheStats): string {
  if (!stats.enabled) return "disabled";
  const summary = summarizeCacheStats(stats);
  return [
    `reused indexed files ${summary.reusedIndexedFiles}`,
    `re-indexed files ${summary.reindexedFiles}`,
    `graph rebuilt ${summary.graphRebuilt ? "yes" : "no"}`,
    `token hits ${summary.tokenCacheHits}`,
    `token misses ${summary.tokenCacheMisses}`
  ].join("; ");
}

function printFileList(files: IndexedFile[]): void {
  if (!files.length) {
    console.log("No matching files detected.");
    return;
  }

  for (const file of files.sort((a, b) => b.importanceScore - a.importanceScore || a.path.localeCompare(b.path))) {
    console.log(`- ${file.path}`);
    console.log(`  - Score: ${file.importanceScore}`);
    console.log(`  - Summary: ${file.summary}`);
  }
}
