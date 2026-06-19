# Dependency Graph

## Module Graph
```mermaid
graph TD
  analyzers["analyzers"] --> core["core"]
  benchmarks["benchmarks"] --> core["core"]
  benchmarks["benchmarks"] --> harness["harness"]
  benchmarks["benchmarks"] --> outputs["outputs"]
  benchmarks_fixtures_monorepo_packages_api["benchmarks/fixtures/monorepo/packages/api"] --> benchmarks_fixtures_monorepo_packages_config["benchmarks/fixtures/monorepo/packages/config"]
  benchmarks_fixtures_monorepo_packages_web["benchmarks/fixtures/monorepo/packages/web"] --> benchmarks_fixtures_monorepo_packages_config["benchmarks/fixtures/monorepo/packages/config"]
  cli["cli"] --> benchmarks["benchmarks"]
  cli["cli"] --> config["config"]
  cli["cli"] --> core["core"]
  cli["cli"] --> harness["harness"]
  cli["cli"] --> integrations["integrations"]
  cli["cli"] --> outputs["outputs"]
  cli["cli"] --> retrievers["retrievers"]
  config["config"] --> core["core"]
  core["core"] --> analyzers["analyzers"]
  core["core"] --> config["config"]
  core["core"] --> llm["llm"]
  core["core"] --> outputs["outputs"]
  harness["harness"] --> core["core"]
  harness["harness"] --> outputs["outputs"]
  harness["harness"] --> sandbox["sandbox"]
  integrations["integrations"] --> core["core"]
  integrations["integrations"] --> retrievers["retrievers"]
  llm["llm"] --> core["core"]
  mcp["mcp"] --> core["core"]
  mcp["mcp"] --> harness["harness"]
  mcp["mcp"] --> outputs["outputs"]
  mcp["mcp"] --> retrievers["retrievers"]
  outputs["outputs"] --> core["core"]
  outputs["outputs"] --> harness["harness"]
  outputs["outputs"] --> integrations["integrations"]
  retrievers["retrievers"] --> core["core"]
  retrievers["retrievers"] --> integrations["integrations"]
  retrievers["retrievers"] --> outputs["outputs"]
  sandbox["sandbox"] --> core["core"]
  test["test"] --> analyzers["analyzers"]
  test["test"] --> benchmarks["benchmarks"]
  test["test"] --> cli["cli"]
  test["test"] --> config["config"]
  test["test"] --> core["core"]
  test["test"] --> harness["harness"]
  test["test"] --> integrations["integrations"]
  test["test"] --> mcp["mcp"]
  test["test"] --> outputs["outputs"]
  test["test"] --> retrievers["retrievers"]
  test_fixtures_monorepo_packages_web["test/fixtures/monorepo/packages/web"] --> test_fixtures_monorepo_packages_api["test/fixtures/monorepo/packages/api"]
```

## Module Edges
| From | To | Count |
| --- | --- | --- |
| analyzers | core | 5 |
| benchmarks | core | 5 |
| benchmarks | harness | 6 |
| benchmarks | outputs | 7 |
| benchmarks/fixtures/monorepo/packages/api | benchmarks/fixtures/monorepo/packages/config | 1 |
| benchmarks/fixtures/monorepo/packages/web | benchmarks/fixtures/monorepo/packages/config | 1 |
| cli | benchmarks | 2 |
| cli | config | 1 |
| cli | core | 10 |
| cli | harness | 7 |
| cli | integrations | 1 |
| cli | outputs | 10 |
| cli | retrievers | 1 |
| config | core | 2 |
| core | analyzers | 4 |
| core | config | 1 |
| core | llm | 1 |
| core | outputs | 3 |
| harness | core | 17 |
| harness | outputs | 26 |
| harness | sandbox | 3 |
| integrations | core | 2 |
| integrations | retrievers | 1 |
| llm | core | 1 |
| mcp | core | 1 |
| mcp | harness | 3 |
| mcp | outputs | 7 |
| mcp | retrievers | 2 |
| outputs | core | 34 |
| outputs | harness | 14 |
| outputs | integrations | 2 |
| retrievers | core | 4 |
| retrievers | integrations | 1 |
| retrievers | outputs | 2 |
| sandbox | core | 4 |
| test | analyzers | 3 |
| test | benchmarks | 2 |
| test | cli | 2 |
| test | config | 3 |
| test | core | 44 |
| test | harness | 13 |
| test | integrations | 1 |
| test | mcp | 1 |
| test | outputs | 22 |
| test | retrievers | 1 |
| test/fixtures/monorepo/packages/web | test/fixtures/monorepo/packages/api | 1 |
