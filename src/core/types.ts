export type AgentTarget = "codex" | "claude" | "cursor" | "all";
export type AgentsMode = "minimal" | "balanced" | "full";
export type AgentsSection = "commands" | "safety" | "entrypoints" | "contextLinks";
export type AnalysisConfidence = "high" | "medium" | "low";
export type TaskType = "bugfix" | "feature" | "refactor" | "auto";

export interface RepoContextConfig {
  target: AgentTarget;
  tokenBudget: number;
  include: string[];
  exclude: string[];
  llm: LlmConfig;
  rag: RagConfig;
  tokenizer: TokenizerConfig;
  agents: AgentsConfig;
  outputs: {
    agents: boolean;
    modules: boolean;
    graph: boolean;
    tasks: boolean;
    readiness: boolean;
    rag: boolean;
  };
}

export interface AgentsConfig {
  mode: AgentsMode;
  maxTokens: number;
  include: AgentsSection[];
}

export interface LlmConfig {
  enabled: boolean;
  provider: "openai-compatible";
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface RagConfig {
  provider: "lightrag";
  chunkTokenLimit: number;
}

export interface TokenizerConfig {
  mode: "chars_approx";
}

export interface RepoScan {
  root: string;
  files: RepoFile[];
  languages: string[];
  frameworks: string[];
  packageManagers: string[];
  configFiles: string[];
  entrypoints: string[];
  testCommands: string[];
  runCommands: string[];
  lintCommands: string[];
  typecheckCommands: string[];
  ciFiles: string[];
  envExampleFiles: string[];
  migrationFiles: string[];
}

export interface RepoFile {
  path: string;
  absolutePath: string;
  extension: string;
  sizeBytes: number;
  kind: FileKind;
  language: string | null;
  tokenEstimate: number;
  isBinary: boolean;
  isGenerated: boolean;
  isTest: boolean;
}

export type FileKind =
  | "source"
  | "test"
  | "config"
  | "docs"
  | "lockfile"
  | "asset"
  | "generated"
  | "unknown";

export interface RepoIndex {
  files: IndexedFile[];
  symbols: SymbolInfo[];
  imports: ImportEdge[];
  modules: ModuleInfo[];
}

export interface IndexedFile extends RepoFile {
  imports: ImportRef[];
  exports: string[];
  symbols: SymbolInfo[];
  summary: string;
  analyzer: string;
  confidence: AnalysisConfidence;
  evidence: AnalysisEvidence[];
  moduleName: string;
  importanceScore: number;
  importanceReasons: string[];
}

export interface ImportRef {
  specifier: string;
  resolvedPath: string | null;
  isExternal: boolean;
}

export interface ImportEdge {
  from: string;
  to: string;
  specifier: string;
  isExternal: boolean;
}

export interface SymbolInfo {
  name: string;
  kind: "function" | "class" | "interface" | "type" | "const" | "export" | "route" | "enum" | "namespace" | "unknown";
  filePath: string;
  line: number;
}

export interface AnalysisEvidence {
  line: number;
  kind: "import" | "export" | "symbol" | "route" | "structure";
  symbol?: string;
  detail: string;
}

export interface ModuleInfo {
  name: string;
  pathPrefix: string;
  files: string[];
  imports: string[];
  summary: string;
  importanceScore: number;
}

export interface DependencyGraph {
  fileEdges: ImportEdge[];
  moduleEdges: Array<{
    from: string;
    to: string;
    count: number;
  }>;
}

export interface ContextPackage {
  config: RepoContextConfig;
  scan: RepoScan;
  index: RepoIndex;
  graph: DependencyGraph;
  keyFiles: IndexedFile[];
  target: AgentTarget;
  readiness: AgentReadinessReport;
  summaries: SummaryBundle;
  tokenSavings: TokenSavingsReport;
}

export interface SummaryBundle {
  mode: "offline" | "llm";
  llmAttempted: boolean;
  fallbackReason?: "disabled" | "missing_configuration" | "request_failed";
  repoSummary: string;
  moduleSummaries: Array<{
    moduleName: string;
    summary: string;
    evidence: string[];
  }>;
}

export interface AgentReadinessReport {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  missing: string[];
  strengths: string[];
  dimensions: ReadinessDimension[];
  categories: ReadinessCategory[];
  capsApplied: ReadinessCap[];
}

export interface ReadinessCategory {
  category: "structure" | "commands" | "tests" | "architecture" | "task-context" | "safety";
  score: number;
  evidence: string[];
  missing: string[];
}

export interface ReadinessDimension {
  category: "operational" | "context-quality" | "agent-safety";
  score: number;
  evidence: string[];
  missing: string[];
}

export interface ReadinessCap {
  cap: number;
  applied: boolean;
  reason: string;
  evidence: string[];
}

export interface TokenSavingsReport {
  tokenBudget: number;
  originalTokens: number;
  contextPackTokens: number;
  compressionRatio: number;
  withinBudget: boolean;
  selectedFiles: number;
  totalFiles: number;
  estimatedTokenSavings: number;
  actualOutputTokens?: ActualOutputTokenReport;
}

export interface ActualOutputTokenReport {
  mode: TokenizerConfig["mode"];
  totalTokens: number;
  scope: string;
  files: Array<{
    path: string;
    tokens: number;
  }>;
}

export interface TaskPack {
  task: string;
  type: Exclude<TaskType, "auto">;
  tokenBudget: number;
  estimatedTokens: number;
  files: Array<{
    path: string;
    score: number;
    reasons: string[];
  }>;
}
