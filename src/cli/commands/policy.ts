import type { Command } from "commander";
import { buildContextPackage } from "../../core/context-builder.js";
import { buildPolicyReport, renderPolicyReport } from "../../harness/verification-plane/policy-engine.js";
import { parsePolicyFailOn } from "../parsers/options.js";

export function registerPolicyCommand(program: Command): void {
  program
    .command("policy")
    .argument("[repo]", "repository path", ".")
    .option("--base <ref>", "base git ref for diff checks", "main")
    .option("--trace <id>", "execution trace id used as verification evidence")
    .option("--fail-on <level>", "policy failure threshold: forbidden, required, risk", parsePolicyFailOn, "required")
    .option("--json", "print machine-readable policy report")
    .description("Evaluate changed files, trace evidence, contracts, freshness, impact, and guard findings against policy gates.")
    .action(async (repo: string, options: { base: string; trace?: string; failOn: ReturnType<typeof parsePolicyFailOn>; json?: boolean }) => {
      const context = await buildContextPackage(repo);
      const report = buildPolicyReport(context, { base: options.base, traceId: options.trace, failOn: options.failOn });
      console.log(options.json ? JSON.stringify(report, null, 2) : renderPolicyReport(report));
      if (!report.passed) process.exitCode = 1;
    });
}
