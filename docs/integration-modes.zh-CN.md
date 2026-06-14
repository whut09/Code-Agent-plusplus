# 两套集成模式与入口隔离

Code Agent++ 支持两套互不混用的流程。区别不是“能不能用 AI”，而是谁拥有最高控制权。

## 结论

| 模式                                        | 主控方                                             | 入口                                                                                                       | 是否执行 code agent                                       | 适合场景                                                                |
| ------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------- |
| Code Agent 主导，Code Agent++ 约束          | Codex / Claude Code / Cursor / OpenCode / MiMoCode | CLI 的 `plan` / `pack` / `run` / `tests` / `impact` / `verify` / `policy`，或 MCP 的 `repo_context_*` 工具 | 否，由外部 code agent 自己执行                            | 日常 AI 编程、MCP demo、让已有 Agent 自己调用工具                       |
| Code Agent++ 主导，Code Agent 作为 executor | Code Agent++                                       | `repo-context orchestrate` 或 `repo-context agent run`                                                     | 是，通过 `mock` 或 `--executor-command` 调用外部 executor | 需要可审计 gate、CI/自动化、希望本项目决定 finalize/repair/repack/block |

入口已经隔离：

- `repo-context run` 只生成 `.agent-context/runs/<task-id>/`，不执行外部 Agent。
- `repo-context orchestrate` 和 `repo-context agent run` 才会进入 executor 流程。
- MCP 工具默认属于 Agent 主导模式；它们给外部 Agent 提供 plan/pack/retrieve/tests/impact/verify/evaluate/repair/finalize 能力，但是否遵守 gate 仍取决于宿主 Agent。

## 模式一：Code Agent 主导，Code Agent++ 约束

这个模式下，Codex / Claude Code / Cursor / OpenCode / MiMoCode 是主执行者。Code Agent++ 提供上下文、边界和验证工具，但不拥有最终执行权。

```txt
用户任务
  -> code agent 调用 repo-context plan / pack / run 或 MCP repo_context_plan / pack
  -> code agent 读代码、改代码、跑命令
  -> code agent 调用 tests / impact / verify / policy / evaluate
  -> Code Agent++ 返回约束、证据和建议
```

推荐入口：

```bash
repo-context plan "fix login timeout bug" .
repo-context pack "fix login timeout bug" .
repo-context run "fix login timeout bug" . --type bugfix
repo-context tests . --diff --base main
repo-context impact . --base main
repo-context verify --diff .
repo-context policy . --base main --trace <trace-id> --fail-on required
```

MCP 入口：

```txt
repo_context_plan
repo_context_pack
repo_context_retrieve
repo_context_tests
repo_context_impact
repo_context_verify
repo_context_evaluate
repo_context_repair
repo_context_finalize
```

产物位置：

- `.agent-context/tasks/<task-id>/`
- `.agent-context/runs/<task-id>/`
- `.agent-context/traces/<trace-id>.json`
- `.agent-context/loops/<task-id>/`，当使用 loop/evaluate 写入时

这个模式的保证边界：

- 可以保证上下文、边界、测试建议、impact 和 policy 报告可用。
- 不能保证外部 code agent 一定按报告执行，因为最高控制权在外部 agent。

## 模式二：Code Agent++ 主导，Code Agent 作为 executor

这个模式下，Code Agent++ 拥有流程编排和验收权。Code agent 只是可替换的编码执行器。

```txt
用户任务
  -> Code Agent++ plan / pack
  -> 选择 executor: Codex / Claude Code / Cursor / OpenCode / MiMoCode / mock
  -> executor 执行代码修改
  -> Code Agent++ 收集 diff / trace / test evidence
  -> policy / contracts / tests / impact / verify
  -> decision: finalize / repair / repack / block / require-human-review
```

推荐入口：

```bash
repo-context orchestrate "fix login timeout bug" . --executor mock --fail-on required
repo-context orchestrate "fix login timeout bug" . --executor opencode --executor-command "opencode run --format json {prompt}" --fail-on required
repo-context agent run "fix login timeout bug" . --executor mimocode --executor-command "mimocode run {prompt}" --fail-on required
```

`--executor-command` 支持占位符：

- `{prompt}`：Code Agent++ 写出的 executor prompt 文件路径。
- `{task}`：原始任务描述。
- `{repo}`：仓库根目录。
- `{runDir}`：`.agent-context/runs/<task-id>/` 目录。
- `{agent}`：传入的 executor-specific agent/profile 名称。

产物位置：

- `.agent-context/runs/<task-id>/`
- `.agent-context/traces/<task-id>.json`
- `.agent-context/orchestrator/<task-id>/orchestrator.md`
- `.agent-context/orchestrator/<task-id>/orchestrator.json`
- `.agent-context/orchestrator/<task-id>/policy.md`
- `.agent-context/orchestrator/<task-id>/impact.md`
- `.agent-context/orchestrator/<task-id>/verify.md`
- `.agent-context/orchestrator/<task-id>/loop.md`

这个模式的保证边界：

- 可以保证每次执行后都会收集 diff、trace 和 executor 事件。
- 可以保证通过 policy / contracts / tests / impact / verify 生成统一 gate。
- 可以保证输出明确 decision：`finalize`、`repair`、`repack`、`block` 或 `require-human-review`。
- 不能保证外部 executor 本身一定能正确改代码；它保证的是执行后的验收和下一步决策可审计。

## 选择建议

- 想让现有 Codex / Claude Code / Cursor / OpenCode / MiMoCode 自然调用工具：用模式一。
- 想让 Code Agent++ 掌握验收权，并把 code agent 当成编码工具：用模式二。
- 想做 CI 或自动化 demo：先用模式二的 `--executor mock` 跑通闭环，再接 OpenCode / MiMoCode 的真实命令。
