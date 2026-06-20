import type { Command } from "commander";
import { parseAgentBenchmarkModes, renderAgentBehaviorBenchmark, runAgentBehaviorBenchmark } from "../../benchmarks/agent-benchmark.js";
import { renderBenchmarkReport, runBenchmark } from "../../benchmarks/benchmark.js";
import type { AgentExecutorName } from "../../harness/control-plane/orchestrator.js";
import type { PolicyFailOn } from "../../harness/verification-plane/policy-engine.js";
import { parseAgentExecutor, parseInteger, parsePolicyFailOn, splitCsv } from "../parsers/options.js";

export function registerBenchmarkCommands(program: Command): void {
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
    .action(async (benchmarkDir: string, options: AgentBenchmarkCliOptions) => {
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
    });
}

interface AgentBenchmarkCliOptions {
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
