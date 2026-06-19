# Token Savings Report

Original repo (estimated, chars_approx): 1,680,719 tokens
Estimated context pack (chars_approx): 20,946 tokens
Compression: 17x
Token budget: 100,000 (within budget)
Actual context pack (chars_approx): 99,019 tokens

## Selection
- Selected files: 80
- Total scanned files: 246
- Token budget: 100,000
- Original repo tokens are estimated from scanned source sizes.
- Estimated context pack tokens use compact file summaries, symbols, imports, module context, and graph hints.
- Actual context pack tokens are counted from generated Markdown, Mermaid, and RAG JSONL files after writing.

## Estimated Tokens
- Original repo: 1,680,719 tokens (chars_approx)
- Estimated context pack: 20,946 tokens (chars_approx)

## Actual Generated Output
Tokenizer: chars_approx
Actual output: 99,019 tokens
Scope: Generated Markdown, Mermaid, and RAG JSONL files; excludes machine-readable indexes and the token report itself.

- `.agent-context/AGENTS.generated.md`: 1,200 tokens
- `AGENTS.md`: 1,295 tokens
- `.agent-context/repo-summary.md`: 864 tokens
- `.agent-context/context-layers.md`: 677 tokens
- `.agent-context/key-files.md`: 2,757 tokens
- `.agent-context/module-map.md`: 872 tokens
- `.agent-context/architecture.md`: 422 tokens
- `.agent-context/dependency-graph.md`: 933 tokens
- `.agent-context/graphs/dependencies.mmd`: 573 tokens
- `.agent-context/onboarding.md`: 209 tokens
- `.agent-context/readiness.md`: 847 tokens
- `.agent-context/tasks/bugfix-context.md`: 4,386 tokens
- `.agent-context/tasks/feature-context.md`: 3,446 tokens
- `.agent-context/tasks/refactor-context.md`: 4,561 tokens
- `.agent-context/rag/README.md`: 165 tokens
- `.agent-context/rag/documents.jsonl`: 75,812 tokens
