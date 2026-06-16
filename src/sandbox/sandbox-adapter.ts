export interface ExecResult {
  command: string;
  file: string;
  args: string[];
  stdout: string;
  stderr: string;
  status: number | null;
  error?: Error;
}

export interface SandboxHandle {
  mode: "host" | "git-worktree";
  runId: string;
  hostRepo: string;
  root: string;
  createdAt: string;
  initialPatch?: string;
}

export interface SandboxAdapter {
  prepare(runId: string, repo: string): Promise<SandboxHandle>;
  execute(command: string): Promise<ExecResult>;
  diff(): Promise<string>;
  changedFiles(): Promise<string[]>;
  discard(): Promise<void>;
  exportPatch(): Promise<string>;
}
