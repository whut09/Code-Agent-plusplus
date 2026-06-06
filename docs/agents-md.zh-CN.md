# 使用 AGENTS.md

中文 | [English](agents-md.md)

`AGENTS.md` 是给 AI 编程 Agent 阅读的普通 Markdown 指南，通常包含仓库结构、运行命令、测试命令、编码约定、安全注意事项，以及生成上下文文件的链接。

Repo-to-Agent-Context 会生成根目录 `AGENTS.md`，并把更详细的上下文放到 `.agent-context/`。

## 让 AI Agent 帮你生成

你不一定要手动运行 CLI，也可以直接让编程 Agent 使用 [whut09/Repo-to-Agent-Context](https://github.com/whut09/Repo-to-Agent-Context) 去处理另一个仓库：

```txt
使用 https://github.com/whut09/Repo-to-Agent-Context 对 xxx 项目生成 AGENTS.md 和 .agent-context 上下文包。请先检查目标仓库结构，再按需安装或克隆该工具，运行生成命令，最后说明生成了哪些文件。
```

把 `xxx 项目` 替换成本地路径、GitHub 仓库或当前工作区名称即可。这种方式在 Codex 里尤其自然，因为 Codex 可以在工作区运行命令，并在后续修改代码前读取生成的 `AGENTS.md`。

## 大模型会自动读取吗？

大模型本身不会凭空读取本地文件。是否自动读取，取决于你使用的 Agent 客户端。客户端会发现说明文件，并把内容注入模型上下文。

## Codex

Codex 原生支持 `AGENTS.md`。根据 Codex 文档，Codex 会在开始工作前读取 `AGENTS.md` 文件。

推荐用法：

```bash
repo-context build . --target codex
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

- 如何运行、测试、构建项目
- 关键文件和模块
- 架构约束
- 代码风格和命名约定
- 安全规则、生成文件警告、依赖规则
- 指向更详细上下文文件的链接

不建议写：

- 密钥或凭证
- 很长的生成内容堆叠
- “写好代码”这类模糊要求
- 整个仓库源码的复制粘贴

## 参考资料

- [OpenAI Codex: Custom instructions with AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- [Claude Code: How Claude remembers your project](https://code.claude.com/docs/en/memory)
- [Cursor Docs: Rules and AGENTS.md](https://docs.cursor.com/en/context)
