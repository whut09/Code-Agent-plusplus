import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
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

let mainWindow: BrowserWindow | undefined;
let currentTask: ChildProcess | undefined;
let currentRepo: string | undefined;

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

function commandName(): string {
  return process.platform === "win32" ? "opencode-plusplus.cmd" : "opencode-plusplus";
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

    const command = commandName();
    const args = ["oc", "run", "--repo", repo, "--max-loops", "2", "--", task];
    currentRepo = repo;
    currentTask = spawn(command, args, {
      cwd: repo,
      env: process.env,
      shell: process.platform === "win32",
      windowsHide: true
    });

    mainWindow?.webContents.send("task:output", { stream: "system", text: `Starting: ${formatCommand(command, args)}\n` });

    currentTask.stdout?.on("data", (chunk: Buffer) => {
      mainWindow?.webContents.send("task:output", { stream: "stdout", text: chunk.toString("utf8") });
    });

    currentTask.stderr?.on("data", (chunk: Buffer) => {
      mainWindow?.webContents.send("task:output", { stream: "stderr", text: chunk.toString("utf8") });
    });

    let finished = false;
    currentTask.once("error", (error) => {
      finished = true;
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
      const reportPath = currentRepo ? findLatestReport(currentRepo) : undefined;
      currentTask = undefined;
      mainWindow?.webContents.send("task:exit", {
        code,
        signal,
        reportPath
      });
    });

    return { pid: currentTask.pid ?? null, command, args };
  });

  ipcMain.handle("task:stop", async () => {
    if (!currentTask) return { stopped: false };
    const pid = currentTask.pid;
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

function findLatestReport(repo: string): string | undefined {
  const orchestratorDir = path.join(repo, ".agent-context", "orchestrator");
  if (!existsSync(orchestratorDir)) return undefined;
  const candidates = readdirSync(orchestratorDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(orchestratorDir, entry.name, "orchestrator.md"))
    .filter((file) => existsSync(file))
    .map((file) => ({ file, mtimeMs: statSync(file).mtimeMs }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
  return candidates[0]?.file;
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
