import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";

type TaskOutputHandler = (event: { stream: "stdout" | "stderr" | "system"; text: string }) => void;
type TaskExitHandler = (event: {
  code: number | null;
  signal: string | null;
  reportPath?: string;
  error?: string;
  decision?: string;
  blocking?: boolean;
  changedFiles?: number;
}) => void;

contextBridge.exposeInMainWorld("openCodePlusPlus", {
  selectRepo: () => ipcRenderer.invoke("repo:select") as Promise<string | undefined>,
  runTask: (input: { repo: string; task: string }) =>
    ipcRenderer.invoke("task:run", input) as Promise<{ pid?: number | null; command?: string; args?: string[]; error?: string }>,
  stopTask: () => ipcRenderer.invoke("task:stop") as Promise<{ stopped: boolean }>,
  getLatestReport: (repo: string) => ipcRenderer.invoke("report:latest", repo) as Promise<string | undefined>,
  openLatestReport: (repo: string) => ipcRenderer.invoke("report:open", repo) as Promise<{ opened: boolean; path?: string; error?: string }>,
  onTaskOutput: (handler: TaskOutputHandler) => {
    const listener = (_event: IpcRendererEvent, payload: { stream: "stdout" | "stderr" | "system"; text: string }) => handler(payload);
    ipcRenderer.on("task:output", listener);
    return () => ipcRenderer.off("task:output", listener);
  },
  onTaskExit: (handler: TaskExitHandler) => {
    const listener = (
      _event: IpcRendererEvent,
      payload: {
        code: number | null;
        signal: string | null;
        reportPath?: string;
        error?: string;
        decision?: string;
        blocking?: boolean;
        changedFiles?: number;
      }
    ) => handler(payload);
    ipcRenderer.on("task:exit", listener);
    return () => ipcRenderer.off("task:exit", listener);
  }
});
