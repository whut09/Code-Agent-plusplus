# Guard Modules

Code Agent++ 的 Guard 模块是面向 Code Agent 失败模式设计的外挂式增强组件。每个 Guard 都对应一类常见工程问题，并把原本写在 prompt 里的要求沉淀成可生成、可检查、可记录、可审计的 Harness 能力。

## 总览

| Guard                               | 解决的问题                        | 当前状态               |
| ----------------------------------- | --------------------------------- | ---------------------- |
| Context Guard                       | 上下文不准、乱找文件、token 浪费  | implemented foundation |
| Hallucination Guard                 | 幻觉 API、命令、配置、项目约定    | planned                |
| Boundary Guard                      | 修改范围失控、误改 protected path | implemented foundation |
| Regression Guard                    | 重新引入历史 bug                  | planned                |
| Evidence Guard                      | 测试证据不可信、测试后继续改代码  | implemented foundation |
| Impact Guard                        | 影响范围不可见、review 风险不清楚 | implemented foundation |
| Loop Guard                          | repair loop 无法收口              | implemented foundation |
| Executor Adapter + Trace Normalizer | 多 Agent 输出格式不统一           | partial                |

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

Hallucination Guard 负责降低工程幻觉。它检查 Agent 是否引用了仓库证据中不存在的对象。

需要检查：

- 不存在的文件。
- 不存在的函数、类、类型、export。
- 不存在的 CLI 命令、npm scripts、测试命令。
- 不存在的配置项和环境变量。
- 不存在的依赖包。
- 与项目实际约定冲突的 API 或路径。

计划输出：

- hallucination findings
- evidence references
- repair suggestions
- “需要先验证是否存在”的待确认项

目标：

- 把“模型觉得应该有”改成“仓库证据证明真的有”。
- 在 Agent 执行前和执行后都能发现幻觉引用。

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

- 防止 Agent 误改 generated、lockfile、migration、CI、deploy、infra、env 等敏感面。
- 让 review 看到修改是否超出任务范围。

## Regression Guard

Regression Guard 负责防止旧问题被重新引入。它把历史修复记录、known issues 和脆弱模块注入任务上下文，并在验证阶段检查是否踩回旧坑。

计划输入：

- fix history
- issue / PR notes
- previous bug patterns
- regression tests
- fragile modules
- known failure cases

计划输出：

- anti-regression notes
- required regression tests
- historical-risk findings
- repair suggestions

目标：

- 让 Agent 在新任务里记住过去已经修复过的问题。
- 对高风险模块自动要求更强验证。

## Evidence Guard

Evidence Guard 负责验证测试和命令证据是否可信。它不只看自然语言总结，而是检查结构化 trace。

检查项：

- 实际执行过什么命令。
- exit code 是否为 0。
- stdout/stderr 是否有记录或 hash。
- startedAt / finishedAt 是否晚于最后一次编辑。
- workingTreeHashBefore / workingTreeHashAfter 是否与当前 diff 匹配。
- 是否存在“测试后又改代码”的证据污染。

当前落点：

- `.agent-context/traces/<trace-id>.json`
- `code-agent-plusplus trace run`
- `code-agent-plusplus policy --trace <trace-id>`
- `code-agent-plusplus loop --trace <trace-id>`

目标：

- 让“测试通过”从一句话变成可审计证据。
- 防止 stale evidence 被拿来 finalize。

## Impact Guard

Impact Guard 负责分析 diff 的工程影响范围。

输入：

- changed files
- dependency graph
- module map
- related tests
- key file ranking

输出：

- directly affected files
- transitive dependents
- affected modules
- related tests
- risk level
- required verification

当前落点：

- `code-agent-plusplus impact`
- `code-agent-plusplus tests`
- `code-agent-plusplus verify`
- `.agent-context/runs/<task-id>/impact.md`

目标：

- 让 Agent 和 reviewer 知道这次改动影响了谁。
- 让测试推荐从“附近测试”升级为“依赖图影响测试”。

## Loop Guard

Loop Guard 控制 repair/finalize 闭环。它不直接相信 Agent 说“完成了”，而是根据状态、证据、策略和影响分析决定下一步。

决策：

- finalize
- rerun tests
- repair code
- repair tests
- repack context
- block
- rollback
- require human review

当前落点：

- `code-agent-plusplus loop`
- `code-agent-plusplus orchestrate`
- `.agent-context/loops/`
- `.agent-context/runs/<task-id>/state.json`

目标：

- 防止 Agent 无限修复。
- 防止 Agent 过早收口。
- 让每轮下一步动作可解释、可审计、可重复。

## Executor Adapter + Trace Normalizer

Executor Adapter 让 Code Agent++ 可以把 OpenCode、Codex CLI、Claude Code、Cursor、MiMoCode 等工具作为可替换执行器。

当前能力：

- `mock` executor
- generic `--executor-command`
- changed file collection
- trace and verification artifacts

计划能力：

- OpenCode JSON stdout / transcript / fallback normalizer（已实现基础版）
- MiMoCode event normalizer
- Codex JSONL normalizer
- Claude Code transcript normalizer
- unified execution trace schema

目标：

- Code Agent 可以不同，但 Code Agent++ 看到的是统一的 diff、trace、command evidence 和 final state。
