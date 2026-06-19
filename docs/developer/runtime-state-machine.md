# Runtime State Machine

Runtime state is written under:

```txt
.agent-context/runs/<task-id>/state.json
```

Typical states:

- `EMPTY`
- `CONTEXT_READY`
- `TASK_PACK_READY`
- `EDIT_BOUNDARY_READY`
- `AGENT_STARTED`
- `EDITED`
- `VERIFYING`
- `REPAIRING`
- `READY_FOR_REVIEW`
- `BLOCKED`

The state file records:

- current state and previous state
- task id
- repository/context/diff hashes
- last action
- blocking next action
- allowed actions
- satisfied evidence
- missing evidence

The state machine is intentionally explicit. OpenCode++ reports the next allowed action; the external code agent, user, or CI workflow executes it.
