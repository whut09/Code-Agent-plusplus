import type { Command } from "commander";
import { getOpenCodePlusplusStatus, renderOpenCodePlusplusStatus } from "../opencode-plusplus-commands.js";

export function registerStatusCommand(program: Command): void {
  program
    .command("status")
    .argument("[repo]", "repository path", ".")
    .option("--json", "print machine-readable status")
    .description("Show whether the OpenCode++ OpenCode sidecar is active.")
    .action((repo: string, options: { json?: boolean }) => {
      const report = getOpenCodePlusplusStatus(repo);
      console.log(options.json ? JSON.stringify(report, null, 2) : renderOpenCodePlusplusStatus(report));
      if (!report.active) process.exitCode = 1;
    });
}
