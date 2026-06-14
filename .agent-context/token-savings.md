# Token Savings Report

Original repo (estimated, chars_approx): 1,609,138 tokens
Estimated context pack (chars_approx): 18,274 tokens
Compression: 19x
Token budget: 90,000 (within budget)
Actual context pack (chars_approx): 85,608 tokens

## Selection
- Selected files: 80
- Total scanned files: 186
- Token budget: 90,000
- Original repo tokens are estimated from scanned source sizes.
- Estimated context pack tokens use compact file summaries, symbols, imports, module context, and graph hints.
- Actual context pack tokens are counted from generated Markdown, Mermaid, and RAG JSONL files after writing.

## Estimated Tokens
- Original repo: 1,609,138 tokens (chars_approx)
- Estimated context pack: 18,274 tokens (chars_approx)

## Actual Generated Output
Tokenizer: chars_approx
Actual output: 85,608 tokens
Scope: Generated Markdown, Mermaid, and RAG JSONL files; excludes machine-readable indexes and the token report itself.

- `.agent-context/AGENTS.generated.md`: 1,061 tokens
- `AGENTS.md`: 1,155 tokens
- `.agent-context/repo-summary.md`: 781 tokens
- `.agent-context/context-layers.md`: 677 tokens
- `.agent-context/key-files.md`: 2,667 tokens
- `.agent-context/module-map.md`: 738 tokens
- `.agent-context/architecture.md`: 409 tokens
- `.agent-context/dependency-graph.md`: 661 tokens
- `.agent-context/graphs/dependencies.mmd`: 402 tokens
- `.agent-context/onboarding.md`: 209 tokens
- `.agent-context/readiness.md`: 847 tokens
- `.agent-context/tasks/bugfix-context.md`: 2,290 tokens
- `.agent-context/tasks/feature-context.md`: 2,366 tokens
- `.agent-context/tasks/refactor-context.md`: 5,910 tokens
- `.agent-context/rag/README.md`: 165 tokens
- `.agent-context/rag/documents.jsonl`: 65,270 tokens
