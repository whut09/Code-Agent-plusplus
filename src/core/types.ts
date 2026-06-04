export type AgentTarget = "codex" | "claude" | "cursor" | "all";

export interface RepoContextConfig {
  target: AgentTarget;
  tokenBudget: number;
  include: string[];
  exclude: string[];
  llm: LlmConfig;
  rag: RagConfig;
  outputs: {
    agents: boolean;
    modules: boolean;
    graph: boolean;
    tasks: boolean;
    readiness: boolean;
    rag: boolean;
  };
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
  kind: "function" | "class" | "interface" | "type" | "const" | "export" | "route" | "unknown";
  filePath: string;
  line: number;
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
  repoSummary: string;
  moduleSummaries: Array<{
    moduleName: string;
    summary: string;
    evidence: string[];
  }>;
}

export interface AgentReadinessReport {
  score: number;
  missing: string[];
  strengths: string[];
}

export interface TokenSavingsReport {
  tokenBudget: number;
  originalTokens: number;
  contextPackTokens: number;
  compressionRatio: number;
  withinBudget: boolean;
  selectedFiles: number;
  totalFiles: number;
}
