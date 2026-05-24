# Dependency Graph

## Module Graph
```mermaid
graph TD
  analyzers["analyzers"] --> core["core"]
  cli["cli"] --> core["core"]
  cli["cli"] --> outputs["outputs"]
  config["config"] --> core["core"]
  core["core"] --> analyzers["analyzers"]
  core["core"] --> config["config"]
  outputs["outputs"] --> core["core"]
```

## Module Edges
| From | To | Count |
| --- | --- | --- |
| analyzers | core | 4 |
| cli | core | 2 |
| cli | outputs | 2 |
| config | core | 2 |
| core | analyzers | 4 |
| core | config | 1 |
| outputs | core | 8 |
