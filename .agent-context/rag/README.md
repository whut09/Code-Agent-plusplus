# LightRAG Export

This directory contains a LightRAG-friendly export of the repository context.

Repo-to-Agent-Context does not require LightRAG at runtime. The recommended architecture is adapter-based:

1. Generate `.agent-context/rag/documents.jsonl`.
2. Import those documents into a local or remote LightRAG service.
3. Keep the same embedding model for indexing and querying.

## Files

- `documents.jsonl`: one JSON document per line.
- `manifest.json`: export metadata.
- `README.md`: this guide.

## Config

Provider: codex

Private LightRAG server URLs and keys belong in `repo-context.local.yml`, not committed config files.
