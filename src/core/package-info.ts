import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const OPENCODE_PLUSPLUS_PACKAGE_NAME = "opencode-plusplus";

export function getOpenCodePlusplusPackageVersion(): string {
  const start = path.dirname(fileURLToPath(import.meta.url));
  const packagePath = findPackageJson(start);
  if (!packagePath) return "unknown";

  try {
    const parsed = JSON.parse(readFileSync(packagePath, "utf8")) as { name?: unknown; version?: unknown };
    if (parsed.name === OPENCODE_PLUSPLUS_PACKAGE_NAME && typeof parsed.version === "string") return parsed.version;
  } catch {
    return "unknown";
  }
  return "unknown";
}

function findPackageJson(start: string): string | undefined {
  let current = start;
  while (true) {
    const candidate = path.join(current, "package.json");
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
}
