# Code Agent++

中文 | [English](README.en.md)

**Code Agent++：面向 Code Agent 的外挂式增强与可靠性工程层。**

Code Agent++ 不做另一个代码生成 Agent，也不替代 Codex、OpenCode、Claude Code、Cursor、MiMoCode 写代码。它的定位是 **Code Agent Enhancement Layer / Agent Reliability Layer**：围绕 Code Agent 在真实工程中的常见失败模式，提供上下文、边界、验证、回归防护、幻觉抑制、影响分析和修复闭环等外挂式增强能力。

Code Agent 本身已经具备较强的读代码、改代码、跑命令能力，但在复杂仓库中仍然容易出现工程问题：

- 缺少准确上下文，靠猜测定位文件和模块。
- 修改范围失控，误改无关文件或 protected path。
- 生成不存在的 API、配置、命令或项目约定，产生工程幻觉。
- 测试证据不可信，先测试通过后又继续改代码。
- 改动影响范围不可见，review 风险难以判断。
- 曾经修复过的问题，在后续修改中被重新引入。
- repair loop 反复执行，无法判断该继续、回滚还是收口。
- `AGENTS.md`、`CLAUDE.md`、Cursor rules 等上下文文件过大、过旧或互相冲突。

Code Agent++ 的目标不是让 Agent “更会生成代码”，而是让 Agent 的修改过程 **更有边界、更有证据、更可验证、更少回归**。

```txt
Code Agent 负责写代码
Code Agent++ 负责约束、验证、记录、纠偏和防回归
```

核心闭环：

```txt
Context -> Agent -> Execution -> Trace -> Evaluation -> Context Update -> Loop
```

当前实现已经支持两种路径：Agent 主导时，它是 Context / Policy / Trace 报告系统 + 显式 runtime 状态机；Code Agent++ 主导时，`orchestrate` 会调用可替换 executor，按 `--max-loops` 执行多轮 `pack -> execute -> evaluate -> repair/repack/finalize`，并把每轮证据写入 `.agent-context/runs/<task-id>/iterations/`。它仍不替代外部 Code Agent 写代码，但已经可以拥有验收权和下一轮决策权。

<p align="center">
  <img src="./assets/context-pack-demo.svg" width="900" alt="Code Agent++ 输出效果动画">
</p>

## 通过 AI Agent 使用

这个项目的主要用户就是 AI 编程工具。你可以直接在 Codex、Claude Code、Cursor、OpenCode、MiMoCode 或其他 Agent 里说：

```txt
使用 https://github.com/whut09/Code-Agent-plusplus 对 xxx 项目生成 Code Agent++ 上下文与可靠性增强包。
请先检查目标仓库结构，再按需安装或克隆该工具。
请强制启用 LLM 摘要：在目标仓库创建或更新 code-agent-plusplus.local.yml，不要提交该文件，优先使用当前 AI 工具环境里可用的模型 API 配置，或我提供的 key/baseUrl/model；如果缺少配置，请先问我。
然后运行 code-agent-plusplus build <目标仓库> --target codex --llm，再运行 code-agent-plusplus validate <目标仓库>，最后说明生成了哪些文件、哪些 Guard 能力可用，以及 LLM 摘要模式是否成功。
```

把 `xxx 项目` 换成本地路径、GitHub 仓库或当前工作区名称即可。真实 key 只写入 `code-agent-plusplus.local.yml`，不要提交。

## 核心理念

Code Agent++ 采用问题驱动的外挂式架构：

```txt
Code Agent 出现什么类型的问题
  -> Code Agent++ 挂载对应的 Guard / Enhancer 模块
```

典型映射：

| Code Agent 失败模式                | Code Agent++ 模块                   |
| ---------------------------------- | ----------------------------------- |
| 上下文不准、乱搜文件               | Context Guard                       |
| 幻觉 API / 幻觉命令 / 幻觉项目约定 | Hallucination Guard                 |
| 修改范围失控                       | Boundary Guard                      |
| 重复引入历史 bug                   | Regression Guard                    |
| 测试证据不可信                     | Evidence Guard                      |
| 改动影响范围不可见                 | Impact Guard                        |
| 修复循环无法收口                   | Loop Guard                          |
| 多种 Agent 输出格式不统一          | Executor Adapter + Trace Normalizer |

`AGENTS.md` 只是 Context Guard 的一种输出形式。Code Agent++ 更大的目标，是成为 Codex / OpenCode / Claude Code / Cursor / MiMoCode 的外挂可靠性层。

## 技术路线

Code Agent++ 的技术路线分为三层：执行前增强、执行中约束、执行后验证。

### 1. 执行前：让 Agent 少猜

在 Code Agent 开始改代码之前，Code Agent++ 先对仓库进行结构化分析，生成任务级上下文和工程边界。

主要能力：

- 仓库结构分析。
- 模块关系分析。
- 任务相关文件检索。
- task-aware context pack。
- `AGENTS.md` / `CLAUDE.md` / Cursor rules / OpenCode instructions 导出。
- 编辑边界生成。
- protected path 识别。
- 历史修复记录、known issues、anti-regression notes 注入。
- 推荐测试路径和验证命令。

这一层解决：Agent 不知道该看哪里、不知道哪里不能动、不知道历史上踩过哪些坑、不知道改完该怎么验证。

### 2. 执行中：让 Agent 有边界

Code Agent++ 不直接替代 Agent 写代码，而是通过 Executor Adapter 外挂到不同 Code Agent：

- OpenCode Executor
- Codex CLI Executor
- Claude Code Executor
- Cursor Executor
- MiMoCode Executor
- Mock Executor

典型流程：

```txt
Code Agent++ plan
  -> Code Agent++ pack
  -> 调用 OpenCode / Codex / Claude Code / Cursor / MiMoCode 执行修改
  -> 收集 diff、命令、日志、事件流
  -> 进入验证和决策
```

关键原则：**Code Agent 可以自主改代码，但不能自主宣布完成。** Agent 是否真的完成任务，要由 Code Agent++ 根据证据、diff、测试和策略门禁来判断。

### 3. 执行后：让修改可验证、可审计、少回归

Agent 修改完成后，Code Agent++ 进入验证与决策阶段。

主要能力：

- diff changed files 分析。
- allowed / denied edit boundary 检查。
- protected path 检查。
- dependency impact / blast radius 分析。
- 测试推荐与测试执行。
- command trace 记录。
- exit code、timestamp、working tree hash 校验。
- 测试证据是否晚于最后一次编辑。
- 回归风险检测。
- 历史 bug / known issue 对照。
- repair / repack / rerun tests / finalize 决策。

这一层解决：Agent 说完成了到底有没有完成、测试证据可信吗、有没有越界修改、有没有引入旧 bug、影响了哪些下游模块、现在该继续修还是等待人工 review。

## Guard 模块

### Context Guard

负责任务级上下文增强。输出包括 `AGENTS.md`、`CLAUDE.md`、Cursor rules、OpenCode instructions、task pack、module map、relevant files 和 validation hints。目标是减少上下文丢失、无效搜索和 token 浪费。

### Hallucination Guard

负责降低工程幻觉。检查 Agent 是否使用了仓库中不存在的文件、API、函数、配置项、CLI 命令、测试命令、项目约定、依赖包或环境变量。目标是把“模型觉得应该有”变成“仓库证据证明真的有”。

### Boundary Guard

负责约束修改范围。生成并检查 allowed edit paths、denied edit paths、protected paths、generated files、lockfiles、migration files、CI / deploy / infra 配置。目标是防止 Agent 为了完成局部任务而扩大修改面。

### Regression Guard

负责防止旧问题被重新引入。维护 fix history、known issues、previous bug patterns、regression notes、anti-regression tests、fragile modules 和 historical failure cases。目标是让 Agent 在新任务中记住过去已经修复过的问题。

### Evidence Guard

负责验证测试证据是否可信。它不只看 Agent 的自然语言总结，而是检查实际执行过什么命令、exit code 是否为 0、测试输出是否存在、测试时间是否晚于最后一次编辑、测试时的 working tree hash 是否匹配，以及是否存在“测试后又改代码”的证据污染。

### Impact Guard

负责分析 diff 的工程影响范围。检查 changed files、affected modules、downstream dependencies、tests to run、review risk、unexpected file changes 和 scope expansion。目标是让 Agent 的修改不只是能跑，还能被 review 和合并。

### Loop Guard

负责控制 repair/finalize 闭环。它会根据策略、测试、影响分析和证据验证结果，决定下一步应该 finalize、rerun tests、repair code、repair tests、repack context、block、rollback 或 require human review。

更多实现细节见 [Guard Modules](docs/guard-modules.zh-CN.md)。

## 30 秒怎么用？

```bash
npx code-agent-plusplus build .
code-agent-plusplus plan "fix login timeout bug" .
code-agent-plusplus pack "fix login timeout bug" .
```

`code-agent-plusplus` 是唯一推荐的 CLI 命令；MCP server 使用 `code-agent-plusplus-mcp`。

本地源码运行：

```bash
npm install
npm run build
node dist/cli/index.js build .
```

常用闭环：

```bash
code-agent-plusplus run "fix login timeout bug" . --type bugfix
code-agent-plusplus orchestrate "fix login timeout bug" . --executor mock --max-loops 3 --checkpoint git-worktree --fail-on required
code-agent-plusplus agent run "fix login timeout bug" . --executor opencode --executor-command "opencode run --format json {prompt}"
code-agent-plusplus trace run fix-login-timeout-bug . --action run-test --command "npm test -- auth"
code-agent-plusplus policy . --base main --trace fix-login-timeout-bug --fail-on required
code-agent-plusplus impact . --base main
code-agent-plusplus verify --diff .
code-agent-plusplus freshness .
code-agent-plusplus drift .
```

## 当前状态

| 能力                                                 | 状态                   |
| ---------------------------------------------------- | ---------------------- |
| `build` / `AGENTS.md` / `.agent-context`             | implemented            |
| task plan / pack / run                               | implemented            |
| TypeScript Compiler API analyzer                     | implemented            |
| Python AST / optional Tree-sitter analyzer           | implemented            |
| token savings estimated + actual output tokens       | implemented            |
| readiness 分维度评分和硬上限                         | implemented            |
| Context / Boundary / Evidence / Impact / Loop Guards | implemented foundation |
| Hallucination Guard MVP                              | implemented foundation |
| Regression Guard                                     | planned                |
| multi-loop harness orchestrator / `orchestrate`      | implemented            |
| `agent run` executor wrapper                         | implemented            |
| mock executor                                        | implemented            |
| generic executor command adapter                     | implemented            |
| OpenCode 原生事件 normalizer                         | implemented foundation |
| MiMoCode 原生事件 normalizer                         | planned                |
| runtime state machine / `state.json`                 | implemented            |
| policy engine                                        | implemented            |
| context delta analysis                               | implemented            |
| tests / impact / verify                              | implemented            |
| freshness / drift / manifest                         | implemented            |
| MCP server scaffold                                  | implemented            |
| Agent Native Runtime loop tools                      | experimental           |
| benchmark harness                                    | experimental           |
| direct LightRAG server sync                          | planned                |

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
  hallucination/
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
code-agent-plusplus build [repo]
code-agent-plusplus plan "<task>" [repo]
code-agent-plusplus pack "<task>" [repo]
code-agent-plusplus run "<task>" [repo]
code-agent-plusplus orchestrate "<task>" [repo] --executor mock --max-loops 3 --checkpoint git-worktree --fail-on required
code-agent-plusplus agent run "<task>" [repo] --executor opencode --executor-command "opencode run --format json {prompt}"
code-agent-plusplus orchestrate "<task>" [repo] --executor opencode --executor-command "opencode run --format json {prompt}" --opencode-transcript .opencode/session.jsonl
code-agent-plusplus trace start "<task>" [repo] --agent codex
code-agent-plusplus trace run <trace-id> [repo] --action run-test --command "npm test -- auth"
code-agent-plusplus hallucination [repo] --trace <trace-id> --base main
code-agent-plusplus policy [repo] --base main --trace <trace-id> --fail-on required
code-agent-plusplus tests [repo] --diff --base main
code-agent-plusplus impact [repo] --base main
code-agent-plusplus verify --diff [repo]
code-agent-plusplus delta [repo] --base main
code-agent-plusplus evolve [repo] --base main
code-agent-plusplus loop "<task>" [repo] --phase after-edit
code-agent-plusplus validate [repo]
code-agent-plusplus validate-contracts [repo]
code-agent-plusplus freshness [repo]
code-agent-plusplus drift [repo]
code-agent-plusplus benchmark [benchmarkDir] --top-k 8
code-agent-plusplus retrieve "<task>" [repo] --provider hybrid
code-agent-plusplus-mcp
```

`policy --fail-on` 支持三档 CI 阈值：

- `forbidden`：只让 forbidden edits 失败，适合本地探索。
- `required`：forbidden + missing required actions 失败，是默认值，适合 PR 检查。
- `risk`：forbidden + required + risk warnings 都失败，适合 main 分支或发布门禁。

## Code Agent 集成

Code Agent++ 的定位是面向 code agent 的 External Agent Harness Control Plane。Codex / Claude Code / Cursor / OpenCode / MiMoCode 负责实际读代码、改代码和跑命令；Code Agent++ 负责任务上下文、编辑边界、执行证据和验证闭环。

```txt
Codex / Claude Code / Cursor / OpenCode / MiMoCode
  -> 负责读代码、改代码、跑命令、调用工具

Code Agent++
  -> 负责 context、boundary、trace、policy、impact、tests、verify、repair/finalize 决策
```

项目支持两种工作模式：

- Code Agent 主导，Code Agent++ 约束：Agent 调用 CLI / MCP 工具，但最终是否遵守 gate 由宿主 Agent 决定。
- Code Agent++ 主导，Code Agent 作为 executor：Code Agent++ 负责 plan / pack / execute / collect evidence / policy / verify / decision，外部 Agent 只作为可替换编码执行器。

详细入口隔离说明见 [docs/integration-modes.zh-CN.md](docs/integration-modes.zh-CN.md)。

## MCP / Agent Native Runtime

`code-agent-plusplus-mcp` 当前提供 stdio MCP server 和一组工具定义。它已经可以被支持 MCP 的客户端或自研 Agent 接入；Codex CLI、Claude Code、Cursor、OpenCode、MiMoCode、LibreChat、OpenHands 等端到端集成仍按客户端逐个验证。

```txt
code_agent_plusplus_start_loop
code_agent_plusplus_step
code_agent_plusplus_evaluate
code_agent_plusplus_repair
code_agent_plusplus_finalize
```

实验性 runtime loop 工具包括：`start_loop` 生成任务运行目录和 trace，`step` 记录编辑/测试/验证动作，`evaluate` 汇总 delta、loop、policy、verify 信号，`repair` 产出修复动作，`finalize` 在测试和 contract 证据齐全后收口。

## LLM 摘要配置

默认离线可用；需要 LLM 摘要时，本地创建 `code-agent-plusplus.local.yml`：

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
code-agent-plusplus build . --llm
```

## 文档

- [架构设计](docs/architecture.md)
- [Guard Modules](docs/guard-modules.zh-CN.md)
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
