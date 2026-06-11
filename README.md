# Repo-to-Agent-Context

中文 | [English](README.en.md)

Repo-to-Agent-Context 是面向编码 Agent 的仓库上下文 Harness：它为具体任务生成最小、可验证、带证据链的上下文包，并通过测试/变更/依赖约束降低无关上下文、误改和回归风险。

第一版采用离线优先设计：扫描仓库、提取轻量代码结构、排序关键文件、构建依赖图，并输出 Markdown/JSON 上下文文件，不强依赖大模型。

<p align="center">
  <img src="./assets/context-pack-demo.svg" width="900" alt="Repo-to-Agent-Context 最终输出动画">
</p>

## 通过 AI Agent 使用

你也可以直接让 Codex、Claude Code、Cursor 或其他编程 Agent 代你运行这个项目。例如在 Codex 里可以直接说：

```txt
使用 https://github.com/whut09/Repo-to-Agent-Context 对 xxx 项目生成 AGENTS.md 和 .agent-context 上下文包。请先检查目标仓库结构，再按需安装或克隆该工具。请强制启用 LLM 摘要：在目标仓库创建或更新 repo-context.local.yml，不要提交该文件，优先使用当前 AI 工具环境里可用的模型 API 配置或我提供的 key/baseUrl/model；如果缺少配置，请先问我。然后运行 repo-context build <目标仓库> --target codex --llm，再运行 repo-context validate <目标仓库>，最后说明生成了哪些文件和 LLM 摘要模式是否成功。
```

把 `xxx 项目` 替换成本地路径、GitHub 仓库或当前工作区名称即可。如果只需要根目录说明，就说“生成 AGENTS.md”；如果需要完整上下文包，就说“生成 AGENTS.md 和 .agent-context”。

注意：当前 AI 工具必须能提供可调用的模型 API key、base URL 和 model，Repo-to-Agent-Context 才能真正执行 LLM 摘要。如果 Codex/Claude/Cursor 没有把自身模型暴露成 API，就让 Agent 先向你索取配置；真实 key 只写入 `repo-context.local.yml`。

## 快速开始

发布到 npm 后可直接运行：

```bash
npx repo-to-agent-context build ./path/to/repo
```

从源码运行：

```bash
npm install
npm run build
node dist/cli/index.js build ./path/to/repo
```

开发时可以直接运行：

```bash
npm run dev -- build ./path/to/repo
```

## 大模型会自动读取 AGENTS.md 吗？

要看你使用的编程工具，而不是大模型本身。`AGENTS.md` 是 Agent 客户端用于把仓库说明注入模型上下文的一种约定。

- 默认生成的 `AGENTS.md` 使用 `agents.mode: minimal`，只保留必须遵守的操作规则、入口文件、必要命令和 `.agent-context/` 索引。
- 更长的仓库摘要、模块图、依赖图、readiness 和任务包都放在 `.agent-context/`，避免根上下文文件过长。
- Codex：会。Codex 会在开始工作前读取 `AGENTS.md`，并可以把全局说明和项目级说明合并进上下文。
- Claude Code：不会直接读取 `AGENTS.md`。Claude Code 的项目说明文件是 `CLAUDE.md`。如果想复用本工具生成的说明，可以在仓库根目录创建 `CLAUDE.md`，内容写 `@AGENTS.md`，再追加 Claude 专用说明。
- Cursor：支持。把 `AGENTS.md` 放在项目根目录即可作为简单项目规则使用。如果需要按路径作用域、条件触发、多文件规则，建议使用 `.cursor/rules`。
- 其他工具：支持情况不同。如果工具不会自动加载 `AGENTS.md`，可以在提示词里手动引用或附上该文件。

详细用法见 [docs/agents-md.zh-CN.md](docs/agents-md.zh-CN.md)。

## 输出内容

```txt
AGENTS.md
.agent-context/
  repo-summary.md
  key-files.md
  module-map.md
  dependency-graph.md
  architecture.md
  onboarding.md
  readiness.md
  readiness.json
  token-savings.md
  token-savings.json
  tasks/
    bugfix-context.md
    feature-context.md
    refactor-context.md
    bugfix.json
    feature.json
    refactor.json
  rag/
    README.md
    manifest.json
    documents.jsonl
  evidence/
    file-evidence.json
  index/
    files.json
    symbols.json
    modules.json
    chunks.json
  graphs/
    dependencies.json
    dependencies.mmd
```

## 命令

```bash
repo-context init [repo]
repo-context build [repo]
repo-context graph [repo]
repo-context explain <path> [repo]
repo-context savings [repo]
repo-context readiness [repo]
repo-context validate [repo]
repo-context plan "<task>" [repo]
repo-context pack "<task>" [repo]
repo-context verify --diff [repo]
repo-context task "<task>" [repo]
repo-context task "<task>" --repo <repo...>
repo-context diff [repo] --base main
repo-context update [repo] --since main
repo-context rag export [repo]
```

示例：

```bash
repo-context build . --target codex
repo-context build . --target codex --tokenizer chars-approx
repo-context build . --target codex --model gpt-4.1
repo-context build . --llm
repo-context build ../my-app --target all --token-budget 80000
repo-context explain src/server.ts .
repo-context explain auth .
repo-context readiness .
repo-context validate .
repo-context savings . --token-budget 60000
repo-context savings . --actual --model gpt-4.1
repo-context plan "fix login timeout bug" . --type bugfix
repo-context pack "fix login timeout bug" . --type bugfix --token-budget 12000
repo-context verify --diff .
repo-context task "fix login timeout bug" . --type bugfix --token-budget 12000
repo-context task fix login timeout bug --repo "../my app/中文项目" --type bugfix
repo-context diff . --base main
repo-context rag export . --token-budget 60000
```

## Token Savings Report

每次构建都会生成 token 节省报告：

```txt
Original repo (estimated, chars_approx): 2,400,000 tokens
Estimated context pack (chars_approx): 42,000 tokens
Actual context pack (o200k_base, gpt-4.1): 41,832 tokens
Compression: 57x
Token budget: 60,000 (within budget)
```

报告会区分原始仓库估算、理论紧凑上下文估算，以及实际写出的 Markdown、Mermaid、RAG JSONL token 数。机器可读索引不会计入实际输出 token，具体范围会写在报告里。配置真实 tokenizer 时会用 `js-tiktoken` 计数，无法识别时回退到 `chars_approx`。

生成文件：

- `.agent-context/token-savings.md`
- `.agent-context/token-savings.json`

## Agent Readiness Score

readiness 报告是工程诊断分，不是 agent 成功率保证。它会把六类底层信号汇总成三层，并应用硬上限，避免轻易给满分：

```txt
Agent Readiness: B / 82

Dimensions:
- Operational: 90/100
- Context Quality: 75/100
- Agent Safety: 70/100

Hard caps:
- max 90 when no CI workflow is detected
- max 90 when token counting uses chars_approx instead of a model tokenizer
- max 85 when no high-confidence AST/compiler analyzer evidence exists
```

生成文件：

- `.agent-context/readiness.md`
- `.agent-context/readiness.json`

## 可选的大模型摘要

大模型是可选能力。CLI 默认离线可用。

提交到仓库的配置只应该保留占位符：

```yaml
llm:
  enabled: false
  provider: openai-compatible
  baseUrl: xx
  apiKey: xx
  model: xx
```

本地使用时，把 `repo-context.local.example.yml` 复制成 `repo-context.local.yml`，把真实 key 和 URL 写进去。`repo-context.local.yml` 已加入 `.gitignore`，不会被提交。

```yaml
llm:
  enabled: true
  provider: openai-compatible
  baseUrl: xx
  apiKey: xx
  model: xx
```

然后运行：

```bash
repo-context build . --llm
```

未启用 LLM 时，Repo-to-Agent-Context 使用离线摘要。启用后，如果 key、URL、model 缺失或仍然是 `xx`，会直接给出可操作的配置错误；运行时请求失败则退回离线摘要并记录原因。

运行 `repo-context validate .` 可以检查配置、生成 JSON、依赖边、分析置信度和 token 预算。

## 分析置信度与证据

- TypeScript/JavaScript 使用 TypeScript Compiler API 解析 `import type`、动态 `import()`、re-export、symbol、barrel export、`tsconfig` path alias、workspace package alias，以及常见 Next.js/Express/Fastify/Hono/NestJS route 模式。
- Python 在本机有 Python runtime 时优先使用 stdlib `ast`，失败时回退到轻量解析；支持解析 `from .models import User`、`from app.services.auth import login` 等本地绝对与相对 import。
- 不支持或 fallback 的分析会标记为低置信度。

每个索引文件包含 `analyzer`、`confidence`、`analysisStats`（parser、resolved/unresolved imports、symbols、routes）和带行号的 `evidence`。汇总证据输出到 `.agent-context/evidence/file-evidence.json`。

## 任务上下文包

任务工作流拆成 `plan`、`pack`、`verify` 三个阶段；旧的 `task` 命令仍保留为兼容入口。`task` 模式不是简单关键词文件列表，而是三阶段上下文打包器：

1. 直接检索：匹配 path、module、summary、exports、symbols、tests 和 docs。
2. 图扩展：加入 direct imports、direct importers、sibling tests、entrypoints、config files 和 owning module docs。
3. 预算装包：按 direct source、tests、dependency neighbors、config/docs、entrypoints 分桶放入 token budget。

```bash
repo-context plan "fix login timeout bug" . --type bugfix
repo-context pack "fix login timeout bug" . --type bugfix --token-budget 12000
repo-context verify --diff .
repo-context task "fix login timeout bug" . --type bugfix --token-budget 12000
repo-context task fix login timeout bug --repo "../my app/中文项目" --type bugfix
repo-context task "add SSO login" . --type feature
repo-context task "split auth module" . --type refactor
```

Markdown 输出会给 agent `Read First`、`Then Inspect If Needed`、`Why These Files`、`Budget Packing` 和 `Suggested Commands`。机器可读 task pack 会生成在 `.agent-context/tasks/*.json`。

## 可选 RAG：LightRAG

建议引入 RAG，但不要让 RAG 取代静态上下文包。推荐架构是：

```txt
先生成静态上下文包
  -> AGENTS.md、摘要、依赖图、关键文件
再接可选 RAG 适配层
  -> 导出 LightRAG 友好的 JSONL，后续再导入 LightRAG Server
```

Repo-to-Agent-Context 会生成：

- `.agent-context/rag/documents.jsonl`
- `.agent-context/rag/manifest.json`
- `.agent-context/rag/README.md`

LightRAG 保持可选，因为它通常需要单独的 Python/Server 环境，并且索引和查询阶段需要保持 embedding 配置一致。

当前版本会导出适合 LightRAG 摄入的文档，但尚未直接同步到 LightRAG Server。

## 架构

实现设计见 [docs/architecture.md](docs/architecture.md)，`AGENTS.md` 使用说明见 [docs/agents-md.zh-CN.md](docs/agents-md.zh-CN.md)，后续规划见 [docs/roadmap.md](docs/roadmap.md)。

## 配置

创建 `repo-context.config.yml`：

```yaml
target: codex
tokenBudget: 60000

tokenizer:
  mode: chars_approx
  # mode: cl100k_base
  # model: gpt-4.1

agents:
  mode: minimal # minimal | balanced | full
  maxTokens: 1200
  include:
    - commands
    - safety
    - entrypoints
    - contextLinks

include:
  - src/**
  - docs/**
  - package.json

exclude:
  - node_modules/**
  - dist/**
  - coverage/**

outputs:
  agents: true
  modules: true
  graph: true
  tasks: true
  readiness: true
  rag: true
```

`agents` 控制根目录 `AGENTS.md` 的信息密度。默认 `minimal` 会把根文件限制成最小操作约束，`balanced`/`full` 才会写入更多概览内容。`outputs` 开关控制可选生成物。关闭开关时，也会清理该分组中之前生成的文件。仓库摘要、关键文件、onboarding、token 节省报告和机器可读索引会始终生成。

## 开发

```bash
npm run build
npm run check
npm test
npm pack --dry-run
```
