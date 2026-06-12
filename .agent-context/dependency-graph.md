# Dependency Graph

## Module Graph
```mermaid
graph TD
  analyzers["analyzers"] --> core["core"]
  benchmarks["benchmarks"] --> core["core"]
  benchmarks["benchmarks"] --> outputs["outputs"]
  cli["cli"] --> benchmarks["benchmarks"]
  cli["cli"] --> config["config"]
  cli["cli"] --> core["core"]
  cli["cli"] --> outputs["outputs"]
  cli["cli"] --> retrievers["retrievers"]
  config["config"] --> core["core"]
  core["core"] --> analyzers["analyzers"]
  core["core"] --> config["config"]
  core["core"] --> llm["llm"]
  llm["llm"] --> core["core"]
  mcp["mcp"] --> core["core"]
  mcp["mcp"] --> outputs["outputs"]
  mcp["mcp"] --> retrievers["retrievers"]
  outputs["outputs"] --> core["core"]
  retrievers["retrievers"] --> core["core"]
  retrievers["retrievers"] --> outputs["outputs"]
  test["test"] --> analyzers["analyzers"]
  test["test"] --> benchmarks["benchmarks"]
  test["test"] --> cli["cli"]
  test["test"] --> config["config"]
  test["test"] --> core["core"]
  test["test"] --> mcp["mcp"]
  test["test"] --> outputs["outputs"]
  test["test"] --> retrievers["retrievers"]
```

## Module Edges
| From | To | Count |
| --- | --- | --- |
| analyzers | core | 5 |
| benchmarks | core | 2 |
| benchmarks | outputs | 3 |
| cli | benchmarks | 1 |
| cli | config | 1 |
| cli | core | 7 |
| cli | outputs | 9 |
| cli | retrievers | 1 |
| config | core | 2 |
| core | analyzers | 4 |
| core | config | 1 |
| core | llm | 1 |
| llm | core | 1 |
| mcp | core | 1 |
| mcp | outputs | 5 |
| mcp | retrievers | 2 |
| outputs | core | 29 |
| retrievers | core | 3 |
| retrievers | outputs | 2 |
| test | analyzers | 3 |
| test | benchmarks | 1 |
| test | cli | 1 |
| test | config | 3 |
| test | core | 23 |
| test | mcp | 1 |
| test | outputs | 11 |
| test | retrievers | 1 |
