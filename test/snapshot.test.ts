import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { buildContextPackage } from "../src/core/context-builder.js";

test("Next fixture context snapshot remains stable", async () => {
  const context = await buildContextPackage(path.resolve("test/fixtures/next-app"));
  const route = context.index.files.find((file) => file.path === "src/app/api/login/route.ts");
  const snapshot = {
    frameworks: context.scan.frameworks,
    runCommands: context.scan.runCommands,
    testCommands: context.scan.testCommands,
    lintCommands: context.scan.lintCommands,
    typecheckCommands: context.scan.typecheckCommands,
    routeConfidence: route?.confidence,
    routeImports: route?.imports.map((item) => [item.specifier, item.resolvedPath]),
    routeSymbols: route?.symbols.filter((symbol) => symbol.kind === "route").map((symbol) => symbol.name),
    categories: context.readiness.categories.map((category) => category.category),
    topKeyFiles: context.keyFiles.slice(0, 4).map((file) => file.path),
    repoSummaryIncludes: {
      entrypoint: context.summaries.repoSummary.includes("src/app/api/login/route.ts"),
      module: context.summaries.repoSummary.includes("auth"),
      command: context.summaries.repoSummary.includes("npm run dev")
    }
  };

  assert.deepEqual(snapshot, {
    frameworks: ["Next.js", "React"],
    runCommands: ["npm run dev"],
    testCommands: ["npm run test"],
    lintCommands: ["npm run lint"],
    typecheckCommands: ["npm run typecheck"],
    routeConfidence: "high",
    routeImports: [["@/auth/session", "src/auth/session.ts"]],
    routeSymbols: ["POST", "POST /api/login"],
    categories: ["structure", "commands", "tests", "architecture", "task-context", "safety"],
    topKeyFiles: ["src/app/api/login/route.ts", "src/auth/session.ts", "package.json"],
    repoSummaryIncludes: {
      entrypoint: true,
      module: true,
      command: true
    }
  });
});