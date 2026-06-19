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
  provider: lightrag
  chunkTokenLimit: 900
```

## LLM Credentials

Committed examples should keep `baseUrl`, `apiKey`, and `model` as `xx`. Real credentials belong only in `opencode-plusplus.local.yml`.
