import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { bullet, code, heading, table } from "./markdown.js";

export type ExecutionFinalState = "planned" | "in_progress" | "partial_success" | "success" | "failed" | "blocked";
export type ExecutionStepResult = "passed" | "failed" | "skipped" | "unknown";

export interface ExecutionTraceStep {
  id: string;
  at: string;
  agent?: string;
  action: string;
  files: string[];
  reason?: string;
  command?: string;
  test?: string;
  result?: ExecutionStepResult;
  output?: string;
}

export interface ExecutionTrace {
  schemaVersion: 1;
  id: string;
  task: string;
  agent?: string;
  createdAt: string;
  updatedAt: string;
  finalState: ExecutionFinalState;
  steps: ExecutionTraceStep[];
}

export interface TraceStartOptions {
  id?: string;
  agent?: string;
}

export interface TraceStepInput {
  agent?: string;
  action: string;
  files?: string[];
  reason?: string;
  command?: string;
  test?: string;
  result?: ExecutionStepResult;
  output?: string;
  finalState?: ExecutionFinalState;
}

export function startExecutionTrace(root: string, task: string, options: TraceStartOptions = {}): ExecutionTrace {
  const now = new Date().toISOString();
  const trace: ExecutionTrace = {
    schemaVersion: 1,
    id: options.id ?? traceIdForTask(task),
    task,
    agent: options.agent,
    createdAt: now,
    updatedAt: now,
    finalState: "planned",
    steps: [
      {
        id: "step-001",
        at: now,
        agent: options.agent ?? "repo-context",
        action: "context-run-created",
        files: [],
        reason: "Task execution context was created before agent editing."
      }
    ]
  };
  writeExecutionTrace(root, trace);
  return trace;
}

export function appendExecutionTraceStep(root: string, traceId: string, input: TraceStepInput): ExecutionTrace {
  const trace = readExecutionTrace(root, traceId);
  if (!trace) {
    throw new Error(`Execution trace not found: ${traceId}`);
  }

  const now = new Date().toISOString();
  trace.steps.push({
    id: `step-${String(trace.steps.length + 1).padStart(3, "0")}`,
    at: now,
    agent: input.agent ?? trace.agent,
    action: input.action,
    files: input.files ?? [],
    reason: input.reason,
    command: input.command,
    test: input.test,
    result: input.result,
    output: input.output
  });
  trace.updatedAt = now;
  if (input.finalState) trace.finalState = input.finalState;
  else if (trace.finalState === "planned") trace.finalState = "in_progress";
  writeExecutionTrace(root, trace);
  return trace;
}

export function readExecutionTrace(root: string, traceId: string): ExecutionTrace | null {
  const filePath = executionTracePath(root, traceId);
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as ExecutionTrace;
  } catch {
    return null;
  }
}

export function writeExecutionTrace(root: string, trace: ExecutionTrace): string {
  const filePath = executionTracePath(root, trace.id);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(trace, null, 2)}\n`, "utf8");
  return filePath;
}

export function executionTracePath(root: string, traceId: string): string {
  return path.join(root, ".agent-context", "traces", `${traceId}.json`);
}

export function renderExecutionTrace(trace: ExecutionTrace): string {
  return [
    heading(1, "Execution Trace"),
    "",
    `Trace: ${trace.id}`,
    `Task: ${trace.task}`,
    `Agent: ${trace.agent ?? "unknown"}`,
    `Final state: ${trace.finalState}`,
    `Created: ${trace.createdAt}`,
    `Updated: ${trace.updatedAt}`,
    "",
    heading(2, "Steps"),
    table(
      ["Step", "Agent", "Action", "Files", "Result", "Reason"],
      trace.steps.map((step) => [
        step.id,
        step.agent ?? "unknown",
        step.action,
        step.files.map(code).join(", ") || "none",
        step.result ?? "unknown",
        (step.reason ?? step.command ?? step.test ?? "").replace(/\|/g, "\\|")
      ])
    ),
    "",
    heading(2, "Commands"),
    bullet(trace.steps.filter((step) => step.command).map((step) => `${step.id}: ${code(step.command ?? "")}`))
  ].join("\n");
}

export function traceIdForTask(task: string): string {
  const normalized = task
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
  return normalized || `trace-${hashTask(task)}`;
}

function hashTask(task: string): string {
  let hash = 0;
  for (const char of task) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  return Math.abs(hash).toString(36);
}
