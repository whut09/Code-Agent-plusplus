# Repo-to-Agent-Context

中文 | [English](README.en.md)

面向编程 Agent 的 Agent Harness Runtime 控制面。

Repo-to-Agent-Context is an Agent Harness Runtime Control Plane for coding agents.

它不替代 Codex / Claude Code / Cursor 写代码，而是负责任务上下文编译、编辑边界、执行轨迹、策略检查、影响分析、测试推荐和下一步 Loop 决策。核心主线是：

```txt
Context -> Agent -> Execution -> Trace -> Evaluation -> Context Update -> Loop
```

它不是简单 repo summarizer，也不只是 context pack tool。它的目标是给 Codex / Claude Code / Cursor 增加一个静态但可验证的工程控制面：更少乱读、更少乱改，改完知道怎么验证，并能根据 trace、policy、tests、diff 和 freshness 进入下一轮修复或收口。

<p align="center">
  <img src="./assets/context-pack-demo.svg" width="900" alt="Repo-to-Agent-Context 输出效果动画">
</p>

## 通过 AI Agent 使用

这个项目的主要用户就是 AI 编程工具。你可以直接在 Codex、Claude Code、Cursor 或其他 Agent 里说：

```txt
使用 https://github.com/whut09/Repo-to-Agent-Context 对 xxx 项目生成 AGENTS.md 和 .agent-context 上下文包。
请先检查目标仓库结构，再按需安装或克隆该工具。
请强制启用 LLM 摘要：在目标仓库创建或更新 repo-context.local.yml，不要提交该文件，优先使用当前 AI 工具环境里可用的模型 API 配置，或我提供的 key/baseUrl/model；如果缺少配置，请先问我。
然后运行 repo-context build <目标仓库> --target codex --llm，再运行 repo-context validate <目标仓库>，最后说明生成了哪些文件，以及 LLM 摘要模式是否成功。
```

把 `xxx 项目` 换成本地路径、GitHub 仓库或当前工作区名称即可。真实 key 只写入 `repo-context.local.yml`，不要提交。

## 它解决什么问题？

AI 编程工具通常不是不会写代码，而是没吃对上下文：

- 上下文丢失：不知道入口文件、模块边界、测试命令和架构约束。
- 乱读文件：把整个仓库塞进上下文，token 浪费严重。
- 乱改文件：没有编辑边界，不知道哪些路径是 generated、lockfile、migration、env。
- 改完不会验证：不知道该跑哪些测试、typecheck、lint 或 diff impact。

Repo-to-Agent-Context 的目标是把“给 Agent 的仓库记忆”升级成可生成、可更新、可验证、可闭环控制的运行时系统。

## 30 秒怎么用？

```bash
npx repo-to-agent-context build .
repo-context plan "fix login timeout bug" .
repo-context pack "fix login timeout bug" .
```

本地源码运行：

```bash
npm install
npm run build
node dist/cli/index.js build .
```

常用闭环：

```bash
repo-context run "fix login timeout bug" . --type bugfix
repo-context delta . --base main
repo-context evolve . --base main
repo-context loop "fix login timeout bug" . --phase after-edit
repo-context trace add fix-login-timeout-bug . --action edit --files src/auth/session.ts --reason "timeout logic"
repo-context trace run fix-login-timeout-bug . --action run-test --command "npm test -- auth"
repo-context policy . --base main --trace fix-login-timeout-bug
repo-context tests . --diff --base main
repo-context impact . --base main
repo-context verify --diff .
repo-context freshness .
repo-context drift .
```

## 比 repo summarizer / RAG loader 多了什么？

- ✅ task-aware context：按任务检索、图扩展、预算打包，而不是输出一堆摘要。
- ✅ evidence-linked index：索引包含 analyzer、confidence、symbols、imports 和行级 evidence。
- ✅ contracts：生成架构、模块边界、命令、测试、安全约束，并支持 `validate-contracts`。
- ✅ tests recommendation：根据文件和 diff 推荐最小测试/回归测试。
- ✅ diff / impact / verify：面向改代码后的影响分析和验证报告。
- ✅ loop controller：根据 freshness、diff、contracts、tests、impact 决定下一步是重建上下文、补测试、修 contract 还是进入 review。
- ✅ execution trace：结构化记录 Agent 的编辑、测试、验证和最终状态，并区分 manual / command / CI evidence。
- ✅ policy engine：对 diff、contracts、freshness、trace 进行运行时护栏检查，拦截禁改行为、提示风险并强制测试/验证证据；`trace run` 捕获 exit code、输出哈希和 working tree hash，可信度高于手动声明。
- ✅ context delta：从 git diff 推导需要更新的上下文产物、受影响图节点和 Agent 必须重读的文件；`evolve` 当前是 cache-aware full refresh，selective output writes 仍在计划中。
- 🧪 MCP runtime tools：stdio MCP server 已暴露 build / plan / pack / retrieve / tests / impact / verify 以及 start_loop / step / evaluate / repair / finalize 等工具；真实客户端集成仍需逐个验证。
- 🧪 benchmark：Loop Behavior Benchmark，对比 no-context / AGENTS.md / context pack / loop-enabled harness 下的错改、测试失败、步骤、token 和 repair loops。
- 🧪 hybrid retrieve：统一 static / ripgrep 检索协议，为 RAG、MCP、编辑器扩展留接口。
- 🚧 real agent benchmark：计划接入真实 Codex / Claude Code 运行数据。

## 当前状态

| 能力                                           | 状态            |
| ---------------------------------------------- | --------------- |
| `build` / `AGENTS.md` / `.agent-context`       | ✅ implemented  |
| minimal `AGENTS.md` + manual/generated 分层    | ✅ implemented  |
| TypeScript Compiler API analyzer               | ✅ implemented  |
| Python AST / optional Tree-sitter analyzer     | ✅ implemented  |
| token savings estimated + actual output tokens | ✅ implemented  |
| readiness 分维度评分和硬上限                   | ✅ implemented  |
| task plan / pack / run                         | ✅ implemented  |
| loop controller                                | ✅ implemented  |
| execution trace                                | ✅ implemented  |
| policy engine                                  | ✅ implemented  |
| context delta analysis                         | ✅ implemented  |
| evolve cache-aware full refresh                | ✅ implemented  |
| evolve selective output writes                 | 🚧 planned      |
| tests / impact / verify                        | ✅ implemented  |
| freshness / drift / manifest                   | ✅ implemented  |
| contracts validation                           | ✅ implemented  |
| MCP server scaffold                            | ✅ implemented  |
| MCP tools: build / plan / pack / retrieve      | ✅ implemented  |
| Agent Native Runtime loop tools                | 🧪 experimental |
| benchmark harness                              | 🧪 experimental |
| hybrid retrieve / RAG export                   | 🧪 experimental |
| Claude / Cursor / Codex real integration       | 🚧 planned      |
| direct LightRAG server sync                    | 🚧 planned      |
| VS Code / Cursor extension                     | 🚧 planned      |

## 输出内容

```txt
AGENTS.md
AGENTS.manual.md
.agent-context/
  AGENTS.generated.md
  manifest.json
  repo-summary.md
  key-files.md
  module-map.md
  dependency-graph.md
  readiness.md
  token-savings.md
  contracts/
  tasks/
  runs/
  loops/
  traces/
  delta/
  rag/
  evidence/
  index/
  graphs/
```

根目录 `AGENTS.md` 默认保持很短，只放必须遵守的操作约束和深层上下文索引。更长的模块图、依赖图、readiness、token 报告、证据索引和任务包都放在 `.agent-context/`。

## AGENTS.md 会被自动读取吗？

取决于编程 Agent 客户端，而不是大模型本身。

- Codex：会读取 `AGENTS.md`。
- Claude Code：默认读取 `CLAUDE.md`；可以创建 `CLAUDE.md` 并写入 `@AGENTS.md` 来复用。
- Cursor：可把 `AGENTS.md` 放在项目根目录作为项目规则；复杂规则建议使用 `.cursor/rules`。
- 其他工具：支持情况不同；不支持自动加载时，把 `AGENTS.md` 手动附到 prompt 里。

详细说明见 [docs/agents-md.zh-CN.md](docs/agents-md.zh-CN.md)。

## 核心命令

```bash
repo-context build [repo]
repo-context plan "<task>" [repo]
repo-context pack "<task>" [repo]
repo-context run "<task>" [repo]
repo-context delta [repo] --base main
repo-context evolve [repo] --base main
repo-context loop "<task>" [repo] --phase after-edit
repo-context trace start "<task>" [repo] --agent codex
repo-context trace add <trace-id> [repo] --action edit --files src/auth/session.ts
repo-context trace run <trace-id> [repo] --action run-test --command "npm test -- auth"
repo-context policy [repo] --base main --trace <trace-id>
repo-context tests [repo] --diff --base main
repo-context impact [repo] --base main
repo-context verify --diff [repo]
repo-context validate [repo]
repo-context validate-contracts [repo]
repo-context freshness [repo]
repo-context drift [repo]
repo-context benchmark [benchmarkDir] --top-k 8
repo-context retrieve "<task>" [repo] --provider hybrid
repo-context-mcp
```

## MCP / Agent Native Runtime

`repo-context-mcp` 当前提供 stdio MCP server 和一组工具定义。它已经可以被支持 MCP 的客户端或自研 Agent 接入；Claude Code、Cursor、Codex CLI、LibreChat、OpenHands 等端到端集成仍按客户端逐个验证。

```txt
repo_context_start_loop
repo_context_step
repo_context_evaluate
repo_context_repair
repo_context_finalize
```

实验性 runtime loop 工具包括：start_loop 生成任务运行目录和 trace，step 记录编辑/测试/验证动作，evaluate 汇总 delta、loop、policy、verify 信号，repair 产出修复动作，finalize 在测试和 contract 证据齐全后收口。

## LLM 摘要配置

默认离线可用；需要 LLM 摘要时，本地创建 `repo-context.local.yml`：

```yaml
llm:
  enabled: true
  provider: openai-compatible
  baseUrl: xx
  apiKey: xx
  model: xx
```

提交到仓库的配置只保留 `xx` 占位符。真实 key、URL、model 只放本地文件。

```bash
repo-context build . --llm
```

## 文档

- [架构设计](docs/architecture.md)
- [Loop Engineering 源码链路](docs/loop-engineering.zh-CN.md)
- [AGENTS.md 使用说明](docs/agents-md.zh-CN.md)
- [Roadmap](docs/roadmap.md)
- [Benchmark](benchmarks/README.md)

## 开发

```bash
npm run check
npm run lint
npm run format:check
npm test
npm run benchmark
npm run build
npm run pack:dry-run
```
