import type { RepoContextConfig } from "../core/types.js";

export const DEFAULT_EXCLUDES = [
  ".git/**",
  ".agent-context/**",
  "node_modules/**",
  "dist/**",
  "build/**",
  "coverage/**",
  ".next/**",
  ".nuxt/**",
  ".svelte-kit/**",
  ".turbo/**",
  ".cache/**",
  ".venv/**",
  "venv/**",
  "__pycache__/**",
  "target/**",
  "vendor/**",
  "*.min.js",
  "*.map"
];

export const DEFAULT_CONFIG: RepoContextConfig = {
  target: "codex",
  tokenBudget: 60000,
  include: ["**/*"],
  exclude: DEFAULT_EXCLUDES,
  outputs: {
    agents: true,
    modules: true,
    graph: true
  }
};
