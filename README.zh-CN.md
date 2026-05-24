# Repo-to-Agent-Context

中文 | [English](README.md)

把任意仓库压缩成结构化、紧凑、适合 Claude、Codex、Cursor 等 AI 编程 Agent 使用的上下文包。

第一版采用离线优先设计：扫描仓库、提取轻量代码结构、排序关键文件、构建依赖图，并输出 Markdown/JSON 上下文文件，不强依赖大模型。

## 快速开始

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
repo-context readiness [repo]
repo-context task "<task>" [repo]
repo-context diff [repo] --base main
repo-context update [repo] --since main
```

示例：

```bash
repo-context build . --target codex
repo-context build . --llm
repo-context build ../my-app --target all --token-budget 80000
repo-context explain src/server.ts .
repo-context explain auth .
repo-context readiness .
repo-context task "fix login timeout bug" .
repo-context diff . --base main
```

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

如果本地 key、URL、model 缺失，或者仍然是 `xx`，Repo-to-Agent-Context 会自动退回离线摘要。

## 架构

实现设计见 [docs/architecture.md](docs/architecture.md)，`AGENTS.md` 使用说明见 [docs/agents-md.zh-CN.md](docs/agents-md.zh-CN.md)，后续规划见 [docs/roadmap.md](docs/roadmap.md)。

## 配置

创建 `repo-context.config.yml`：

```yaml
target: codex
tokenBudget: 60000

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
```
