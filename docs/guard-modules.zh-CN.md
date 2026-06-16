# Guard Modules

Code Agent++ 的 Guard 模块是面向 Code Agent 失败模式设计的外挂式增强组件。每个 Guard 都对应一类常见工程问题，并把原本写在 prompt 里的要求沉淀成可生成、可检查、可记录、可审计的 Harness 能力。

## 总览

| Guard                               | 解决的问题                        | 当前状态               |
| ----------------------------------- | --------------------------------- | ---------------------- |
| Context Guard                       | 上下文不准、乱找文件、token 浪费  | implemented foundation |
| Hallucination Guard                 | 幻觉 API、命令、配置、项目约定    | implemented foundation |
| Boundary Guard                      | 修改范围失控、误改 protected path | implemented foundation |
| Regression Guard                    | 重新引入历史 bug                  | implemented foundation |
| Evidence Guard                      | 测试证据不可信、测试后继续改代码  | implemented foundation |
| Impact Guard                        | 影响范围不可见、review 风险不清楚 | implemented foundation |
| Loop Guard                          | repair loop 无法收口              | implemented foundation |
| Executor Adapter + Trace Normalizer | 多 Agent 输出格式不统一           | partial                |

## Guard Gates

每个 Guard 现在都会通过 `.agent-context/runs/<task-id>/iterations/<nnn>/guard.gates.json` 输出明确 gate。`guard.findings.json` 记录统一证据，`guard.gates.json` 决定这些证据是否阻断当前 loop，以及 orchestrator 应该采取什么动作。

| Guard               | 阻断条件                                                                                      | Gate 动作                                |
| ------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Context Guard       | context stale；task pack 超预算；需要 replan 或 expand context                                | `repack` / `expand-context`              |
| Boundary Guard      | forbidden path 变更；generated source/build output 变更；lockfile/CI/migration/protected 违规 | git-worktree 模式 `rollback`，否则 block |
| Boundary Guard      | `.agent-context` 生成物被改；diff 太大                                                        | `human-review`                           |
| Evidence Guard      | 最后一次 edit 后没有测试命令；测试 exit code 非 0；测试输出含失败；working tree hash 不匹配   | `run-tests` / `repair`                   |
| Hallucination Guard | 不存在的 script、file、symbol、dependency、config key、env reference                          | `repair` / `block`                       |
| Regression Guard    | fragile module 或历史 bug pattern 命中，但缺少 required regression test evidence              | `run-regression-tests` / `human-review`  |

orchestrator 会在 finalize 之前先消费这些 gates。blocking gate 会把下一步变成 `repack`、`repair`、`rollback`、`block` 或 `require-human-review`；gate 通过后才允许继续收口。

## Context Guard

Context Guard 负责任务级上下文增强。它不把整个仓库塞给 Agent，而是先扫描、索引、构图、排序，再按任务生成最小上下文包。

输入：

- repository files
- config
- package scripts
- dependency graph
- task text
- git diff

输出：

- `AGENTS.md`
- `.agent-context/repo-summary.md`
- `.agent-context/key-files.md`
- `.agent-context/module-map.md`
- `.agent-context/tasks/`
- `.agent-context/runs/<task-id>/pack.md`
- future: `CLAUDE.md`、Cursor rules、OpenCode instructions

目标：

- 减少 Agent 盲搜文件。
- 减少 token 浪费。
- 让 Agent 先读正确入口、模块、测试和约束。

## Hallucination Guard

Hallucination Guard 负责降低工程幻觉。当前 MVP 不做复杂语义判断，只检查仓库证据能确定验证的 5 类问题。

MVP 检查：

- 不存在的文件引用。
- 不存在的函数、类、类型或 export。
- 不存在的 CLI 命令、npm script 或测试命令。
- 不存在的配置项和环境变量。
- 未声明的依赖包。

输入：

- execution trace / normalized executor events
- git diff and changed files
- package scripts and dependency declarations
- env examples and config files
- symbol/export index

输出：

- `.agent-context/hallucination/<task-id>.json`
- `.agent-context/runs/<task-id>/hallucination.md`
- hallucination findings
- evidence references
- repair suggestions
- 需要先验证是否存在的待确认项

Policy 映射：

- missing command -> required failure
- missing symbol in modified code -> forbidden failure
- missing local import file in modified code -> forbidden failure
- missing dependency -> risk warning
- missing config key -> risk warning
- missing file mentioned by transcript or diff explanation -> warning

目标：

- 把“模型觉得应该有”改成“仓库证据证明真的有”。
- 在 Agent 执行后发现确定性的幻觉引用。

## Boundary Guard

Boundary Guard 负责约束修改范围，防止局部任务变成大面积改动。

输入：

- task pack
- file classification
- contracts
- protected path rules
- changed files

输出：

- allowed edit paths
- denied edit paths
- protected path findings
- generated / lockfile / migration / CI / deploy risk findings

当前落点：

- `.agent-context/contracts/safety.contract.json`
- `.agent-context/contracts/module-boundaries.json`
- `code-agent-plusplus validate-contracts`
- `code-agent-plusplus policy`
- `.agent-context/runs/<task-id>/edit-boundary.md`

目标：

- 防止误改 generated files、lockfiles、migrations、CI、deploy、infra、env 文件。
- 让 scope expansion 在 review 中可见。

## Regression Guard

Regression Guard 负责防止旧问题被重新引入。当前 MVP 使用可维护的结构化 memory，而不是一开始就尝试自动理解所有历史 bug。

Memory 文件：

- `.agent-context/regression/known-issues.json`
- `.agent-context/regression/fix-history.json`
- `.agent-context/regression/fragile-modules.json`
- `.agent-context/regression/anti-regression-tests.json`

示例：

```json
{
  "id": "auth-timeout-regression-001",
  "module": "auth",
  "files": ["src/auth/session.ts"],
  "pattern": "session timeout must use server time, not client Date.now",
  "requiredTests": ["npm test -- auth"],
  "riskTriggers": ["timeout", "session", "ttl", "expire"],
  "lastFixedIn": "PR #123"
}
```

当前输出：

- anti-regression notes
- required regression tests
- historical-risk findings
- repair suggestions

当前落点：

- `code-agent-plusplus regression`
- task pack anti-regression notes 和 required tests
- `.agent-context/runs/<task-id>/regression.md`
- `.agent-context/regression/<task-id>.json`
- policy 在 matched regression memory 缺少 required test evidence 时产生 required failure

目标：

- 让 Agent 记住已经修过的问题。
- 对高风险模块要求更强验证。

## Evidence Guard

Evidence Guard 负责验证测试和命令证据是否可信。它不只看自然语言总结，而是检查结构化 trace。

检查：

- 实际执行过什么命令。
- exit code 是否为 0。
- stdout/stderr hash 是否存在。
- command evidence 是 harness 捕获、外部 agent 捕获，还是手动声明。
- working tree hash 是否匹配当前 diff。
- 测试是否发生在最后一次编辑之后。

当前落点：

- `.agent-context/traces/<task-id>.json`
- `code-agent-plusplus trace start`
- `code-agent-plusplus trace add`
- `code-agent-plusplus trace run`
- `code-agent-plusplus policy`
- `code-agent-plusplus loop`

目标：

- 把“测试通过”从一句话变成可审计证据。
- 防止“先测过，后改代码”的证据污染。

## Impact Guard

Impact Guard 负责分析 diff 的工程影响范围。

输入：

- dependency graph
- changed files
- related tests
- key file ranking

输出：

- direct dependents
- transitive dependents
- affected modules
- risk level
- recommended verification commands

当前落点：

- `code-agent-plusplus impact`
- `code-agent-plusplus tests`
- `code-agent-plusplus verify`
- `.agent-context/runs/<task-id>/impact.md`
- `.agent-context/runs/<task-id>/verify.md`

目标：

- 让 review 知道改动影响了谁。
- 让 Agent 知道应该跑哪些最小测试和回归测试。

## Loop Guard

Loop Guard 控制 repair/finalize 闭环。它不直接相信 Agent 说“完成了”，而是根据状态、证据、策略和影响分析决定下一步。

输入：

- runtime state
- task pack
- freshness / drift
- policy report
- impact report
- trace evidence
- test recommendations

输出：

- `start-agent`
- `rebuild-context`
- `replan`
- `expand-context`
- `repair-contracts`
- `add-or-update-tests`
- `run-tests`
- `ready-for-review`

当前落点：

- `code-agent-plusplus loop`
- `code-agent-plusplus orchestrate`
- `.agent-context/loops/<task-id>/`
- `.agent-context/runs/<task-id>/state.json`
- `.agent-context/orchestrator/<task-id>/`

目标：

- 防止过早 finalize。
- 防止无意义 repair loop。
- 让每一轮下一步动作有证据、有优先级、有阻塞原因。

## Executor Adapter + Trace Normalizer

Executor Adapter 让 Code Agent++ 可以把 OpenCode、Codex CLI、Claude Code、Cursor、MiMoCode 等工具作为可替换执行器。

当前落点：

- `code-agent-plusplus agent run`
- `code-agent-plusplus orchestrate`
- `--executor mock|opencode|mimocode|codex|claude-code|cursor`
- `--executor-command "<command with {prompt}>"`
- `--opencode-transcript <path>`

事件归一化：

- OpenCode JSON stdout / transcript / fallback normalizer（已实现基础版）
- MiMoCode event normalizer（planned）
- Codex JSONL normalizer（planned）
- Claude Code transcript normalizer（planned）

目标：

- 让不同 Code Agent 的执行事件变成统一 trace schema。
- 让 Policy / Evidence / Loop Guards 不依赖某一个 Agent 的私有格式。
