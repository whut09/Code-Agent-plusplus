import { execFileSync } from "node:child_process";

const GIT_CANDIDATES = ["git", "D:\\Program Files\\Git\\cmd\\git.exe"];

export function runGit(cwd: string, args: string[]): string {
  const errors: string[] = [];
  for (const git of GIT_CANDIDATES) {
    try {
      return execFileSync(git, args, {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"]
      });
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  throw new Error(`Unable to run git. Tried: ${GIT_CANDIDATES.join(", ")}. ${errors[0] ?? ""}`);
}

export function changedFilesSince(cwd: string, base: string): string[] {
  const changed = parseGitPathList(runGit(cwd, ["diff", "--name-only", base]));
  const untracked = parseGitPathList(runGit(cwd, ["ls-files", "--others", "--exclude-standard"]));
  return [...new Set([...changed, ...untracked])].filter((file) => !isGeneratedCachePath(file)).sort();
}

function isGeneratedCachePath(filePath: string): boolean {
  return filePath.startsWith(".agent-context/cache/");
}

function parseGitPathList(output: string): string[] {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\\/g, "/"))
    .filter(Boolean);
}
