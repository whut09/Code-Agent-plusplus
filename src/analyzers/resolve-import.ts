import path from "node:path";
import { dirnamePosix, stripLeadingDotSlash, withoutExtension } from "../core/path-utils.js";

const RESOLUTION_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".go", ".rs", ".json"];

export function resolveImport(fromPath: string, specifier: string, allPaths: Set<string>): string | null {
  if (!specifier.startsWith(".") && !specifier.startsWith("/")) {
    return null;
  }

  const baseDir = dirnamePosix(fromPath);
  const raw = specifier.startsWith("/")
    ? stripLeadingDotSlash(specifier)
    : path.posix.normalize(path.posix.join(baseDir, specifier));
  const candidates = expandCandidates(raw);

  return candidates.find((candidate) => allPaths.has(candidate)) ?? null;
}

function expandCandidates(raw: string): string[] {
  const candidates = [raw];
  const extension = path.posix.extname(raw);
  if (!extension) {
    for (const extension of RESOLUTION_EXTENSIONS) {
      candidates.push(`${raw}${extension}`);
    }
    for (const extension of RESOLUTION_EXTENSIONS) {
      candidates.push(`${raw}/index${extension}`);
    }
  }

  if (extension === ".js" || extension === ".mjs" || extension === ".cjs") {
    const base = raw.slice(0, -extension.length);
    candidates.push(`${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`);
  }

  const withoutExt = withoutExtension(raw);
  if (withoutExt !== raw) {
    candidates.push(withoutExt);
  }

  return candidates.map(stripLeadingDotSlash);
}
