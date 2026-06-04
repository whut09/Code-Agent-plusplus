import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { buildContextPackage } from "../src/core/context-builder.js";

const fixtures = path.resolve("test/fixtures");

test("Next fixture resolves tsconfig aliases and route handlers", async () => {
  const context = await buildContextPackage(path.join(fixtures, "next-app"));
  const route = context.index.files.find((file) => file.path === "src/app/api/login/route.ts");

  assert.ok(route?.imports.some((item) => item.resolvedPath === "src/auth/session.ts"));
  assert.ok(route?.symbols.some((symbol) => symbol.kind === "route" && symbol.name === "POST"));
  assert.equal(route?.confidence, "high");
});

test("Python fixture resolves local package imports", async () => {
  const context = await buildContextPackage(path.join(fixtures, "python-package"));
  const service = context.index.files.find((file) => file.path === "src/app/service.py");

  assert.ok(service?.imports.some((item) => item.resolvedPath === "src/app/models.py"));
  assert.equal(service?.confidence, "medium");
});

test("monorepo fixture detects workspace signals", async () => {
  const context = await buildContextPackage(path.join(fixtures, "monorepo"));

  assert.ok(context.scan.frameworks.includes("Turborepo"));
  assert.ok(context.scan.frameworks.includes("pnpm Workspace"));
  assert.ok(context.scan.frameworks.includes("JavaScript Workspace"));
});
