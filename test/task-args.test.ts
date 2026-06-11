import assert from "node:assert/strict";
import test from "node:test";
import { resolveTaskArguments } from "../src/cli/task-args.js";

test("task args use explicit repo option for paths with spaces and Chinese", () => {
  const result = resolveTaskArguments(["fix", "login", "timeout"], "/tmp/项目 repo");

  assert.deepEqual(result, {
    task: "fix login timeout",
    repo: "/tmp/项目 repo"
  });
});

test("task args preserve backwards compatible quoted task and positional repo", () => {
  const result = resolveTaskArguments(["fix login timeout", "."], undefined, {
    cwd: "/work/app",
    pathExists: (candidate) => candidate === "/work/app"
  });

  assert.deepEqual(result, {
    task: "fix login timeout",
    repo: "."
  });
});

test("task args recover an unquoted trailing repo path with spaces", () => {
  const result = resolveTaskArguments(["修复", "登录", "/work/中文", "repo"], undefined, {
    pathExists: (candidate) => candidate === "/work/中文 repo"
  });

  assert.deepEqual(result, {
    task: "修复 登录",
    repo: "/work/中文 repo"
  });
});

test("task args default to current repo when no trailing path exists", () => {
  const result = resolveTaskArguments(["fix", "login", "timeout"], undefined, {
    cwd: "/work/app",
    pathExists: () => false
  });

  assert.deepEqual(result, {
    task: "fix login timeout",
    repo: "."
  });
});

test("task args join variadic repo option words", () => {
  const result = resolveTaskArguments(["fix", "login"], ["/tmp/中文", "repo"]);

  assert.deepEqual(result, {
    task: "fix login",
    repo: "/tmp/中文 repo"
  });
});
