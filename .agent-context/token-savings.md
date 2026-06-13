# Token Savings Report

Original repo (estimated, chars_approx): 1,573,800 tokens
Estimated context pack (chars_approx): 17,599 tokens
Compression: 19x
Token budget: 90,000 (within budget)
Actual context pack (chars_approx): 81,709 tokens

## Selection
- Selected files: 80
- Total scanned files: 178
- Token budget: 90,000
- Original repo tokens are estimated from scanned source sizes.
- Estimated context pack tokens use compact file summaries, symbols, imports, module context, and graph hints.
- Actual context pack tokens are counted from generated Markdown, Mermaid, and RAG JSONL files after writing.

## Estimated Tokens
- Original repo: 1,573,800 tokens (chars_approx)
- Estimated context pack: 17,599 tokens (chars_approx)

## Actual Generated Output
Tokenizer: chars_approx
Actual output: 81,709 tokens
Scope: Generated Markdown, Mermaid, and RAG JSONL files; excludes machine-readable indexes and the token report itself.

- `.agent-context/AGENTS.generated.md`: 937 tokens
- `AGENTS.md`: 1,032 tokens
- `.agent-context/repo-summary.md`: 777 tokens
- `.agent-context/context-layers.md`: 677 tokens
- `.agent-context/key-files.md`: 2,660 tokens
- `.agent-context/module-map.md`: 738 tokens
- `.agent-context/architecture.md`: 409 tokens
- `.agent-context/dependency-graph.md`: 661 tokens
- `.agent-context/graphs/dependencies.mmd`: 402 tokens
- `.agent-context/onboarding.md`: 207 tokens
- `.agent-context/readiness.md`: 847 tokens
- `.agent-context/tasks/bugfix-context.md`: 2,222 tokens
- `.agent-context/tasks/feature-context.md`: 2,359 tokens
- `.agent-context/tasks/refactor-context.md`: 5,594 tokens
- `.agent-context/rag/README.md`: 167 tokens
- `.agent-context/rag/documents.jsonl`: 62,020 tokens
