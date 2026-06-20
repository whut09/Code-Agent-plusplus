import type { Command } from "commander";
import { readOpenCodePlusplusReport } from "../opencode-plusplus-commands.js";

export function registerReportCommand(program: Command): void {
  program
    .command("report")
    .argument("[repo]", "repository path", ".")
    .option("--json", "print report metadata and markdown content as JSON")
    .description("Show the latest OpenCode++ sidecar report.")
    .action((repo: string, options: { json?: boolean }) => {
      const report = readOpenCodePlusplusReport(repo);
      console.log(options.json ? JSON.stringify(report, null, 2) : report.content);
      if (!report.exists) process.exitCode = 1;
    });
}
