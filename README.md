# Code Agent++

中文 | [English](README.en.md)

**面向 AI 编程 Agent 的外挂式增强与可靠性工程层。**

Code Agent++ 不做另一个代码生成 Agent，也不替代 Codex、OpenCode、Claude Code、Cursor、MiMoCode 写代码。它是一个 bounded harness-led control loop：把仓库编译成 task-aware context，生成编辑边界，记录执行证据，运行 policy / contracts / tests / impact / verify，并输出 `finalize / repair / repack / block / require-human-review` 决策报告。

```txt
Code Agent 负责读代码、改代码、跑命令
Code Agent++ 负责上下文、边界、证据、门禁、影响分析和决策报告
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

## 30 秒怎么用

推荐主入口：直接进入 OpenCode TUI，自动注入 Code Agent++ sidecar。

```bash
npm i -g code-agent-plusplus opencode-ai
cd your-repo
capp
```

`capp` 会执行 preflight，确保 `.agent-context`，写入 `.opencode/plugins/code-agent-plusplus.ts`，准备 OpenCode commands/agent，然后进入当前仓库的 OpenCode TUI。Sidecar plugin 会监听 `tool.execute.before`、`file.edited` 和 `session.idle`：执行危险命令、幻觉 package script / Makefile target、触碰 protected / secret path 时会前置阻断；OpenCode 空闲时会自动运行增量验证，写入 `.agent-context/sidecar/latest.json` 和 `.agent-context/sidecar/latest.md`；只有发现 blocker 时才在 TUI 里提示。收尾前也可以手动运行：

```bash
capp sidecar verify .
capp sidecar check-command . --command "npm run test"
```

普通用户只需要记住：

```bash
capp          # 进入 OpenCode 聊天模式，自动启用 Code Agent++ sidecar
capp report   # 查看最近一次 sidecar 检查结果
capp status   # 查看 sidecar 是否 active
capp doctor   # 诊断 OpenCode / auth / git / context / plugin
capp --pure   # 纯 OpenCode，不启用 Code Agent++
```

批处理 / CI harness-led executor flow：

```bash
capp oc init .
npx code-agent-plusplus opencode doctor .
npx code-agent-plusplus opencode run "fix login timeout bug" .
capp oc "fix login timeout bug" .
capp oc report --last
capp oc repair
```

OpenCode preset 内部默认使用：

```bash
opencode run --format json --dir {repo} --file {prompt} "Follow the attached Code Agent++ task prompt."
```

输出会写入：

```txt
AGENTS.md
.agent-context/
  repo-summary.md
  key-files.md
  contracts/
  runs/<task-id>/
  traces/
  hallucination/
  regression/
  graphs/
  index/
```

## 通过 AI Agent 使用

你可以直接对 Codex / Claude Code / Cursor / OpenCode / MiMoCode 说：

```txt
使用 https://github.com/whut09/Code-Agent-plusplus 对 xxx 项目生成 Code Agent++ 上下文与可靠性增强包。
请先检查目标仓库结构，再按需安装或克隆该工具。
强制启用 LLM 摘要：在目标仓库创建或更新 code-agent-plusplus.local.yml，不要提交该文件。
优先使用当前 AI 工具环境可用的模型 API 配置，或我提供的 key/baseUrl/model；如果缺少配置，请先问我。
然后运行 code-agent-plusplus build <目标仓库> --target codex --llm，再运行 code-agent-plusplus validate <目标仓库>。
最后说明生成了哪些文件、哪些 Guard 能力可用，以及 LLM 摘要模式是否成功。
```

真实 key 只写入 `code-agent-plusplus.local.yml`，不要提交。

## 当前能力成熟度

| 能力                                                 | 成熟度              |
| ---------------------------------------------------- | ------------------- |
| `build` / `AGENTS.md` / `.agent-context`             | Stable              |
| task plan / pack / run                               | Stable              |
| TypeScript Compiler API analyzer                     | Stable              |
| Python AST / optional Tree-sitter analyzer           | Foundation          |
| token savings estimated + actual output tokens       | Stable              |
| Context / Boundary / Evidence / Impact / Loop Guards | Foundation          |
| Hallucination Guard                                  | MVP                 |
| Regression Guard / memory candidates                 | MVP / Foundation    |
| bounded harness-led orchestrator / `orchestrate`     | Foundation          |
| mock executor / generic `--executor-command`         | Stable / Foundation |
| `capp` OpenCode TUI launcher + sidecar plugin        | Foundation          |
| `capp sidecar verify`                                | Foundation          |
| OpenCode preset / `opencode run` / `oc`              | Foundation          |
| OpenCode project init / `.opencode` commands         | Foundation          |
| OpenCode doctor                                      | Foundation          |
| compact OpenCode run summary / `oc report` / repair  | Foundation          |
| OpenCode event normalizer                            | Foundation          |
| MiMoCode / Codex / Claude native normalizers         | Planned             |
| MCP stdio server + core tools                        | Foundation          |
| MCP Agent Native Runtime tools                       | Experimental        |
| RAG export / retriever provider interface            | Foundation          |
| direct LightRAG server sync                          | Planned             |

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
