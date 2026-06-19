# Code Agent++

中文 | [English](README.en.md)

**面向 AI 编程 Agent 的外挂式增强与可靠性工程层。**

Code Agent++ 不做另一个代码生成 Agent，也不替代 Codex、OpenCode、Claude Code、Cursor、MiMoCode 写代码。它让你像平常一样使用 OpenCode 聊天，同时在外层透明提供上下文、边界、命令前置阻断、执行后证据采集、增量验证、影响分析、回归防护和最终报告。

```txt
Code Agent 负责读代码、改代码、跑命令。
Code Agent++ 负责上下文、边界、证据、门禁、影响分析和验证报告。
```

## 30 秒开始

```bash
npm i -g code-agent-plusplus opencode-ai
cd your-repo
capp
```

然后像使用 OpenCode 一样聊天：

```txt
帮我修复登录超时 bug
给这个模块补单测
重构这个函数并保持行为不变
```

Code Agent++ 会在外层自动完成：

- 上下文初始化与增量更新
- 编辑边界检查
- 命令幻觉 / 危险命令检查
- protected path / secret path 前置阻断
- 测试证据、命令结果和 sidecar 事件记录
- 当前 diff 增量验证
- contracts / hallucination / regression / impact / tests / policy 组合门禁
- 影响范围与回归风险提示
- 最终检查报告

默认安静运行，只有发现 blocker 时才提醒。

## 日常命令

```bash
capp          # 进入 OpenCode 聊天模式，自动启用 Code Agent++ sidecar
capp report   # 查看最近一次检查结果
capp status   # 查看 sidecar 是否 active
capp doctor   # 诊断 OpenCode / auth / git / context / plugin
capp --pure   # 纯 OpenCode，不启用 Code Agent++
```

`capp` 会执行 preflight，确保 `.agent-context`，写入 `.opencode/plugins/code-agent-plusplus.ts`，准备 OpenCode commands/agent，先打印 3 行短状态，然后进入当前仓库的 OpenCode TUI。Sidecar plugin 会监听 `tool.execute.before`、`tool.execute.after`、`file.edited` 和 `session.idle`：执行危险命令、幻觉 package script / Makefile target、触碰 protected / secret path 时会前置阻断；工具执行结束后会记录 command、exit code、stdout/stderr hash、working tree hash 和 touched files；OpenCode 空闲且有 dirty diff 时会自动运行增量验证，写入 `.agent-context/sidecar/latest.json` 和 `.agent-context/sidecar/latest.md`。

## 高级用法

首页主路径只推荐 `capp`。批处理 Harness Mode、CI-like executor、手动 `verify / policy / impact`、MCP 和 retrieval 等内核能力都保留给高级用户：

- [OpenCode Transparent Sidecar Mode](docs/integrations/opencode-sidecar.md)
- [Executor CLI Integration](docs/integrations/executor-cli.md)
- [CLI Reference](docs/reference/cli-reference.md)
- [MCP Tools](docs/reference/mcp-tools.md)

## 输出

```txt
AGENTS.md
.agent-context/
  repo-summary.md
  key-files.md
  contracts/
  runs/<task-id>/
  traces/
  sidecar/
  hallucination/
  regression/
  graphs/
  index/
```

## 与相关项目的关系

| 项目                          | 主要职责                              | 与 Code Agent++ 的关系                                       |
| ----------------------------- | ------------------------------------- | ------------------------------------------------------------ |
| Codex / Claude Code / Cursor  | 读代码、改代码、跑命令                | 作为 executor，Code Agent++ 提供外层验证和约束               |
| OpenCode / MiMoCode           | 开源 coding agent runtime / assistant | 重点 executor 接入方向，Code Agent++ 补充 harness gate       |
| CodeGraph                     | 代码图谱 / symbol / call graph / MCP  | 可作为可选深度代码理解 backend                               |
| OpenHarness / Oh My OpenAgent | 通用 agent harness / workflow         | 同属 harness 方向，Code Agent++ 更聚焦 coding agent 可靠闭环 |

## 解决什么问题

- Agent 不知道该读哪些文件，靠猜入口和模块。
- Agent 修改范围失控，误改 generated、lockfile、CI、migration 或无关模块。
- Agent 生成不存在的 API、命令、配置、环境变量或项目约定。
- Agent 声称测试通过，但没有可信的 exit code / timestamp / working tree hash 证据。
- Agent 改完影响范围不可见，review 风险难判断。
- Agent 重复引入历史 bug，repair loop 不知道何时停止。

## 通过 AI Agent 使用

你可以直接对 Codex / Claude Code / Cursor / OpenCode / MiMoCode 说：

```txt
使用 https://github.com/whut09/Code-Agent-plusplus 对 xxx 项目启用 Code Agent++。
优先使用 capp 聊天模式：安装 code-agent-plusplus 和 opencode-ai，进入目标仓库后运行 capp。
如果需要批处理上下文包或 CI-like 验证，再参考 docs 里的高级命令。
LLM key/baseUrl/model 只写入 code-agent-plusplus.local.yml，不要提交该文件。
最后说明 sidecar 是否 active、生成了哪些文件、是否存在 blocker。
```

## 当前能力成熟度

| 能力                                             | 当前状态         | 说明                                                                                 |
| ------------------------------------------------ | ---------------- | ------------------------------------------------------------------------------------ |
| `capp` OpenCode TUI launcher                     | MVP              | 已可 preflight、打印短状态、启动 OpenCode TUI，并支持 `--pure`                       |
| OpenCode transparent sidecar plugin              | MVP              | 已注入 `.opencode/plugins/code-agent-plusplus.ts`，监听 session / file / tool 事件   |
| sidecar command guard                            | MVP+             | 已支持危险命令、未知 package script / Makefile target、protected / secret path       |
| sidecar post-tool evidence                       | Foundation       | 已通过 `tool.execute.after` 记录 exit code、时间、输出 hash、working-tree hash       |
| sidecar verify / shared guard stack              | Foundation       | 已复用 contracts、hallucination、regression、impact、tests、policy，仍需更多实仓验证 |
| `capp report/status/doctor`                      | Foundation       | 已可读取 sidecar 报告、检查 active 状态、诊断 OpenCode / auth / git / context        |
| batch OpenCode executor / `capp oc`              | Foundation       | 适合 benchmark、CI-like run、非交互任务和可重复 demo                                 |
| bounded harness-led orchestrator / `orchestrate` | Foundation       | 已支持多轮 artifacts、checkpoint、executor command、decision report                  |
| `build` / `AGENTS.md` / `.agent-context`         | Stable           | 仓库上下文编译与生成产物稳定                                                         |
| task plan / pack / run                           | Stable           | 任务级上下文、边界、prompt、trace 文件已稳定                                         |
| TypeScript Compiler API analyzer                 | Stable           | TypeScript / JavaScript 分析主路径稳定                                               |
| Python AST / optional Tree-sitter analyzer       | Foundation       | Python 分析可用，Tree-sitter 为可选增强                                              |
| Hallucination Guard                              | MVP              | 已覆盖缺失文件、命令、依赖、配置、symbol 的确定性检查                                |
| Regression Guard / memory candidates             | MVP / Foundation | 已有结构化 regression memory 和候选写入流程                                          |
| MCP stdio server + core tools                    | Foundation       | MCP 基础工具可用，端到端客户端集成仍需逐项验证                                       |
| MCP Agent Native Runtime tools                   | Experimental     | start/step/evaluate/repair/finalize 仍属实验能力                                     |
| MiMoCode / Codex / Claude native normalizers     | Planned          | 计划补齐更多真实 agent transcript / JSONL normalizer                                 |
| RAG export / retriever provider interface        | Foundation       | 已有导出和 provider 接口                                                             |
| direct LightRAG server sync                      | Planned          | 计划中                                                                               |

完整成熟度说明见 [文档首页](docs/README.md)。

## 文档导航

- [5 分钟跑通](docs/getting-started.md)
- [项目定位](docs/concepts/positioning.md)
- [总体架构](docs/concepts/architecture.md)
- [Guard 模块](docs/concepts/guard-modules.zh-CN.md)
- [Agent-led vs Harness-led](docs/concepts/integration-modes.zh-CN.md)
- [Loop Engineering 源码链路](docs/concepts/loop-engineering.zh-CN.md)
- [CLI 命令参考](docs/reference/cli-reference.md)
- [输出结构说明](docs/reference/artifacts.md)
- [Executor Adapter 状态](docs/reference/executor-adapters.md)
- [Benchmark 指南](docs/developer/benchmark-guide.md)
- [Roadmap](docs/roadmap.zh-CN.md)

## 开发

```bash
npm install
npm run build
npm run check
npm test
```

## 致谢

Code Agent++ 的设计受到 [OpenAI Codex](https://github.com/openai/codex)、[OpenCode](https://github.com/anomalyco/opencode)、[MiMo-Code](https://github.com/XiaomiMiMo/MiMo-Code)、[CodeGraph](https://github.com/colbymchenry/codegraph)、[Oh My OpenAgent](https://github.com/code-yeongyu/oh-my-openagent)、[OpenHarness](https://github.com/HKUDS/OpenHarness) 和 [OpenClaw](https://github.com/openclaw/openclaw) 等项目启发。
