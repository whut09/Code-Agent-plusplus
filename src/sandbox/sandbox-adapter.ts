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
  gatewayDir?: string;
  manifestPath?: string;
  patchPath?: string;
  applyCommand?: string;
}

export interface SandboxExecuteOptions {
  timeoutMs?: number;
  idleTimeoutMs?: number;
  onStdout?: (text: string) => void;
  onStderr?: (text: string) => void;
}

export interface SandboxAdapter {
  prepare(runId: string, repo: string): Promise<SandboxHandle>;
  execute(command: string, options?: SandboxExecuteOptions): Promise<ExecResult>;
  diff(): Promise<string>;
  changedFiles(): Promise<string[]>;
  discard(): Promise<void>;
  exportPatch(): Promise<string>;
}
