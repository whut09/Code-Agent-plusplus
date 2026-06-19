import assert from "node:assert/strict";
import test from "node:test";
import { resolveDefaultCommandArgs } from "../src/cli/default-command.js";

test("opencode-plusplus without arguments defaults to OpenCode TUI mode", () => {
  assert.deepEqual(resolveDefaultCommandArgs({ invokedName: "opencode-plusplus", argv: ["node", "opencode-plusplus"] }), ["node", "opencode-plusplus", "tui"]);
});

test("explicit opencode-plusplus commands preserve argv", () => {
  assert.deepEqual(resolveDefaultCommandArgs({ invokedName: "opencode-plusplus", argv: ["node", "opencode-plusplus", "oc", "task"] }), [
    "node",
    "opencode-plusplus",
    "oc",
    "task"
  ]);
});

test("opencode-plusplus supports --pure", () => {
  assert.deepEqual(resolveDefaultCommandArgs({ invokedName: "opencode-plusplus", argv: ["node", "opencode-plusplus", "--pure"] }), [
    "node",
    "opencode-plusplus",
    "tui",
    "--pure"
  ]);
});
