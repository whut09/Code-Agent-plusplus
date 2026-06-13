import { existsSync } from "node:fs";
import path from "node:path";

export interface ResolvedTaskArguments {
  task: string;
  repo: string;
}

export interface ResolveTaskArgumentOptions {
  cwd?: string;
  pathExists?: (candidate: string) => boolean;
}

export function resolveTaskArguments(words: string[], repoOption?: string | string[], options: ResolveTaskArgumentOptions = {}): ResolvedTaskArguments {
  const taskWords = words.filter((word) => word.length > 0);
  const task = taskWords.join(" ").trim();
  if (!task) {
    throw new Error("Task description is required.");
  }

  const repo = normalizeRepoOption(repoOption);
  if (repo) {
    return { task, repo };
  }

  const trailingRepo = findTrailingRepo(taskWords, options);
  if (trailingRepo) {
    return trailingRepo;
  }

  return { task, repo: "." };
}

function normalizeRepoOption(repoOption: string | string[] | undefined): string | undefined {
  if (Array.isArray(repoOption)) {
    const repo = repoOption.join(" ").trim();
    return repo || undefined;
  }

  const repo = repoOption?.trim();
  return repo || undefined;
}

function findTrailingRepo(words: string[], options: ResolveTaskArgumentOptions): ResolvedTaskArguments | undefined {
  if (words.length < 2) return undefined;

  const cwd = options.cwd ?? process.cwd();
  const pathExists = options.pathExists ?? existsSync;
  for (let start = 1; start < words.length; start += 1) {
    const repo = words.slice(start).join(" ");
    const resolved = repo === "." ? cwd : path.isAbsolute(repo) ? repo : path.resolve(cwd, repo);
    if (!pathExists(resolved)) continue;

    const task = words.slice(0, start).join(" ").trim();
    if (task) {
      return { task, repo };
    }
  }

  return undefined;
}
