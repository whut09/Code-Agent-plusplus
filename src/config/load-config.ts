import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { DEFAULT_CONFIG } from "./defaults.js";
import type { AgentTarget, RepoContextConfig } from "../core/types.js";

const CONFIG_FILES = [
  "repo-context.config.yml",
  "repo-context.config.yaml",
  "repo-context.config.json"
];

const LOCAL_CONFIG_FILES = [
  "repo-context.local.yml",
  "repo-context.local.yaml",
  "repo-context.local.json"
];

export function loadConfig(repoRoot: string, overrides: Partial<RepoContextConfig> = {}): RepoContextConfig {
  const configPath = CONFIG_FILES.map((file) => path.join(repoRoot, file)).find(existsSync);
  const localConfigPath = LOCAL_CONFIG_FILES.map((file) => path.join(repoRoot, file)).find(existsSync);
  const fileConfig = configPath ? readConfigFile(configPath) : {};
  const localConfig = localConfigPath ? readConfigFile(localConfigPath) : {};

  return {
    ...DEFAULT_CONFIG,
    ...fileConfig,
    ...localConfig,
    ...overrides,
    include: overrides.include ?? localConfig.include ?? fileConfig.include ?? DEFAULT_CONFIG.include,
    exclude: [
      ...DEFAULT_CONFIG.exclude,
      ...(fileConfig.exclude ?? []),
      ...(localConfig.exclude ?? []),
      ...(overrides.exclude ?? [])
    ],
    llm: {
      ...DEFAULT_CONFIG.llm,
      ...fileConfig.llm,
      ...localConfig.llm,
      ...overrides.llm
    },
    outputs: {
      ...DEFAULT_CONFIG.outputs,
      ...fileConfig.outputs,
      ...localConfig.outputs,
      ...overrides.outputs
    }
  };
}

function readConfigFile(configPath: string): Partial<RepoContextConfig> {
  const raw = readFileSync(configPath, "utf8");
  if (configPath.endsWith(".json")) {
    return normalizeConfig(JSON.parse(raw));
  }

  return normalizeConfig(yaml.load(raw) as Record<string, unknown>);
}

function normalizeConfig(input: Record<string, unknown> | null | undefined): Partial<RepoContextConfig> {
  if (!input) {
    return {};
  }

  const target = typeof input.target === "string" ? normalizeTarget(input.target) : undefined;
  return {
    target,
    tokenBudget: typeof input.tokenBudget === "number" ? input.tokenBudget : undefined,
    include: toStringArray(input.include),
    exclude: toStringArray(input.exclude),
    llm: typeof input.llm === "object" && input.llm ? input.llm as RepoContextConfig["llm"] : undefined,
    outputs: typeof input.outputs === "object" && input.outputs ? input.outputs as RepoContextConfig["outputs"] : undefined
  };
}

function normalizeTarget(value: string): AgentTarget {
  if (value === "claude" || value === "cursor" || value === "all") {
    return value;
  }

  return "codex";
}

function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.filter((item): item is string => typeof item === "string");
}
