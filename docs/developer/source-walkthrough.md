# Source Walkthrough

For the detailed code-path explanation, read [Loop Engineering](../concepts/loop-engineering.md).

High-level flow:

```txt
CLI
  -> buildContextPackage()
  -> scanRepository()
  -> indexRepository()
  -> buildDependencyGraph()
  -> rankFiles()
  -> assessReadiness()
  -> writeContextPackage()
```

Harness-led flow:

```txt
orchestrate()
  -> task run
  -> executor adapter
  -> trace normalizer
  -> guard reports
  -> guard gates
  -> decision report
```

Key source areas:

- `src/core/`: scan, index, graph, rank, token, freshness.
- `src/harness/`: control plane, verification plane, observability.
- `src/outputs/`: artifact rendering and compatibility wrappers.
- `src/mcp/`: stdio MCP server.
- `src/retrievers/`: static, ripgrep, hybrid, CodeGraph, external provider protocols.
