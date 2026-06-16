# Token Savings Report

Original repo (estimated, chars_approx): 1,661,169 tokens
Estimated context pack (chars_approx): 20,095 tokens
Compression: 17x
Token budget: 100,000 (within budget)
Actual context pack (chars_approx): 97,144 tokens

## Selection
- Selected files: 80
- Total scanned files: 204
- Token budget: 100,000
- Original repo tokens are estimated from scanned source sizes.
- Estimated context pack tokens use compact file summaries, symbols, imports, module context, and graph hints.
- Actual context pack tokens are counted from generated Markdown, Mermaid, and RAG JSONL files after writing.

## Estimated Tokens
- Original repo: 1,661,169 tokens (chars_approx)
- Estimated context pack: 20,095 tokens (chars_approx)

## Actual Generated Output
Tokenizer: chars_approx
Actual output: 97,144 tokens
Scope: Generated Markdown, Mermaid, and RAG JSONL files; excludes machine-readable indexes and the token report itself.

- `.agent-context/AGENTS.generated.md`: 1,191 tokens
- `AGENTS.md`: 1,285 tokens
- `.agent-context/repo-summary.md`: 797 tokens
- `.agent-context/context-layers.md`: 677 tokens
- `.agent-context/key-files.md`: 2,680 tokens
- `.agent-context/module-map.md`: 821 tokens
- `.agent-context/architecture.md`: 425 tokens
- `.agent-context/dependency-graph.md`: 818 tokens
- `.agent-context/graphs/dependencies.mmd`: 501 tokens
- `.agent-context/onboarding.md`: 209 tokens
- `.agent-context/readiness.md`: 847 tokens
- `.agent-context/tasks/bugfix-context.md`: 5,416 tokens
- `.agent-context/tasks/feature-context.md`: 3,330 tokens
- `.agent-context/tasks/refactor-context.md`: 4,982 tokens
- `.agent-context/rag/README.md`: 165 tokens
- `.agent-context/rag/documents.jsonl`: 73,000 tokens
