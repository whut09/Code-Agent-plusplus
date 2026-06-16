# 两套集成模式与入口隔离

Code Agent++ 支持两套互不混用的流程。区别不是“能不能用 AI”，而是谁拥有最高控制权。

两套流程都会使用 Guard 模块作为可靠性层：

- Context Guard 准备任务级上下文。
- Hallucination Guard 检查确定性缺失文件、命令、symbol、dependency 和 config key。
- Boundary Guard 定义并检查编辑范围。
- Evidence Guard 验证命令和测试证据。
- Impact Guard 解释影响范围和 review 风险。
- Loop Guard 决定 finalize、repair、repack、block 或 require human review。

区别在于：这些 Guard 结果是宿主 Agent 的 advisory signals，还是由 Code Agent++ 拥有的 acceptance gates。

## 总览

| 模式                                        | 主控方                                             | 入口                                                                                                        | 是否执行 code agent                                       | 适合场景                                                                |
| ------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------- |
| Code Agent 主导，Code Agent++ 约束          | Codex / Claude Code / Cursor / OpenCode / MiMoCode | CLI `plan` / `pack` / `run` / `tests` / `impact` / `verify` / `policy`，或 MCP `code_agent_plusplus_*` 工具 | 否，由外部 code agent 自己执行                            | 日常 AI 编程、MCP demo、让已有 Agent 自己调用工具                       |
| Code Agent++ 主导，Code Agent 作为 executor | Code Agent++                                       | `code-agent-plusplus orchestrate` 或 `code-agent-plusplus agent run`                                        | 是，通过 `mock` 或 `--executor-command` 调用外部 executor | 需要可审计 gate、CI/自动化、希望本项目决定 finalize/repair/repack/block |

入口已经隔离：

- `code-agent-plusplus run` 只生成 `.agent-context/runs/<task-id>/`，不执行外部 Agent。
- `code-agent-plusplus orchestrate` 和 `code-agent-plusplus agent run` 才会进入 executor 流程。
- MCP 工具默认属于 Agent 主导模式；它们给外部 Agent 提供 plan/pack/retrieve/tests/impact/verify/evaluate/repair/finalize 能力，但是否遵守 gate 仍取决于宿主 Agent。

## 模式一：Code Agent 主导，Code Agent++ 约束

这个模式下，Codex / Claude Code / Cursor / OpenCode / MiMoCode 是主执行者。Code Agent++ 提供上下文、边界、Guard 发现和验证工具，但不拥有最终执行权。

```txt
用户任务
  -> code agent 调用 code-agent-plusplus plan / pack / run 或 MCP code_agent_plusplus_plan / pack
  -> code agent 读代码、改代码、跑命令
  -> code agent 调用 tests / impact / verify / policy / evaluate
  -> Code Agent++ 返回 Guard findings、policy、contracts、trace、verify 结果
```

推荐 CLI 入口：

```bash
code-agent-plusplus plan "fix login timeout bug" .
code-agent-plusplus pack "fix login timeout bug" .
code-agent-plusplus run "fix login timeout bug" . --type bugfix
code-agent-plusplus tests . --diff --base main
code-agent-plusplus impact . --base main
code-agent-plusplus verify --diff .
code-agent-plusplus policy . --base main --trace <trace-id> --fail-on required
```

MCP 入口：

```txt
code_agent_plusplus_plan
code_agent_plusplus_pack
code_agent_plusplus_retrieve
code_agent_plusplus_tests
code_agent_plusplus_impact
code_agent_plusplus_verify
code_agent_plusplus_evaluate
code_agent_plusplus_repair
code_agent_plusplus_finalize
```

产物位置：

- `.agent-context/tasks/<task-id>/`
- `.agent-context/runs/<task-id>/`
- `.agent-context/traces/<trace-id>.json`
- `.agent-context/loops/<task-id>/`，当使用 loop/evaluate 写入时

保证边界：

- 可以保证上下文、边界、测试建议、impact、policy 和 Guard 报告可用。
- Guard findings 是 advisory，除非宿主 Agent 选择遵守。
- 不能保证外部 code agent 一定按报告执行，因为最高控制权在外部 Agent。

## 模式二：Code Agent++ 主导，Code Agent 作为 executor

这个模式下，Code Agent++ 拥有流程编排和验收权。Code agent 只是可替换的编码执行器。

```txt
用户任务
  -> Code Agent++ plan / pack
  -> 选择 executor: Codex / Claude Code / Cursor / OpenCode / MiMoCode / mock
  -> executor 执行代码修改
  -> Code Agent++ 收集 diff / trace / test evidence
  -> Guard modules + policy / contracts / tests / impact / verify
  -> decision: finalize / repair / repack / block / rollback / require-human-review
```

推荐 CLI 入口：

```bash
code-agent-plusplus orchestrate "fix login timeout bug" . --executor mock --max-loops 3 --checkpoint git-worktree --fail-on required
code-agent-plusplus orchestrate "fix login timeout bug" . --executor opencode --executor-command "opencode run --format json {prompt}" --opencode-transcript .opencode/session.jsonl --max-loops 3 --checkpoint git-worktree --fail-on required
code-agent-plusplus agent run "fix login timeout bug" . --executor mimocode --executor-command "mimocode run {prompt}" --fail-on required
```

对 OpenCode，Code Agent++ 会把 `opencode run --format json` 的 stdout、可选的 `--opencode-transcript` 文件，以及普通 stdout/stderr fallback 统一归一化为同一套 trace event model。

`--executor-command` 支持占位符：

- `{prompt}`：Code Agent++ 写出的 executor prompt 文件路径。
- `{task}`：原始任务描述。
- `{repo}`：仓库根目录。
- `{runDir}`：当前轮次目录，例如 `.agent-context/runs/<task-id>/iterations/001/`。
- `{agent}`：传入的 executor-specific agent/profile 名称。

产物位置：

- `.agent-context/runs/<task-id>/`
- `.agent-context/runs/<task-id>/iterations/<nnn>/prompt.md`
- `.agent-context/runs/<task-id>/iterations/<nnn>/iteration.json` - 当前轮次目录的稳定 schema 入口
- `.agent-context/runs/<task-id>/iterations/<nnn>/executor.result.json` - executor 命令、exit code、hash、变更文件和事件摘要
- `.agent-context/runs/<task-id>/iterations/<nnn>/executor.events.jsonl` - executor 归一化后的 `AgentEvent` JSONL
- `.agent-context/runs/<task-id>/iterations/<nnn>/diff.patch`
- `.agent-context/runs/<task-id>/iterations/<nnn>/trace.json` - 执行 trace 的 schema wrapper 和可信证据摘要
- `.agent-context/runs/<task-id>/iterations/<nnn>/guard.findings.json` - policy、hallucination、regression checks 的统一 `GuardFinding` 记录
- `.agent-context/runs/<task-id>/iterations/<nnn>/guard.gates.json` - orchestrator decision 消费的阻断型 Guard gates 和 required actions
- `.agent-context/runs/<task-id>/iterations/<nnn>/policy.json`
- `.agent-context/runs/<task-id>/iterations/<nnn>/verify.json`
- `.agent-context/runs/<task-id>/iterations/<nnn>/loop.json`
- `.agent-context/runs/<task-id>/iterations/<nnn>/decision.json` - 明确 decision、priority、confidence、blocking 状态和输入信号
- `.agent-context/traces/<task-id>.json`
- `.agent-context/orchestrator/<task-id>/orchestrator.md`
- `.agent-context/orchestrator/<task-id>/orchestrator.json`
- `.agent-context/orchestrator/<task-id>/policy.md`
- `.agent-context/orchestrator/<task-id>/impact.md`
- `.agent-context/orchestrator/<task-id>/verify.md`
- `.agent-context/orchestrator/<task-id>/loop.md`

保证边界：

- 可以保证每次执行后都收集 diff、trace 和 executor 事件。
- 可以保证通过 Guard findings、policy / contracts / tests / impact / verify 生成统一 gate。
- 可以保证输出明确 decision：`finalize`、`repair`、`repack`、`block`、`rollback` 或 `require-human-review`。
- `--checkpoint git-worktree` 会在系统临时目录创建 git worktree sandbox，让 executor 在隔离 checkout 中运行，把每轮 patch 导出回 `.agent-context/runs/<task-id>/iterations/<nnn>/`，然后 discard worktree。Code Agent++ 会记录 rollback 决策和 checkpoint 证据，但不会在用户工作区自动执行破坏性回滚命令。
- 不能保证外部 executor 本身一定能正确改代码；它保证的是执行后的验收和下一步决策可审计。

## 选择建议

- 想让现有 Codex / Claude Code / Cursor / OpenCode / MiMoCode 自然调用工具：用模式一。
- 想让 Code Agent++ 掌握验收权，并把 code agent 当成编码工具：用模式二。
- 想做 CI 或自动化 demo：先用模式二的 `--executor mock` 跑通闭环，再接 OpenCode / MiMoCode 的真实命令。
