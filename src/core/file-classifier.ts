import path from "node:path";
import type { FileKind } from "./types.js";
import { isSourceLanguage } from "./language.js";

const DOC_EXTENSIONS = new Set([".md", ".mdx", ".txt", ".rst", ".adoc"]);
const ASSET_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg", ".pdf", ".zip", ".gz", ".woff", ".woff2", ".ttf", ".mp4", ".mp3"]);

const CONFIG_NAMES = new Set([
  "package.json",
  "tsconfig.json",
  "vite.config.ts",
  "next.config.js",
  "next.config.mjs",
  "pyproject.toml",
  "requirements.txt",
  "Cargo.toml",
  "go.mod",
  "pom.xml",
  "build.gradle",
  "Dockerfile",
  "docker-compose.yml",
  ".env.example",
  ".github/workflows",
  "code-agent-plusplus.config.yml",
  "code-agent-plusplus.config.yaml"
]);

const LOCK_NAMES = new Set(["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "Cargo.lock", "poetry.lock", "Pipfile.lock", "go.sum"]);

export function classifyFile(filePath: string, extension: string, language: string | null): FileKind {
  const base = path.posix.basename(filePath);

  if (isGeneratedPath(filePath)) {
    return "generated";
  }

  if (LOCK_NAMES.has(base)) {
    return "lockfile";
  }

  if (isTestPath(filePath)) {
    return "test";
  }

  if (DOC_EXTENSIONS.has(extension)) {
    return "docs";
  }

  if (ASSET_EXTENSIONS.has(extension)) {
    return "asset";
  }

  if (CONFIG_NAMES.has(base) || CONFIG_NAMES.has(filePath) || filePath.startsWith(".github/workflows/")) {
    return "config";
  }

  if (isSourceLanguage(language)) {
    return "source";
  }

  return "unknown";
}

export function isTestPath(filePath: string): boolean {
  return (
    /(^|\/)(__tests__|tests?|spec)\//i.test(filePath) ||
    /\.(test|spec)\.[cm]?[tj]sx?$/i.test(filePath) ||
    /_test\.go$/i.test(filePath) ||
    /test_.*\.py$/i.test(path.posix.basename(filePath)) ||
    /_test\.py$/i.test(path.posix.basename(filePath))
  );
}

export function isGeneratedPath(filePath: string): boolean {
  return /(^|\/)(generated|__generated__|gen)\//i.test(filePath) || /\.generated\./i.test(filePath) || /\.pb\.(go|ts|js)$/i.test(filePath);
}
