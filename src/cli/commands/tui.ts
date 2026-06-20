import type { Command } from "commander";
import {
  launchOpencodeTui,
  renderOpenCodeLauncherExit,
  renderOpenCodeLauncherPreflight,
  renderOpenCodeLauncherResult
} from "../../integrations/opencode/launcher.js";

export function registerTuiCommand(program: Command, invokedName: string): void {
  program
    .command("tui", { hidden: invokedName !== "opencode-plusplus" })
    .argument("[repo]", "repository path", ".")
    .option("--force-plugin", "overwrite .opencode/plugins/opencode-plusplus.ts")
    .option("--skip-context", "do not generate .agent-context before launching OpenCode")
    .option("--pure", "launch plain OpenCode without OpenCode++ context or sidecar")
    .option("--dry-run", "run preflight and show what would launch without opening OpenCode")
    .option("--json", "print machine-readable launcher report")
    .description("Launch OpenCode TUI with the OpenCode++ sidecar plugin.")
    .action(async (repo: string, options: { forcePlugin?: boolean; skipContext?: boolean; pure?: boolean; dryRun?: boolean; json?: boolean }) => {
      const result = await launchOpencodeTui({
        repo,
        forcePlugin: options.forcePlugin,
        skipContext: options.skipContext,
        pure: options.pure,
        dryRun: options.dryRun,
        onPreflight:
          options.json || options.dryRun
            ? undefined
            : (preflight) => {
                console.log(renderOpenCodeLauncherPreflight(preflight));
              }
      });
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else if (options.dryRun || !result.launched) {
        console.log(renderOpenCodeLauncherResult(result));
      } else {
        console.log(renderOpenCodeLauncherExit(result));
      }
      if (typeof result.exitCode === "number" && result.exitCode !== 0) process.exitCode = result.exitCode;
    });
}
