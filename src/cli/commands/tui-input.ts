import type { Command } from "commander";
import { installClipCommand, readClipboardInput, setupEditor, writeClipboardLatest } from "../tui-input.js";

export function registerTuiInputCommands(program: Command): void {
  program
    .command("setup-editor")
    .description("Configure EDITOR for OpenCode TUI /editor input.")
    .action(() => {
      const result = setupEditor();
      if (result.persisted) {
        console.log(`EDITOR=${result.editor} written to the Windows user environment.`);
        console.log("Restart your terminal before launching OpenCode TUI.");
      } else {
        console.log("Add this to your shell profile:");
        console.log(result.command);
      }
    });

  program
    .command("clip")
    .argument("[repo]", "repository path", ".")
    .description("Write clipboard or piped text to .opencode-plusplus/clipboard/latest.md.")
    .action((repo: string) => {
      const text = readClipboardInput();
      if (!text.trim()) throw new Error("No clipboard or piped text found.");
      const result = writeClipboardLatest(repo, text);
      console.log(`Wrote ${result.path}`);
    });

  program
    .command("install-commands")
    .argument("[repo]", "repository path", ".")
    .description("Install OpenCode slash commands for OpenCode++ helpers.")
    .action((repo: string) => {
      const result = installClipCommand(repo);
      console.log(`Wrote ${result.path}`);
    });
}
