import path from "node:path";
import { dirnamePosix, stripLeadingDotSlash, withoutExtension } from "../core/path-utils.js";

const RESOLUTION_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".go", ".rs", ".json"];

export function resolveImport(
  fromPath: string,
  specifier: string,
  allPaths: Set<string>,
  pathAliases: Array<{ pattern: string; targets: string[] }> = []
): string | null {
  if (!specifier.startsWith(".") && !specifier.startsWith("/")) {
    const aliasCandidates = expandAliasCandidates(specifier, pathAliases);
    return aliasCandidates.flatMap(expandCandidates).find((candidate) => allPaths.has(candidate)) ?? null;
  }

  const baseDir = dirnamePosix(fromPath);
  const raw = specifier.startsWith("/")
    ? stripLeadingDotSlash(specifier)
    : path.posix.normalize(path.posix.join(baseDir, specifier));
  const candidates = expandCandidates(raw);

  return candidates.find((candidate) => allPaths.has(candidate)) ?? null;
}

function expandAliasCandidates(
  specifier: string,
  pathAliases: Array<{ pattern: string; targets: string[] }>
): string[] {
  const candidates: string[] = [];
  for (const alias of pathAliases) {
    const starIndex = alias.pattern.indexOf("*");
    if (starIndex === -1 && alias.pattern === specifier) {
      candidates.push(...alias.targets);
      continue;
    }
    if (starIndex === -1) continue;
    const prefix = alias.pattern.slice(0, starIndex);
    const suffix = alias.pattern.slice(starIndex + 1);
    if (!specifier.startsWith(prefix) || !specifier.endsWith(suffix)) continue;
    const wildcard = specifier.slice(prefix.length, specifier.length - suffix.length);
    candidates.push(...alias.targets.map((target) => target.replace("*", wildcard)));
  }

  if (specifier.startsWith("@/")) {
    candidates.push(`src/${specifier.slice(2)}`);
  }
  return candidates.map(stripLeadingDotSlash);
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
