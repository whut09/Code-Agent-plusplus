import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { runGit } from "../src/core/git.js";
import { launchOpenCodeWithSidecar } from "../src/integrations/opencode/launcher.js";
import { OPENCODE_SIDECAR_PLUGIN_PATH, opencodeSidecarPluginTemplate } from "../src/integrations/opencode/sidecar-plugin-template.js";

test("OpenCode launcher dry-run prepares sidecar context without opening the TUI", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "code-agent-plusplus-opencode-launcher-"));
  const bin = path.join(root, "bin");
  const oldPath = process.env.PATH;
  try {
    mkdirSync(bin, { recursive: true });
    writeFakeOpenCode(bin);
    process.env.PATH = `${bin}${path.delimiter}${oldPath ?? ""}`;
    writeFileSync(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node -e \"console.log('ok')\"" } }), "utf8");
    runGit(root, ["init"]);
    runGit(root, ["checkout", "-b", "main"]);
    runGit(root, ["config", "user.email", "code-agent-plusplus@example.com"]);
    runGit(root, ["config", "user.name", "Code Agent Plus Plus"]);
    runGit(root, ["add", "."]);
    runGit(root, ["commit", "-m", "initial"]);

    const result = await launchOpenCodeWithSidecar({ repo: root, skipContext: true, dryRun: true });

    assert.equal(result.launched, false);
    assert.equal(result.exitCode, 0);
    assert.deepEqual(result.command, ["opencode", root]);
    assert.equal(result.steps.find((step) => step.name === "opencode")?.status, "pass");
    assert.equal(result.steps.find((step) => step.name === "git")?.status, "pass");
    assert.equal(result.steps.find((step) => step.name === "context")?.status, "skipped");
    assert.equal(result.steps.find((step) => step.name === "sidecar-plugin")?.status, "pass");
    assert.equal(existsSync(path.join(root, ".opencode")), false);
    assert.equal(existsSync(path.join(root, OPENCODE_SIDECAR_PLUGIN_PATH)), false);
  } finally {
    process.env.PATH = oldPath;
    rmSync(root, { recursive: true, force: true });
  }
});

test("OpenCode sidecar plugin template uses the project plugin export shape", () => {
  const source = opencodeSidecarPluginTemplate();

  assert.match(source, /export const CodeAgentPlusPlusSidecar/);
  assert.match(source, /event: async/);
  assert.match(source, /session\.created/);
  assert.match(source, /\/capp <task>/);
});

function writeFakeOpenCode(bin: string): void {
  if (process.platform === "win32") {
    writeFileSync(path.join(bin, "opencode.cmd"), '@echo off\r\nif "%1"=="--version" echo opencode 0.0.0-test& exit /b 0\r\necho tui& exit /b 0\r\n', "utf8");
    return;
  }

  const script = path.join(bin, "opencode");
  writeFileSync(
    script,
    ["#!/usr/bin/env sh", 'if [ "$1" = "--version" ]; then echo "opencode 0.0.0-test"; exit 0; fi', "echo tui", "exit 0"].join("\n"),
    "utf8"
  );
  chmodSync(script, 0o755);
}
