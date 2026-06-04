import type { ContextPackage, IndexedFile, TaskPack, TaskType } from "../core/types.js";
import { estimateTokens } from "../core/token-estimator.js";
import { bullet, code, heading, table } from "./markdown.js";

export interface TaskContextOptions {
  type?: TaskType;
  tokenBudget?: number;
}

export function renderTaskContext(context: ContextPackage, task: string, options: TaskContextOptions = {}): string {
  const pack = buildTaskPack(context, task, options);
  const fileMap = new Map(context.index.files.map((file) => [file.path, file]));
  return [
    heading(1, "Task Context"),
    "",
    `Task: ${task}`,
    `Type: ${pack.type}`,
    `Budget: ${pack.estimatedTokens.toLocaleString()} / ${pack.tokenBudget.toLocaleString()} estimated tokens`,
    "",
    heading(2, "Relevant Files"),
    table(
      ["File", "Score", "Why", "Summary"],
      pack.files.map((item) => [
        code(item.path),
        String(item.score),
        item.reasons.join(", "),
        (fileMap.get(item.path)?.summary ?? "").replace(/\|/g, "\\|")
      ])
    ),
    "",
    heading(2, "Suggested Agent Workflow"),
    bullet(workflowFor(pack.type))
  ].join("\n");
}

export function buildTaskPack(context: ContextPackage, task: string, options: TaskContextOptions = {}): TaskPack {
  const type = resolveTaskType(task, options.type ?? "auto");
  const tokenBudget = options.tokenBudget ?? Math.min(context.config.tokenBudget, 12000);
  const scores = new Map<string, { score: number; reasons: string[] }>();
  const terms = task.toLowerCase().match(/[\p{L}\p{N}_/-]+/gu)?.filter((term) => term.length >= 2) ?? [];
  const fileTerms = new Map<string, string[]>();
  const frequencies = new Map<string, number>();

  for (const file of context.index.files) {
    const haystack = [file.path, file.moduleName, file.summary, ...file.exports, ...file.symbols.map((symbol) => symbol.name)].join(" ").toLowerCase();
    const tokens = haystack.match(/[\p{L}\p{N}_/-]+/gu) ?? [];
    fileTerms.set(file.path, tokens);
    const tokenSet = new Set(tokens);
    for (const term of terms) {
      if (tokenSet.has(term) || (term.length >= 4 && tokens.some((candidate) => candidate.includes(term)))) {
        frequencies.set(term, (frequencies.get(term) ?? 0) + 1);
      }
    }
  }

  for (const file of context.index.files) {
    const haystackTerms = fileTerms.get(file.path) ?? [];
    const termSet = new Set(haystackTerms);
    const matches = terms.filter((term) => termSet.has(term) || (term.length >= 4 && haystackTerms.some((candidate) => candidate.includes(term))));
    const lexicalScore = matches.reduce((sum, term) => {
      const frequency = frequencies.get(term) ?? context.index.files.length;
      return sum + Math.max(5, Math.round(40 * Math.log((context.index.files.length + 1) / (frequency + 1))));
    }, 0);
    if (matches.length) addScore(scores, file.path, lexicalScore, [`lexical match: ${matches.slice(0, 4).join(", ")}`]);
  }

  const direct = [...scores.entries()].sort((a, b) => b[1].score - a[1].score).slice(0, 8).map(([path]) => path);
  expandGraph(context, direct, scores);
  addTaskSignals(context, direct, type, scores);

  if (!scores.size) {
    for (const file of context.keyFiles.slice(0, 10)) addScore(scores, file.path, file.importanceScore, ["key file fallback"]);
  }

  const ranked = [...scores.entries()]
    .map(([path, item]) => ({ path, ...item, file: context.index.files.find((file) => file.path === path) }))
    .filter((item): item is typeof item & { file: IndexedFile } => Boolean(item.file))
    .sort((a, b) => b.score - a.score || b.file.importanceScore - a.file.importanceScore);

  const selected: TaskPack["files"] = [];
  let estimatedTokens = 0;
  for (const item of ranked) {
    const tokens = taskFileTokens(item.file);
    if (selected.length && estimatedTokens + tokens > tokenBudget) continue;
    selected.push({ path: item.path, score: item.score, reasons: item.reasons });
    estimatedTokens += tokens;
  }

  return { task, type, tokenBudget, estimatedTokens, files: selected };
}

function expandGraph(context: ContextPackage, direct: string[], scores: Map<string, { score: number; reasons: string[] }>): void {
  const directSet = new Set(direct);
  for (const edge of context.graph.fileEdges) {
    if (edge.isExternal) continue;
    if (directSet.has(edge.from)) addScore(scores, edge.to, 24, [`dependency of ${edge.from}`]);
    if (directSet.has(edge.to)) addScore(scores, edge.from, 28, [`caller/importer of ${edge.to}`]);
  }
}

function addTaskSignals(
  context: ContextPackage,
  direct: string[],
  type: Exclude<TaskType, "auto">,
  scores: Map<string, { score: number; reasons: string[] }>
): void {
  const directFiles = context.index.files.filter((file) => direct.includes(file.path));
  for (const file of context.index.files) {
    if (file.isTest && isRelatedTest(file, directFiles)) addScore(scores, file.path, type === "bugfix" ? 35 : 20, ["related test"]);
    if (context.scan.entrypoints.includes(file.path)) addScore(scores, file.path, type === "feature" ? 22 : 12, ["entrypoint"]);
    if (file.kind === "config") addScore(scores, file.path, type === "feature" ? 16 : 8, ["configuration"]);
    if (type === "refactor" && (file.imports.length > 3 || file.exports.length > 3)) addScore(scores, file.path, 18, ["shared API/refactor risk"]);
  }
}

function isRelatedTest(testFile: IndexedFile, directFiles: IndexedFile[]): boolean {
  const testPath = testFile.path.toLowerCase();
  return directFiles.some((file) => {
    const baseName = file.path.split("/").pop()?.replace(/\.[^.]+$/, "").toLowerCase() ?? "";
    return (baseName.length >= 3 && testPath.includes(baseName))
      || (file.moduleName !== "root" && file.moduleName !== "test" && testPath.includes(file.moduleName.toLowerCase()));
  });
}

function addScore(map: Map<string, { score: number; reasons: string[] }>, path: string, score: number, reasons: string[]): void {
  const current = map.get(path) ?? { score: 0, reasons: [] };
  current.score += score;
  current.reasons.push(...reasons.filter((reason) => !current.reasons.includes(reason)));
  map.set(path, current);
}

function resolveTaskType(task: string, requested: TaskType): Exclude<TaskType, "auto"> {
  if (requested !== "auto") return requested;
  if (/fix|bug|error|fail|timeout|regression|修复|错误|故障|超时/i.test(task)) return "bugfix";
  if (/refactor|split|rename|cleanup|重构|拆分|整理/i.test(task)) return "refactor";
  return "feature";
}

function taskFileTokens(file: IndexedFile): number {
  return estimateTokens([file.path, file.summary, file.importanceReasons.join(", "), file.exports.join(", "), file.symbols.map((symbol) => symbol.name).join(", ")].join("\n"));
}

function workflowFor(type: Exclude<TaskType, "auto">): string[] {
  const common = [
    "Read `AGENTS.md` and inspect evidence before editing.",
    "Open the selected files and dependency neighbors.",
    "Run detected test/check commands after edits."
  ];
  if (type === "bugfix") return ["Reproduce the failure and inspect related tests first.", ...common];
  if (type === "refactor") return ["Preserve exported APIs and inspect callers before moving code.", ...common];
  return ["Confirm the intended behavior and entrypoint integration before implementation.", ...common];
}
