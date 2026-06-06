import assert from "node:assert/strict";
import test from "node:test";
import { javascriptAnalyzer } from "../src/analyzers/javascript.js";
import { pythonAnalyzer } from "../src/analyzers/python.js";
import type { RepoFile } from "../src/core/types.js";

test("TypeScript compiler analyzer resolves aliases, barrel exports, and routes", () => {
  const paths = new Set(["src/auth/session.ts", "src/auth/index.ts", "src/plugins/audit.ts"]);
  const result = javascriptAnalyzer.analyze(
    file("src/auth/index.ts", "TypeScript", ".ts"),
    `
import type { Session } from "@/auth/session";
export { createSession } from "@/auth/session";
export * from "@/plugins/audit";
const audit = () => import("@/plugins/audit");
export async function GET() { return new Response("ok"); }
fastify.route({ method: "POST", url: "/sessions" });
@Controller("users")
class UsersController {
  @Get(":id")
  findOne() {}
}
`,
    { allPaths: paths, pathAliases: [{ pattern: "@/*", targets: ["src/*"] }] }
  );

  assert.equal(result.confidence, "high");
  assert.equal(result.imports[0]?.resolvedPath, "src/auth/session.ts");
  assert.equal(result.stats.parser, "typescript-compiler-api");
  assert.ok(result.stats.importsResolved >= 2);
  assert.ok(result.exports.includes("createSession"));
  assert.ok(result.symbols.some((symbol) => symbol.kind === "route" && symbol.name === "GET"));
  assert.ok(result.symbols.some((symbol) => symbol.kind === "route" && symbol.name === "POST /sessions"));
  assert.ok(result.symbols.some((symbol) => symbol.kind === "route" && symbol.name === "CONTROLLER /users"));
  assert.ok(result.evidence.length > 0);
});

test("Python analyzer resolves local absolute and relative imports", () => {
  const paths = new Set(["app/auth/service.py", "app/auth/models.py", "shared/config.py"]);
  const result = pythonAnalyzer.analyze(
    file("app/auth/service.py", "Python", ".py"),
    `
from .models import User
from shared.config import settings
def login(): pass
`,
    { allPaths: paths, pathAliases: [] }
  );

  assert.equal(result.imports.find((item) => item.specifier === ".models")?.resolvedPath, "app/auth/models.py");
  assert.equal(result.imports.find((item) => item.specifier === "shared.config")?.resolvedPath, "shared/config.py");
  assert.equal(result.confidence, "medium");
  assert.ok(["python-ast", "regex-fallback"].includes(result.stats.parser));
  assert.equal(result.stats.importsResolved, 2);
});

function file(path: string, language: string, extension: string): RepoFile {
  return {
    path,
    absolutePath: `C:/repo/${path}`,
    extension,
    sizeBytes: 100,
    kind: "source",
    language,
    tokenEstimate: 25,
    isBinary: false,
    isGenerated: false,
    isTest: false
  };
}
