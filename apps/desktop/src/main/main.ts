import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";

interface RunTaskInput {
  repo: string;
  task: string;
}

interface RunTaskStarted {
  pid: number | null;
  command: string;
  args: string[];
}

interface RunTaskRejected {
  error: string;
}

type RunTaskResult = RunTaskStarted | RunTaskRejected;

interface CliCommand {
  command: string;
  argsPrefix: string[];
  source: string;
  details: string;
  shell: boolean;
}

interface LatestReportSummary {
  reportPath?: string;
  decision?: string;
  blocking?: boolean;
  changedFiles?: number;
}

let mainWindow: BrowserWindow | undefined;
let currentTask: ChildProcess | undefined;
let currentRepo: string | undefined;
let currentTaskHeartbeat: NodeJS.Timeout | undefined;
let currentTaskStartedAt = 0;
let currentTaskLastOutputAt = 0;
let currentTaskLastRealOutputAt = 0;
let currentTaskStartedWallClock = 0;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 960,
    minHeight: 620,
    title: "OpenCode++ Desktop",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devServer = process.env.OPENCODE_PLUSPLUS_DESKTOP_RENDERER_URL;
  if (devServer) {
    await mainWindow.loadURL(devServer);
  } else {
    await mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
  }
}

function registerIpc(): void {
  ipcMain.handle("repo:select", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
      title: "Select repository"
    });
    return result.canceled ? undefined : result.filePaths[0];
  });

  ipcMain.handle("task:run", (_event, input: RunTaskInput): RunTaskResult => {
    if (currentTask) return { error: "A task is already running." };
    const repo = input.repo.trim();
    const task = normalizeTaskForCli(input.task);
    if (!repo) return { error: "Select a repository first." };
    if (!task) return { error: "Enter a task first." };
    if (!existsSync(repo)) return { error: `Repository does not exist: ${repo}` };

    const cli = resolveCliCommand();
    const command = cli.command;
    const cliArgs = [
      "oc",
      "run",
      "--repo",
      repo,
      "--max-loops",
      "2",
      "--stream-executor",
      "--executor-command",
      desktopOpenCodeExecutorCommand(),
      "--executor-idle-timeout-ms",
      "180000",
      "--executor-timeout-ms",
      "1200000",
      "--",
      task
    ];
    const args = [...cli.argsPrefix, ...cliArgs];
    currentRepo = repo;
    currentTaskStartedAt = Date.now();
    currentTaskLastOutputAt = currentTaskStartedAt;
    currentTaskLastRealOutputAt = currentTaskStartedAt;
    currentTaskStartedWallClock = currentTaskStartedAt;
    currentTask = spawn(command, args, {
      cwd: repo,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      shell: cli.shell,
      windowsHide: true
    });

    mainWindow?.webContents.send("task:output", { stream: "system", text: `CLI: ${cli.source} (${cli.details})\n` });
    mainWindow?.webContents.send("task:output", { stream: "system", text: `Starting: ${formatCommand(command, args)}\n` });
    mainWindow?.webContents.send("task:output", {
      stream: "system",
      text: `Process started with PID ${currentTask.pid ?? "unknown"}. Waiting for harness progress and OpenCode output...\n`
    });
    startTaskHeartbeat();

    currentTask.stdout?.on("data", (chunk: Buffer) => {
      currentTaskLastOutputAt = Date.now();
      currentTaskLastRealOutputAt = currentTaskLastOutputAt;
      mainWindow?.webContents.send("task:output", { stream: "stdout", text: chunk.toString("utf8") });
    });

    currentTask.stderr?.on("data", (chunk: Buffer) => {
      currentTaskLastOutputAt = Date.now();
      currentTaskLastRealOutputAt = currentTaskLastOutputAt;
      mainWindow?.webContents.send("task:output", { stream: "stderr", text: chunk.toString("utf8") });
    });

    let finished = false;
    currentTask.once("error", (error) => {
      finished = true;
      stopTaskHeartbeat();
      currentTask = undefined;
      mainWindow?.webContents.send("task:output", { stream: "stderr", text: `${error.message}\n` });
      mainWindow?.webContents.send("task:exit", {
        code: null,
        signal: "spawn-error",
        error: error.message
      });
    });

    currentTask.once("close", (code, signal) => {
      if (finished) return;
      finished = true;
      stopTaskHeartbeat();
      const summary = currentRepo ? findLatestReportSummary(currentRepo, { sinceMs: currentTaskStartedWallClock }) : {};
      currentTask = undefined;
      mainWindow?.webContents.send("task:exit", {
        code,
        signal,
        reportPath: summary.reportPath,
        decision: summary.decision,
        blocking: summary.blocking,
        changedFiles: summary.changedFiles
      });
    });

    return { pid: currentTask.pid ?? null, command, args };
  });

  ipcMain.handle("task:stop", async () => {
    if (!currentTask) return { stopped: false };
    const pid = currentTask.pid;
    mainWindow?.webContents.send("task:output", { stream: "system", text: `Stopping task PID ${pid ?? "unknown"}...\n` });
    if (process.platform === "win32" && pid) {
      spawn("taskkill", ["/pid", String(pid), "/t", "/f"], { windowsHide: true });
    } else {
      currentTask.kill("SIGTERM");
    }
    return { stopped: true };
  });

  ipcMain.handle("report:latest", (_event, repo: string) => {
    return findLatestReport(repo);
  });

  ipcMain.handle("report:open", async (_event, repo: string) => {
    const reportPath = findLatestReport(repo);
    if (!reportPath) return { opened: false, error: "No orchestrator report found yet." };
    const error = await shell.openPath(reportPath);
    return error ? { opened: false, error } : { opened: true, path: reportPath };
  });
}

function resolveCliCommand(): CliCommand {
  const explicit = process.env.OPENCODE_PLUSPLUS_BIN?.trim();
  if (explicit) {
    return {
      command: explicit,
      argsPrefix: [],
      source: "OPENCODE_PLUSPLUS_BIN",
      details: explicit,
      shell: shouldUseShellForCommand(explicit)
    };
  }

  const projectRoot = findOpenCodePlusPlusRoot(__dirname);
  const localCli = projectRoot ? path.join(projectRoot, "dist", "cli", "index.js") : undefined;
  if (localCli && existsSync(localCli)) {
    return {
      command: process.env.OPENCODE_PLUSPLUS_NODE?.trim() || "node",
      argsPrefix: [localCli],
      source: "local dist CLI",
      details: localCli,
      shell: false
    };
  }

  const fallback = process.platform === "win32" ? "opencode-plusplus.cmd" : "opencode-plusplus";
  return {
    command: fallback,
    argsPrefix: [],
    source: "PATH fallback",
    details: `${fallback} from PATH`,
    shell: shouldUseShellForCommand(fallback)
  };
}

function desktopOpenCodeExecutorCommand(): string {
  return 'opencode run --pure --print-logs --log-level INFO --format json --dir {repo} "Follow the attached OpenCode++ task prompt." --file {prompt}';
}

function shouldUseShellForCommand(command: string): boolean {
  return process.platform === "win32" && /\.(cmd|bat)$/i.test(command);
}

function findOpenCodePlusPlusRoot(startDir: string): string | undefined {
  let current = path.resolve(startDir);
  for (let depth = 0; depth < 8; depth += 1) {
    const packageJson = path.join(current, "package.json");
    if (existsSync(packageJson)) {
      try {
        const parsed = JSON.parse(readFileSync(packageJson, "utf8")) as { name?: unknown };
        if (parsed.name === "opencode-plusplus") return current;
      } catch {
        // Keep walking upward.
      }
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return undefined;
}

function startTaskHeartbeat(): void {
  stopTaskHeartbeat();
  currentTaskHeartbeat = setInterval(() => {
    if (!currentTask) {
      stopTaskHeartbeat();
      return;
    }
    const now = Date.now();
    const heartbeatSilenceMs = now - currentTaskLastOutputAt;
    if (heartbeatSilenceMs < 8000) return;
    const realSilenceMs = now - currentTaskLastRealOutputAt;
    const staleHint =
      realSilenceMs >= 60000 ? " No real CLI output for over a minute; OpenCode may be waiting on auth/model/network input or a long-running tool." : "";
    mainWindow?.webContents.send("task:output", {
      stream: "system",
      text: `Still running (${formatDuration(now - currentTaskStartedAt)} elapsed, no real output for ${formatDuration(realSilenceMs)}). Waiting for harness/OpenCode output...${staleHint}\n`
    });
    currentTaskLastOutputAt = now;
  }, 8000);
}

function stopTaskHeartbeat(): void {
  if (!currentTaskHeartbeat) return;
  clearInterval(currentTaskHeartbeat);
  currentTaskHeartbeat = undefined;
}

function findLatestReport(repo: string): string | undefined {
  return findLatestReportSummary(repo).reportPath;
}

function findLatestReportSummary(repo: string, options: { sinceMs?: number } = {}): LatestReportSummary {
  const orchestratorDir = path.join(repo, ".agent-context", "orchestrator");
  if (!existsSync(orchestratorDir)) return {};
  const candidates = readdirSync(orchestratorDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = path.join(orchestratorDir, entry.name);
      return {
        markdown: path.join(dir, "orchestrator.md"),
        json: path.join(dir, "orchestrator.json")
      };
    })
    .filter((candidate) => existsSync(candidate.markdown))
    .map((candidate) => ({ ...candidate, mtimeMs: statSync(candidate.markdown).mtimeMs }))
    .filter((candidate) => !options.sinceMs || candidate.mtimeMs >= options.sinceMs - 1000)
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
  const latest = candidates[0];
  if (!latest) return {};
  return {
    reportPath: latest.markdown,
    ...readReportDecision(latest.json)
  };
}

function readReportDecision(filePath: string): Omit<LatestReportSummary, "reportPath"> {
  if (!existsSync(filePath)) return {};
  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as {
      decision?: { action?: unknown; blocking?: unknown };
      changedFiles?: unknown[];
    };
    return {
      decision: typeof parsed.decision?.action === "string" ? parsed.decision.action : undefined,
      blocking: typeof parsed.decision?.blocking === "boolean" ? parsed.decision.blocking : undefined,
      changedFiles: Array.isArray(parsed.changedFiles) ? parsed.changedFiles.length : undefined
    };
  } catch {
    return {};
  }
}

function formatCommand(command: string, args: string[]): string {
  return [command, ...args].map(quoteArg).join(" ");
}

function normalizeTaskForCli(task: string): string {
  return task.trim().replace(/\s+/gu, " ").replaceAll('"', "'");
}

function quoteArg(value: string): string {
  return /[\s"]/u.test(value) ? `"${value.replaceAll('"', '\\"').replaceAll("\n", "\\n")}"` : value;
}

function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

registerIpc();

app
  .whenReady()
  .then(createWindow)
  .catch((error: unknown) => {
    console.error(error);
    app.quit();
  });

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (!BrowserWindow.getAllWindows().length) {
    createWindow().catch((error: unknown) => console.error(error));
  }
});
