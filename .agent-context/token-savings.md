# Token Savings Report

Original repo (estimated, chars_approx): 1,516,021 tokens
Estimated context pack (chars_approx): 14,674 tokens
Compression: 22x
Token budget: 80,000 (within budget)
Actual context pack (chars_approx): 68,427 tokens

## Selection
- Selected files: 80
- Total scanned files: 158
- Token budget: 80,000
- Original repo tokens are estimated from scanned source sizes.
- Estimated context pack tokens use compact file summaries, symbols, imports, module context, and graph hints.
- Actual context pack tokens are counted from generated Markdown, Mermaid, and RAG JSONL files after writing.

## Estimated Tokens
- Original repo: 1,516,021 tokens (chars_approx)
- Estimated context pack: 14,674 tokens (chars_approx)

## Actual Generated Output
Tokenizer: chars_approx
Actual output: 68,427 tokens
Scope: Generated Markdown, Mermaid, and RAG JSONL files; excludes machine-readable indexes and the token report itself.

- `.agent-context/AGENTS.generated.md`: 714 tokens
- `AGENTS.md`: 809 tokens
- `.agent-context/repo-summary.md`: 747 tokens
- `.agent-context/context-layers.md`: 677 tokens
- `.agent-context/key-files.md`: 2,655 tokens
- `.agent-context/module-map.md`: 326 tokens
- `.agent-context/architecture.md`: 350 tokens
- `.agent-context/dependency-graph.md`: 388 tokens
- `.agent-context/graphs/dependencies.mmd`: 226 tokens
- `.agent-context/onboarding.md`: 207 tokens
- `.agent-context/readiness.md`: 823 tokens
- `.agent-context/tasks/bugfix-context.md`: 1,874 tokens
- `.agent-context/tasks/feature-context.md`: 1,631 tokens
- `.agent-context/tasks/refactor-context.md`: 4,550 tokens
- `.agent-context/rag/README.md`: 167 tokens
- `.agent-context/rag/documents.jsonl`: 52,283 tokens
