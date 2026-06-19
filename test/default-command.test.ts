import assert from "node:assert/strict";
import test from "node:test";
import { resolveDefaultCommandArgs } from "../src/cli/default-command.js";

test("capp without arguments defaults to OpenCode TUI mode", () => {
  assert.deepEqual(resolveDefaultCommandArgs({ invokedName: "capp", argv: ["node", "capp"] }), ["node", "capp", "tui"]);
});

test("code-agent-plusplus and explicit capp commands preserve argv", () => {
  assert.deepEqual(resolveDefaultCommandArgs({ invokedName: "code-agent-plusplus", argv: ["node", "code-agent-plusplus"] }), ["node", "code-agent-plusplus"]);
  assert.deepEqual(resolveDefaultCommandArgs({ invokedName: "capp", argv: ["node", "capp", "oc", "task"] }), ["node", "capp", "oc", "task"]);
});
