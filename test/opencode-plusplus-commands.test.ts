import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { getOpenCodePlusplusStatus, readOpenCodePlusplusReport, renderOpenCodePlusplusStatus } from "../src/cli/opencode-plusplus-commands.js";
import { ensureOpencodeSidecarPlugin, verifyOpencodeSidecar, writeOpencodeSidecarLatest } from "../src/integrations/opencode/sidecar.js";

test("opencode-plusplus report reads the latest sidecar markdown report", () => {
  const root = mkdtempSync(path.join(tmpdir(), "opencode-plusplus-opencode-plusplus-report-"));
  try {
    const reportDir = path.join(root, ".agent-context", "sidecar");
    mkdirSync(reportDir, { recursive: true });
    writeFileSync(path.join(reportDir, "latest.md"), "# Latest\n\nready\n", "utf8");

    const report = readOpenCodePlusplusReport(root);

    assert.equal(report.exists, true);
    assert.match(report.content, /# Latest/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("opencode-plusplus status reports active sidecar signals", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "opencode-plusplus-opencode-plusplus-status-"));
  try {
    mkdirSync(path.join(root, ".agent-context", "traces"), { recursive: true });
    ensureOpencodeSidecarPlugin(root);
    const verify = await verifyOpencodeSidecar(root);
    writeOpencodeSidecarLatest(verify);

    const status = getOpenCodePlusplusStatus(root);

    assert.equal(status.active, true);
    assert.equal(status.pluginExists, true);
    assert.equal(status.contextExists, true);
    assert.equal(status.latestExists, true);
    assert.match(renderOpenCodePlusplusStatus(status), /Sidecar: active/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
