import type { Command } from "commander";
import { renderOpenCodePlusplusDoctor, runOpenCodePlusplusDoctor } from "../opencode-plusplus-commands.js";

export function registerDoctorCommand(program: Command): void {
  program
    .command("doctor")
    .argument("[repo]", "repository path", ".")
    .option("--json", "print machine-readable doctor report")
    .description("Check OpenCode, auth, git, context, and OpenCode++ sidecar readiness.")
    .action(async (repo: string, options: { json?: boolean }) => {
      const report = await runOpenCodePlusplusDoctor(repo);
      console.log(options.json ? JSON.stringify(report, null, 2) : renderOpenCodePlusplusDoctor(report));
      if (!report.ok) process.exitCode = 1;
    });
}
