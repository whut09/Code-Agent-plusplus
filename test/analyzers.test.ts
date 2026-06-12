import assert from "node:assert/strict";
import test from "node:test";
import { javascriptAnalyzer } from "../src/analyzers/javascript.js";
import { pythonAnalyzer } from "../src/analyzers/python.js";
import { parsePythonWithTreeSitter } from "../src/analyzers/tree-sitter.js";
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

test("TypeScript analyzer identifies Next page routes and mounted routes", () => {
  const result = javascriptAnalyzer.analyze(
    file("src/app/dashboard/page.tsx", "TypeScript", ".tsx"),
    `
app.use("/api", routes);
export default function DashboardPage() { return null; }
`,
    { allPaths: new Set(["src/app/dashboard/page.tsx"]), pathAliases: [] }
  );
  const apiResult = javascriptAnalyzer.analyze(
    file("src/pages/api/login.ts", "TypeScript", ".ts"),
    `
export default function handler() { return new Response("ok"); }
`,
    { allPaths: new Set(["src/pages/api/login.ts"]), pathAliases: [] }
  );

  assert.ok(result.symbols.some((symbol) => symbol.kind === "route" && symbol.name === "PAGE /dashboard"));
  assert.ok(result.symbols.some((symbol) => symbol.kind === "route" && symbol.name === "ROUTE /api"));
  assert.ok(apiResult.symbols.some((symbol) => symbol.kind === "route" && symbol.name === "API /api/login"));
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
  assert.ok(["tree-sitter-python", "python-ast", "regex-fallback"].includes(result.stats.parser));
  assert.equal(result.stats.importsResolved, 2);
});

test("Python analyzer identifies Flask routes, pytest fixtures, Django routes, and CLI guards", () => {
  const result = pythonAnalyzer.analyze(
    file("app/main.py", "Python", ".py"),
    `
from pytest import fixture
from django.urls import path, re_path

@fixture
def client():
    return object()

@app.route("/login", methods=["POST"])
def login():
    return "ok"

urlpatterns = [
    path("health/", health),
    re_path(r"^items/(?P<id>\\d+)/$", item)
]

if __name__ == "__main__":
    main()
`,
    { allPaths: new Set(["app/main.py"]), pathAliases: [] }
  );

  assert.ok(result.symbols.some((symbol) => symbol.kind === "fixture" && symbol.name === "fixture client"));
  assert.ok(result.symbols.some((symbol) => symbol.kind === "route" && symbol.name === "POST /login"));
  assert.ok(result.symbols.some((symbol) => symbol.kind === "route" && symbol.name === "DJANGO /health/"));
  assert.ok(result.symbols.some((symbol) => symbol.kind === "const" && symbol.name === "CLI __main__"));
  assert.ok(result.stats.routesDetected >= 2);
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

test("Tree-sitter Python adapter is optional and non-fatal when unavailable", () => {
  const result = parsePythonWithTreeSitter("from app.models import User\ndef login(): pass\n");

  if (result) {
    assert.ok(result.imports.some((item) => item.specifier === "app.models"));
    assert.ok(result.symbols.some((symbol) => symbol.name === "login"));
  } else {
    assert.equal(result, null);
  }
});
