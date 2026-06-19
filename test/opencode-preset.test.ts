import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { runGit } from "../src/core/git.js";
import { OPENCODE_DEFAULT_EXECUTOR_COMMAND, runOpencodeDoctor } from "../src/cli/opencode-preset.js";

test("OpenCode preset uses the requested default executor command", () => {
  assert.equal(OPENCODE_DEFAULT_EXECUTOR_COMMAND, 'opencode run --format json --dir {repo} --file {prompt} "Follow the attached Code Agent++ task prompt."');
});

test("OpenCode doctor reports a ready repo when OpenCode, auth, git, context, and clean tree checks pass", () => {
  const root = mkdtempSync(path.join(tmpdir(), "code-agent-plusplus-opencode-doctor-"));
  const bin = path.join(root, "bin");
  const oldPath = process.env.PATH;
  try {
    mkdirSync(bin, { recursive: true });
    writeFakeOpenCode(bin);
    process.env.PATH = `${bin}${path.delimiter}${oldPath ?? ""}`;

    mkdirSync(path.join(root, ".agent-context"), { recursive: true });
    writeFileSync(path.join(root, ".agent-context", "README.md"), "generated context\n", "utf8");
    writeFileSync(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node -e \"console.log('ok')\"" } }), "utf8");
    runGit(root, ["init"]);
    runGit(root, ["checkout", "-b", "main"]);
    runGit(root, ["config", "user.email", "code-agent-plusplus@example.com"]);
    runGit(root, ["config", "user.name", "Code Agent Plus Plus"]);
    runGit(root, ["add", "."]);
    runGit(root, ["commit", "-m", "initial"]);

    const report = runOpencodeDoctor(root);

    assert.equal(report.ok, true);
    assert.equal(report.checks.find((check) => check.id === "opencode-installed")?.status, "pass");
    assert.equal(report.checks.find((check) => check.id === "opencode-run")?.status, "pass");
    assert.equal(report.checks.find((check) => check.id === "opencode-auth")?.status, "pass");
    assert.equal(report.checks.find((check) => check.id === "git-repo")?.status, "pass");
    assert.equal(report.checks.find((check) => check.id === "agent-context")?.status, "pass");
    assert.equal(report.checks.find((check) => check.id === "working-tree-clean")?.status, "pass");
  } finally {
    process.env.PATH = oldPath;
    rmSync(root, { recursive: true, force: true });
  }
});

function writeFakeOpenCode(bin: string): void {
  if (process.platform === "win32") {
    writeFileSync(
      path.join(bin, "opencode.cmd"),
      [
        "@echo off",
        'if "%1"=="--version" echo opencode 0.0.0-test& exit /b 0',
        'if "%1"=="run" if "%2"=="--help" echo opencode run help& exit /b 0',
        'if "%1"=="auth" if "%2"=="list" echo test-provider& exit /b 0',
        "echo unsupported %*& exit /b 1"
      ].join("\r\n"),
      "utf8"
    );
    return;
  }

  const script = path.join(bin, "opencode");
  writeFileSync(
    script,
    [
      "#!/usr/bin/env sh",
      'if [ "$1" = "--version" ]; then echo \'opencode 0.0.0-test\'; exit 0; fi',
      'if [ "$1" = "run" ] && [ "$2" = "--help" ]; then echo \'opencode run help\'; exit 0; fi',
      'if [ "$1" = "auth" ] && [ "$2" = "list" ]; then echo \'test-provider\'; exit 0; fi',
      'echo "unsupported $*" >&2',
      "exit 1"
    ].join("\n"),
    "utf8"
  );
  chmodSync(script, 0o755);
}
