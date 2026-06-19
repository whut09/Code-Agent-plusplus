# Token Savings Report

Original repo (estimated, chars_approx): 1,704,030 tokens
Estimated context pack (chars_approx): 21,299 tokens
Compression: 17x
Token budget: 120,000 (within budget)
Actual context pack (chars_approx): 101,889 tokens

## Selection
- Selected files: 80
- Total scanned files: 257
- Token budget: 120,000
- Original repo tokens are estimated from scanned source sizes.
- Estimated context pack tokens use compact file summaries, symbols, imports, module context, and graph hints.
- Actual context pack tokens are counted from generated Markdown, Mermaid, and RAG JSONL files after writing.

## Estimated Tokens
- Original repo: 1,704,030 tokens (chars_approx)
- Estimated context pack: 21,299 tokens (chars_approx)

## Actual Generated Output
Tokenizer: chars_approx
Actual output: 101,889 tokens
Scope: Generated Markdown, Mermaid, and RAG JSONL files; excludes machine-readable indexes and the token report itself.

- `.agent-context/AGENTS.generated.md`: 1,198 tokens
- `AGENTS.md`: 1,293 tokens
- `.agent-context/repo-summary.md`: 862 tokens
- `.agent-context/context-layers.md`: 677 tokens
- `.agent-context/key-files.md`: 2,791 tokens
- `.agent-context/module-map.md`: 877 tokens
- `.agent-context/architecture.md`: 411 tokens
- `.agent-context/dependency-graph.md`: 955 tokens
- `.agent-context/graphs/dependencies.mmd`: 586 tokens
- `.agent-context/onboarding.md`: 209 tokens
- `.agent-context/readiness.md`: 847 tokens
- `.agent-context/tasks/bugfix-context.md`: 4,386 tokens
- `.agent-context/tasks/feature-context.md`: 3,445 tokens
- `.agent-context/tasks/refactor-context.md`: 5,013 tokens
- `.agent-context/rag/README.md`: 165 tokens
- `.agent-context/rag/documents.jsonl`: 78,174 tokens
