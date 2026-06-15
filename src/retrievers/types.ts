export type RetrieverProvider = "static" | "ripgrep" | "hybrid" | "lightrag" | "embedding" | "codegraph";

export interface ContextRetrieverOptions {
  topK: number;
  modules?: string[];
  changedFiles?: string[];
  includeTests?: boolean;
}

export interface ContextHit {
  id: string;
  path: string;
  title: string;
  moduleName: string;
  kind: string;
  score: number;
  source: RetrieverProvider;
  snippet: string;
  metadata: Record<string, unknown>;
}

export interface ContextRetriever {
  readonly name: RetrieverProvider;
  search(task: string, options: ContextRetrieverOptions): Promise<ContextHit[]>;
}
