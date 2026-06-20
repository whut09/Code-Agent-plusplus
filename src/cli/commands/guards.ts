import type { Command } from "commander";
import { buildContextPackage } from "../../core/context-builder.js";
import { renderContractValidationReport, validateContracts } from "../../outputs/contract-validator.js";
import { buildHallucinationReport, renderHallucinationReport, writeHallucinationReport } from "../../harness/verification-plane/guards/hallucination.js";
import { buildRegressionReport, renderRegressionReport, writeRegressionReport } from "../../harness/verification-plane/guards/regression.js";

export function registerGuardCommands(program: Command): void {
  program
    .command("hallucination")
    .argument("[repo]", "repository path", ".")
    .option("--base <ref>", "base git ref for diff checks", "main")
    .option("--trace <id>", "execution trace id used as transcript evidence")
    .option("--task <task>", "task text used to derive the task id when no trace id is provided")
    .option("--no-write", "print the report without writing .agent-context hallucination artifacts")
    .option("--json", "print machine-readable hallucination report")
    .description("Detect deterministic OpenCode hallucinations: missing files, symbols, commands, dependencies, and config keys.")
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

  program
    .command("validate-contracts")
    .argument("[repo]", "repository path", ".")
    .option("--diff", "validate changed files from git diff and working tree", true)
    .option("--base <ref>", "base git ref", "main")
    .description("Validate changed files against generated OpenCode++ contracts and edit boundaries.")
    .action(async (repo: string, options: { diff?: boolean; base: string }) => {
      const context = await buildContextPackage(repo);
      const report = validateContracts(context, { base: options.base, diff: options.diff });
      console.log(renderContractValidationReport(context, { base: options.base, diff: options.diff }));
      if (!report.passed) process.exitCode = 1;
    });
}
