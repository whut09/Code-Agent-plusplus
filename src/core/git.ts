import { execFileSync } from "node:child_process";

const GIT_CANDIDATES = [
  "git",
  "D:\\Program Files\\Git\\cmd\\git.exe"
];

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
  return runGit(cwd, ["diff", "--name-only", base])
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\\/g, "/"))
    .filter(Boolean);
}
