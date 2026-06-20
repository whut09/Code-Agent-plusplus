import path from "node:path";
import type { Command } from "commander";
import { buildContextPackage } from "../../core/context-builder.js";
import {
  addRegressionMemoryFromCandidate,
  buildRegressionMemoryCandidate,
  readLatestCandidate,
  writeRegressionMemoryCandidate,
  type RegressionMemoryOptions
} from "../../harness/verification-plane/guards/regression-memory.js";
import { splitCsv } from "../parsers/options.js";

export function registerMemoryCommands(program: Command): void {
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
      console.log("Review it, then confirm with `opencode-plusplus memory add-fix . --candidate <file>`.");
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
        console.error("No regression memory candidate found. Run `opencode-plusplus memory learn-from-pr .` first or pass --candidate.");
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
}

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
