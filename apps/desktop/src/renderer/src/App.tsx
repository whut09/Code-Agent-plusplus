import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

interface LogEntry {
  id: number;
  stream: "stdout" | "stderr" | "system";
  text: string;
}

function App() {
  const [repo, setRepo] = useState("");
  const [task, setTask] = useState("");
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("Select a repository and describe the coding task.");
  const [reportPath, setReportPath] = useState<string | undefined>();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [runStartedAt, setRunStartedAt] = useState<number | undefined>();
  const [now, setNow] = useState(Date.now());
  const nextLogId = useRef(1);
  const logEndRef = useRef<HTMLSpanElement | null>(null);
  const bridge = window.openCodePlusPlus;

  useEffect(() => {
    if (!bridge) return;
    const offOutput = bridge.onTaskOutput((event) => {
      appendLog(event.stream, event.text);
    });
    const offExit = bridge.onTaskExit((event) => {
      setRunning(false);
      setRunStartedAt(undefined);
      setReportPath(event.reportPath);
      if (event.error) {
        appendLog("stderr", `${event.error}\n`);
      }
      appendLog("system", `\nTask exited with ${event.code === null ? `signal ${event.signal ?? "unknown"}` : `code ${event.code}`}\n`);
      if (event.decision) {
        appendLog(
          "system",
          `Decision: ${event.decision}${event.blocking ? " (blocking)" : ""}${typeof event.changedFiles === "number" ? `, changed files: ${event.changedFiles}` : ""}\n`
        );
      }
      if (event.reportPath) {
        appendLog("system", `Report: ${event.reportPath}\n`);
      }
      if (event.error) {
        setStatus(`Task failed to start: ${event.error}`);
      } else if (event.decision) {
        setStatus(`${event.blocking ? "Blocked" : "Finished"}: decision=${event.decision}. ${event.reportPath ? "Report is ready." : "No report found."}`);
      } else {
        setStatus(event.reportPath ? "Task finished. A report is ready to open." : "Task finished. No report was found yet.");
      }
    });
    return () => {
      offOutput();
      offExit();
    };
  }, [bridge]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [logs]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const commandPreview = useMemo(() => {
    const normalizedTask = normalizeTaskForCli(task);
    if (!repo || !normalizedTask) return 'opencode-plusplus.cmd oc run --repo "<repo>" --max-loops 2 --stream-executor -- "<task>"';
    return `opencode-plusplus.cmd oc run --repo "${repo}" --max-loops 2 --stream-executor -- "${normalizedTask}"`;
  }, [repo, task]);

  if (!bridge) {
    return (
      <main className="shell">
        <section className="header">
          <div>
            <p className="eyebrow">OpenCode++ Desktop MVP</p>
            <h1>Desktop bridge failed to load</h1>
          </div>
          <div className="status">Error</div>
        </section>
        <section className="controls">
          <p className="error-text">The Electron preload bridge is unavailable. Rebuild the desktop app and restart it from `apps/desktop`.</p>
        </section>
      </main>
    );
  }

  function appendLog(stream: LogEntry["stream"], text: string): void {
    setLogs((current) => [...current, { id: nextLogId.current++, stream, text }]);
  }

  async function selectRepo(): Promise<void> {
    const selected = await bridge.selectRepo();
    if (!selected) return;
    setRepo(selected);
    setReportPath(await bridge.getLatestReport(selected));
    setStatus("Repository selected.");
  }

  async function runTask(): Promise<void> {
    setLogs([]);
    setReportPath(undefined);
    setRunning(true);
    setRunStartedAt(Date.now());
    setNow(Date.now());
    setStatus("Starting task...");
    appendLog("system", "Starting task...\n");
    try {
      const result = await bridge.runTask({ repo, task });
      if (result.error) {
        setRunning(false);
        setRunStartedAt(undefined);
        appendLog("stderr", `${result.error}\n`);
        setStatus(result.error);
        return;
      }
      setStatus(`Running task with PID ${result.pid ?? "unknown"}.`);
      appendLog("system", `$ ${result.command} ${(result.args ?? []).map(quoteArg).join(" ")}\n\n`);
    } catch (error) {
      setRunning(false);
      setRunStartedAt(undefined);
      const message = error instanceof Error ? error.message : String(error);
      appendLog("stderr", `${message}\n`);
      setStatus(`Task failed to start: ${message}`);
    }
  }

  async function stopTask(): Promise<void> {
    const result = await bridge.stopTask();
    if (result.stopped) {
      appendLog("system", "\nStop requested.\n");
      setStatus("Stop requested.");
    }
  }

  async function openReport(): Promise<void> {
    const result = await bridge.openLatestReport(repo);
    if (result.opened) {
      setReportPath(result.path);
      setStatus("Report opened.");
    } else {
      setStatus(result.error ?? "No report found.");
    }
  }

  return (
    <main className="shell">
      <section className="header">
        <div>
          <p className="eyebrow">OpenCode++ Desktop MVP</p>
          <h1>Harness-led tasks without embedding the OpenCode TUI</h1>
        </div>
        <div className={`status ${running ? "running" : ""}`}>{running ? `Running ${formatElapsed(now - (runStartedAt ?? now))}` : "Idle"}</div>
      </section>

      <section className="controls">
        <label className="field repo-field">
          <span>Repository</span>
          <div className="repo-row">
            <input value={repo} onChange={(event) => setRepo(event.target.value)} placeholder="Select or paste a repository path" />
            <button type="button" onClick={selectRepo} disabled={running}>
              Browse
            </button>
          </div>
        </label>

        <label className="field">
          <span>Task</span>
          <textarea
            value={task}
            onChange={(event) => setTask(event.target.value)}
            placeholder="Fix the login timeout bug and add the required regression test."
          />
        </label>

        <div className="actions">
          <button type="button" className="primary" onClick={runTask} disabled={running || !repo || !task.trim()}>
            Run Task
          </button>
          <button type="button" onClick={stopTask} disabled={!running}>
            Stop
          </button>
          <button type="button" onClick={openReport} disabled={!repo || running}>
            Open Report
          </button>
        </div>
      </section>

      <section className="summary">
        <div>
          <span>Status</span>
          <strong>{status}</strong>
        </div>
        <div>
          <span>Command</span>
          <code>{commandPreview}</code>
        </div>
        <div>
          <span>Latest report</span>
          <code>{reportPath ?? "Not generated yet"}</code>
        </div>
      </section>

      <section className="log-panel" aria-label="Task output">
        <div className="log-toolbar">
          <span>stdout / stderr</span>
          <button type="button" onClick={() => setLogs([])} disabled={running && logs.length === 0}>
            Clear
          </button>
        </div>
        <pre>
          {logs.map((entry) => (
            <span key={entry.id} className={entry.stream}>
              {entry.text}
            </span>
          ))}
          <span ref={logEndRef} />
        </pre>
      </section>
    </main>
  );
}

function quoteArg(value: string): string {
  return /\s/u.test(value) ? `"${value.replaceAll('"', '\\"').replaceAll("\n", "\\n")}"` : value;
}

function normalizeTaskForCli(task: string): string {
  return task.trim().replace(/\s+/gu, " ").replaceAll('"', "'");
}

function formatElapsed(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

createRoot(document.getElementById("root") as HTMLElement).render(<App />);
