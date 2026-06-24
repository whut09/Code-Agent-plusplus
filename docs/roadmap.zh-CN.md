# Roadmap 中文

OpenCode++ 的路线图围绕一条主线展开：

```txt
执行前上下文
  -> 执行中边界
  -> 执行后证据与验证
  -> Loop 决策报告
```

## 近期重点

- 把 `opencode-plusplus@0.1.0` 发布到 npm，让外部用户不再需要 clone 源码和 `npm link`。
- 收敛 README，把细节迁入 docs。
- 稳定 bounded harness-led orchestrator。
- 强化 OpenCode executor 和事件 normalizer。
- 完善 Hallucination Guard、Regression Guard、Evidence Guard 的阻断条件。
- 让 MCP core tools 和 runtime tools 的状态更清晰。

### v0.1.0 npm 发布门禁

发布前必须通过：

```bash
npm run check
npm run lint
npm run format:check
npm run docs:cli:check
npm test
npm run benchmark
npm run benchmark:agent
npm run build
npm run pack:dry-run
```

CI 已覆盖同一组基础检查，`prepublishOnly` 也会执行同一组发布门禁。发布成功之后，首页安装路径会切换为：

```bash
npm i -g opencode-plusplus opencode-ai
cd your-repo
opencode-plusplus
```

发布前不要在文档里声称 npm 包已经可用。详细步骤见 [Release Checklist](release.md)。

## 中期目标

- MiMoCode、Codex JSONL、Claude Code transcript normalizer。
- CodeGraph 作为可选 backend，用于 retrieve / impact / tests。
- LightRAG direct server sync。
- 更真实的 OpenCode / MiMoCode / Codex / Claude agent benchmark。

## 长期目标

让现有 Code Agent 在复杂仓库中更少瞎猜、更少乱改、更少复发旧 bug，并且改完之后能给出可审计的证据和决策报告。

英文详细路线图见 [roadmap.md](roadmap.md)。
