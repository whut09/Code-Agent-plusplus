# Configuration

Default config file:

```txt
code-agent-plusplus.config.yml
```

Local private config file:

```txt
code-agent-plusplus.local.yml
```

Do not commit `code-agent-plusplus.local.yml`.

## Example

```yaml
target: codex
tokenBudget: 100000

include:
  - "**/*"

exclude:
  - node_modules/**
  - dist/**
  - build/**
  - coverage/**
  - .next/**
  - .venv/**

agents:
  mode: minimal
  maxTokens: 1200

llm:
  enabled: false
  baseUrl: "xx"
  apiKey: "xx"
  model: "xx"

rag:
  enabled: true
  chunkTokenLimit: 1200
```

## LLM Credentials

Committed examples should keep `baseUrl`, `apiKey`, and `model` as `xx`. Real credentials belong only in `code-agent-plusplus.local.yml`.
