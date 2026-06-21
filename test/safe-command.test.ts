import assert from "node:assert/strict";
import test from "node:test";
import { parseCommandLine, runSafeCommandStreaming, shellQuote } from "../src/core/safe-command.js";

test("safe command parser preserves spaces and non-ASCII paths", () => {
  const parsed = parseCommandLine(`node "目录 带 空格/script.js" --repo '项目 路径/服务 A'`);

  assert.equal(parsed.file, "node");
  assert.deepEqual(parsed.args, ["目录 带 空格/script.js", "--repo", "项目 路径/服务 A"]);
});

test("safe command parser rejects shell control syntax", () => {
  assert.throws(() => parseCommandLine(`npm test && touch pwned.txt`), /Unsupported shell control operator/);
  assert.throws(() => parseCommandLine("npm test `touch pwned.txt`"), /Unsupported shell control operator/);
});

test("safe command parser preserves Windows backslash paths", () => {
  const parsed = parseCommandLine(`node 'C:\\Users\\dev\\AppData\\Local\\Temp\\script.cjs' --repo 'F:\\work repo\\app'`);

  assert.deepEqual(parsed.args, ["C:\\Users\\dev\\AppData\\Local\\Temp\\script.cjs", "--repo", "F:\\work repo\\app"]);
});

test("shellQuote single-quotes substituted placeholder data", () => {
  assert.equal(shellQuote("can't $(touch pwned)"), "'can'\\''t $(touch pwned)'");
});

test("streaming command stops after idle timeout", async () => {
  const result = await runSafeCommandStreaming(`node -e "setInterval(function(){}, 60000)"`, {
    cwd: process.cwd(),
    idleTimeoutMs: 100,
    timeoutMs: 5000
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /no output/i);
});
