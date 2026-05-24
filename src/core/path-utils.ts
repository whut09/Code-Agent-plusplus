import path from "node:path";

export function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

export function stripLeadingDotSlash(filePath: string): string {
  return filePath.replace(/^\.\/+/, "");
}

export function dirnamePosix(filePath: string): string {
  const dir = path.posix.dirname(filePath);
  return dir === "." ? "" : dir;
}

export function withoutExtension(filePath: string): string {
  return filePath.replace(/\.[^.]+$/, "");
}

export function moduleNameFor(filePath: string): string {
  const parts = filePath.split("/");
  if (parts[0] === "src" && parts.length > 2) {
    return parts[1];
  }

  if (parts[0] === "app" && parts.length > 2) {
    return parts[1];
  }

  if (parts.length > 1) {
    return parts[0];
  }

  return "root";
}
