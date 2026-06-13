# Token Savings Report

Original repo (estimated, chars_approx): 1,547,649 tokens
Estimated context pack (chars_approx): 16,997 tokens
Compression: 20x
Token budget: 80,000 (within budget)
Actual context pack (chars_approx): 77,119 tokens

## Selection
- Selected files: 80
- Total scanned files: 170
- Token budget: 80,000
- Original repo tokens are estimated from scanned source sizes.
- Estimated context pack tokens use compact file summaries, symbols, imports, module context, and graph hints.
- Actual context pack tokens are counted from generated Markdown, Mermaid, and RAG JSONL files after writing.

## Estimated Tokens
- Original repo: 1,547,649 tokens (chars_approx)
- Estimated context pack: 16,997 tokens (chars_approx)

## Actual Generated Output
Tokenizer: chars_approx
Actual output: 77,119 tokens
Scope: Generated Markdown, Mermaid, and RAG JSONL files; excludes machine-readable indexes and the token report itself.

- `.agent-context/AGENTS.generated.md`: 722 tokens
- `AGENTS.md`: 817 tokens
- `.agent-context/repo-summary.md`: 776 tokens
- `.agent-context/context-layers.md`: 677 tokens
- `.agent-context/key-files.md`: 2,642 tokens
- `.agent-context/module-map.md`: 737 tokens
- `.agent-context/architecture.md`: 409 tokens
- `.agent-context/dependency-graph.md`: 661 tokens
- `.agent-context/graphs/dependencies.mmd`: 402 tokens
- `.agent-context/onboarding.md`: 207 tokens
- `.agent-context/readiness.md`: 847 tokens
- `.agent-context/tasks/bugfix-context.md`: 2,160 tokens
- `.agent-context/tasks/feature-context.md`: 1,635 tokens
- `.agent-context/tasks/refactor-context.md`: 5,081 tokens
- `.agent-context/rag/README.md`: 167 tokens
- `.agent-context/rag/documents.jsonl`: 59,179 tokens
