# Guard Gate Schema

Guard modules emit normalized findings and gates.

```txt
.agent-context/runs/<task-id>/iterations/<nnn>/
  guard.findings.json
  guard.gates.json
  decision.json
```

## Finding

```ts
interface GuardFinding {
  id: string;
  source: "policy" | "hallucination" | "regression";
  kind: "forbidden" | "required" | "risk" | "info";
  status: "failed" | "missing" | "warning" | "satisfied" | "passed";
  severity: "error" | "warning" | "required" | "info";
  message: string;
  evidence: string[];
  requiredCommands: string[];
}
```

## Gate

```ts
interface GuardGate {
  id: string;
  guard: "context" | "boundary" | "evidence" | "hallucination" | "regression";
  blocking: boolean;
  action: "repack" | "rollback" | "human-review" | "run-tests" | "repair" | "block";
  evidence: string[];
  findingIds: string[];
}
```

Gates feed the orchestrator decision router, which writes a decision report such as `finalize`, `repair`, `repack`, `block`, `rollback`, or `require-human-review`.
