# Roadmap 中文

OpenCode++ 的路线图围绕一条主线展开：

```txt
执行前上下文
  -> 执行中边界
  -> 执行后证据与验证
  -> Loop 决策报告
```

## 近期重点

- 收敛 README，把细节迁入 docs。
- 稳定 bounded harness-led orchestrator。
- 强化 OpenCode executor 和事件 normalizer。
- 完善 Hallucination Guard、Regression Guard、Evidence Guard 的阻断条件。
- 让 MCP core tools 和 runtime tools 的状态更清晰。

## 中期目标

- MiMoCode、Codex JSONL、Claude Code transcript normalizer。
- CodeGraph 作为可选 backend，用于 retrieve / impact / tests。
- LightRAG direct server sync。
- 更真实的 OpenCode / MiMoCode / Codex / Claude agent benchmark。

## 长期目标

让现有 Code Agent 在复杂仓库中更少瞎猜、更少乱改、更少复发旧 bug，并且改完之后能给出可审计的证据和决策报告。

英文详细路线图见 [roadmap.md](roadmap.md)。
