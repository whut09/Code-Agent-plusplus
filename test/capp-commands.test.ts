import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { getCappStatus, readCappReport, renderCappStatus } from "../src/cli/capp-commands.js";
import { ensureOpencodeSidecarPlugin, verifyOpencodeSidecar, writeOpencodeSidecarLatest } from "../src/integrations/opencode/sidecar.js";

test("capp report reads the latest sidecar markdown report", () => {
  const root = mkdtempSync(path.join(tmpdir(), "code-agent-plusplus-capp-report-"));
  try {
    const reportDir = path.join(root, ".agent-context", "sidecar");
    mkdirSync(reportDir, { recursive: true });
    writeFileSync(path.join(reportDir, "latest.md"), "# Latest\n\nready\n", "utf8");

    const report = readCappReport(root);

    assert.equal(report.exists, true);
    assert.match(report.content, /# Latest/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("capp status reports active sidecar signals", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "code-agent-plusplus-capp-status-"));
  try {
    mkdirSync(path.join(root, ".agent-context", "traces"), { recursive: true });
    ensureOpencodeSidecarPlugin(root);
    const verify = await verifyOpencodeSidecar(root);
    writeOpencodeSidecarLatest(verify);

    const status = getCappStatus(root);

    assert.equal(status.active, true);
    assert.equal(status.pluginExists, true);
    assert.equal(status.contextExists, true);
    assert.equal(status.latestExists, true);
    assert.match(renderCappStatus(status), /Sidecar: active/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
