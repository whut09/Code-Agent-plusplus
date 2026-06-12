import { loadConfig } from "../config/load-config.js";
import type { AgentTarget, ContextPackage, RepoContextConfig } from "./types.js";
import { scanRepository } from "./scanner.js";
import { indexRepository } from "./indexer.js";
import { ContextCache } from "./cache.js";
import { buildDependencyGraph } from "./graph.js";
import { rankFiles } from "./ranker.js";
import { assessReadiness } from "./readiness.js";
import { summarizeRepository } from "./summarizer.js";
import { calculateTokenSavings } from "./token-savings.js";
import { tokenizerFromModel } from "./token-estimator.js";

export interface BuildOptions {
  target?: AgentTarget;
  tokenBudget?: number;
  llm?: boolean;
  tokenizer?: RepoContextConfig["tokenizer"]["mode"];
  model?: string;
  cache?: boolean;
}

export async function buildContextPackage(repoRoot: string, options: BuildOptions = {}): Promise<ContextPackage> {
  const overrides: Partial<RepoContextConfig> = {};
  if (options.target) overrides.target = options.target;
  if (options.tokenBudget) overrides.tokenBudget = options.tokenBudget;
  if (options.model) {
    overrides.tokenizer = tokenizerFromModel(options.model);
  }
  if (options.tokenizer) {
    overrides.tokenizer = {
      ...(overrides.tokenizer ?? loadConfig(repoRoot).tokenizer),
      mode: options.tokenizer
    };
  }
  if (typeof options.llm === "boolean") {
    overrides.llm = { ...loadConfig(repoRoot).llm, enabled: options.llm };
  }

  const config = loadConfig(repoRoot, overrides);
  const cache = ContextCache.open(repoRoot, config, { enabled: options.cache });
  const scan = await scanRepository(repoRoot, config);
  const dependencyFingerprint = cache?.dependencyFingerprint(scan) ?? "";
  const index = indexRepository(scan, { cache, dependencyFingerprint });
  cache?.prune(scan);
  const indexFingerprint = cache?.indexFingerprint(index.files);
  const cachedGraph = indexFingerprint ? cache?.getGraph(indexFingerprint) : null;
  const graph = cachedGraph ?? buildDependencyGraph(index);
  if (cache && indexFingerprint && !cachedGraph) cache.setGraph(indexFingerprint, graph);
  const keyFiles = rankFiles(scan, index, graph);
  const readiness = assessReadiness(scan, index, graph, {
    tokenizerMode: config.tokenizer.mode,
    generatedOutputValidation: true
  });
  const summaries = await summarizeRepository(scan, index, config);
  const tokenSavings = calculateTokenSavings(scan, keyFiles, { tokenBudget: config.tokenBudget, tokenizer: config.tokenizer, tokenCache: cache });
  cache?.flush();

  return {
    config,
    scan,
    index,
    graph,
    keyFiles,
    target: config.target,
    readiness,
    summaries,
    tokenSavings
  };
}
