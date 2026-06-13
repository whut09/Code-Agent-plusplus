# Token Savings Report

Original repo (estimated, chars_approx): 1,551,416 tokens
Estimated context pack (chars_approx): 16,879 tokens
Compression: 20x
Token budget: 80,000 (within budget)
Actual context pack (chars_approx): 76,024 tokens

## Selection
- Selected files: 80
- Total scanned files: 168
- Token budget: 80,000
- Original repo tokens are estimated from scanned source sizes.
- Estimated context pack tokens use compact file summaries, symbols, imports, module context, and graph hints.
- Actual context pack tokens are counted from generated Markdown, Mermaid, and RAG JSONL files after writing.

## Estimated Tokens
- Original repo: 1,551,416 tokens (chars_approx)
- Estimated context pack: 16,879 tokens (chars_approx)

## Actual Generated Output
Tokenizer: chars_approx
Actual output: 76,024 tokens
Scope: Generated Markdown, Mermaid, and RAG JSONL files; excludes machine-readable indexes and the token report itself.

- `.agent-context/AGENTS.generated.md`: 721 tokens
- `AGENTS.md`: 816 tokens
- `.agent-context/repo-summary.md`: 767 tokens
- `.agent-context/context-layers.md`: 677 tokens
- `.agent-context/key-files.md`: 2,642 tokens
- `.agent-context/module-map.md`: 737 tokens
- `.agent-context/architecture.md`: 409 tokens
- `.agent-context/dependency-graph.md`: 660 tokens
- `.agent-context/graphs/dependencies.mmd`: 402 tokens
- `.agent-context/onboarding.md`: 207 tokens
- `.agent-context/readiness.md`: 847 tokens
- `.agent-context/tasks/bugfix-context.md`: 2,096 tokens
- `.agent-context/tasks/feature-context.md`: 1,629 tokens
- `.agent-context/tasks/refactor-context.md`: 4,967 tokens
- `.agent-context/rag/README.md`: 167 tokens
- `.agent-context/rag/documents.jsonl`: 58,280 tokens
