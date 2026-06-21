# Configuration

Default config file:

```txt
opencode-plusplus.config.yml
```

Local private config file:

```txt
opencode-plusplus.local.yml
```

Do not commit `opencode-plusplus.local.yml`.

## Example

```yaml
target: opencode
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
  # mode: cl100k_base
  # model: gpt-4.1

agents:
  mode: minimal
  maxTokens: 1200
  manualSources:
    - AGENTS.manual.md
  include:
    - commands
    - safety
    - entrypoints
    - contextLinks

llm:
  enabled: false
  provider: openai-compatible
  baseUrl: xx
  apiKey: xx
  model: xx
  temperature: 0.2
  maxTokens: 1200

rag:
  provider: lightrag
  chunkTokenLimit: 900

outputs:
  agents: true
  modules: true
  graph: true
  tasks: true
  readiness: true
  rag: true
```

Config files use `tokenizer.mode: chars_approx`; the CLI option `--tokenizer chars-approx` is accepted and normalized for command-line convenience.

## LLM Credentials

Committed examples should keep `baseUrl`, `apiKey`, and `model` as `xx`. Real credentials belong only in `opencode-plusplus.local.yml`.
