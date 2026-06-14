# 使用 AGENTS.md

中文 | [English](agents-md.md)

`AGENTS.md` 是给 AI 编程 Agent 阅读的普通 Markdown 指南。Code Agent++ 默认把它生成为很短的操作约束文件，只放必须遵守的规则、入口、命令和生成上下文索引。

Code Agent++ 会生成根目录 `AGENTS.md`，并把更详细的上下文放到 `.agent-context/`。

根目录说明现在有明确分层：

- `AGENTS.manual.md`：人工维护的环境、部署、运行手册、恢复步骤
- `.agent-context/AGENTS.generated.md`：自动生成的代码上下文说明
- `AGENTS.md`：最终组合后的入口文件，供 Agent 读取

默认配置：

```yaml
agents:
  mode: minimal # minimal | balanced | full
  maxTokens: 1200
  manualSources:
    - AGENTS.manual.md
  include:
    - commands
    - safety
    - entrypoints
    - contextLinks
```

推荐保持 `minimal`。根文件越长，不一定越能提升 agent 成功率；复杂摘要、模块图、readiness 和任务包应该通过 `.agent-context/` 按需读取。

不要手工修改最终的 `AGENTS.md`。应当直接修改 `AGENTS.manual.md`，或 `agents.manualSources` 里配置的其他人工源文件。

## Context Layers

Generated context is split into L0-L3 so agents do not load the full `.agent-context/` directory by default:

- L0: `AGENTS.md`, the shortest operating rules and default workflow, always loaded.
- L1: `.agent-context/repo-summary.md`, `.agent-context/onboarding.md`, and `.agent-context/context-layers.md`, loaded when a new task starts.
- L2: `.agent-context/tasks/<task>/`, loaded only for the concrete task.
- L3: `.agent-context/key-files.md`, `index/`, `evidence/`, `graphs/`, and `rag/`, loaded on demand for deeper analysis, symbol lookup, or evidence tracing.

`AGENTS.md` states the default workflow explicitly: read only `AGENTS.md` first; for a concrete task, run `code-agent-plusplus plan` or inspect the task pack; do not load the full `.agent-context/` directory by default; prefer source files over generated summaries for behavior decisions. Manual environment and deployment notes stay in `AGENTS.manual.md` and are loaded only for environment, deployment, configuration, or operations tasks.

## 旧项目迁移

如果仓库里已经存在手写的旧 `AGENTS.md`，第一次生成时会先把下面这些章节迁移到 `AGENTS.manual.md`，再组合新的根文件：

- 环境依赖版本
- 安装步骤
- `.env/配置文件要求`
- `Docker / Compose / PM2 / systemd 部署方式`
- 启动命令
- 数据目录与日志目录
- 常见故障与恢复步骤

如果没有匹配到这些标题，工具会退回为把整个旧 `AGENTS.md` 迁移进 `AGENTS.manual.md`。

## 让 AI Agent 帮你生成

你不一定要手动运行 CLI，也可以直接让编程 Agent 使用 [whut09/Code-Agent-plusplus](https://github.com/whut09/Code-Agent-plusplus) 去处理另一个仓库：

```txt
使用 https://github.com/whut09/Code-Agent-plusplus 对 xxx 项目生成 AGENTS.md 和 .agent-context 上下文包。请先检查目标仓库结构，再按需安装或克隆该工具。请强制启用 LLM 摘要：在目标仓库创建或更新 code-agent-plusplus.local.yml，不要提交该文件，优先使用当前 AI 工具环境里可用的模型 API 配置或我提供的 key/baseUrl/model；如果缺少配置，请先问我。然后运行 code-agent-plusplus build <目标仓库> --target codex --llm，再运行 code-agent-plusplus validate <目标仓库>，最后说明生成了哪些文件和 LLM 摘要模式是否成功。
```

把 `xxx 项目` 替换成本地路径、GitHub 仓库或当前工作区名称即可。这种方式在 Codex 里尤其自然，因为 Codex 可以在工作区运行命令，并在后续修改代码前读取生成的 `AGENTS.md`。

本地 LLM 配置应该由 Agent 代用户处理。真实凭证只写入 `code-agent-plusplus.local.yml`，该文件已被 git 忽略。如果当前 AI 工具没有把自身模型暴露成可调用 API，Agent 应该先向用户索取 provider、base URL、model 和 key，再运行 `--llm`。

## 大模型会自动读取吗？

大模型本身不会凭空读取本地文件。是否自动读取，取决于你使用的 Agent 客户端。客户端会发现说明文件，并把内容注入模型上下文。

## Codex

Codex 原生支持 `AGENTS.md`。根据 Codex 文档，Codex 会在开始工作前读取 `AGENTS.md` 文件。

推荐用法：

```bash
code-agent-plusplus build . --target codex
codex "Summarize the current repository instructions."
```

常见位置：

- `~/.codex/AGENTS.md`：个人全局说明
- 仓库根目录 `AGENTS.md`：项目级说明
- 子目录里的 `AGENTS.md` 或 `AGENTS.override.md`：更具体的目录说明

Codex 会从更宽泛的范围到更具体的范围合并说明。建议根目录文件保持简洁，把深层细节链接到 `.agent-context/`。

## Claude Code

Claude Code 的主要项目说明文件是 `CLAUDE.md`，不是 `AGENTS.md`。

如果想复用本工具生成的 `AGENTS.md`，可以在仓库根目录创建 `CLAUDE.md`：

```md
@AGENTS.md

## Claude Code

- 需要更深仓库上下文时，读取 `.agent-context/` 下的文件。
- 完成代码修改前，优先运行检测到的测试命令。
```

这样可以让 `AGENTS.md` 成为跨工具共享说明，同时保留 Claude 专用补充。

## Cursor

Cursor 支持把项目根目录的 `AGENTS.md` 作为简单 Markdown 指令文件，适合项目级通用规则。

如果需要以下能力，建议使用 `.cursor/rules`：

- 按路径作用域生效
- 条件触发
- 多个规则文件
- Cursor 专用元数据

## 其他工具

不同工具支持情况不同。如果工具不会自动加载 `AGENTS.md`，可以在提示词里明确引用：

```txt
开始修改前，请先阅读 AGENTS.md 和 .agent-context/ 下的相关文件。
```

## AGENTS.md 里应该写什么？

适合写：

- 必须遵守的编辑规则和安全规则
- 必须运行或优先运行的检测命令
- 项目入口或少量最高价值锚点文件
- 指向 `.agent-context/` 的深层上下文链接
- 环境和部署说明，放在 `AGENTS.manual.md`

不建议写：

- 密钥或凭证
- 很长的生成内容堆叠
- “写好代码”这类模糊要求
- 整个仓库源码的复制粘贴
- 完整模块摘要、长依赖图或大段 onboarding 文档
- 手工直接修改最终组合出来的 `AGENTS.md`

## 参考资料

- [OpenAI Codex: Custom instructions with AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- [Claude Code: How Claude remembers your project](https://code.claude.com/docs/en/memory)
- [Cursor Docs: Rules and AGENTS.md](https://docs.cursor.com/en/context)
