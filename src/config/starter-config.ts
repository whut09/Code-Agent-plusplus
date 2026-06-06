export function starterConfig(): string {
  return `target: codex
tokenBudget: 60000

include:
  - "**/*"

exclude:
  - node_modules/**
  - dist/**
  - build/**
  - coverage/**
  - .next/**
  - .venv/**

tokenizer:
  mode: chars_approx

agents:
  mode: minimal
  maxTokens: 1200
  include:
    - commands
    - safety
    - entrypoints
    - contextLinks

outputs:
  agents: true
  modules: true
  graph: true
  tasks: true
  readiness: true
  rag: true
`;
}
