# MCP Tools

`code-agent-plusplus-mcp` exposes OpenCode++ through stdio MCP.

## Foundation Tools

- `code_agent_plusplus_build`
- `code_agent_plusplus_plan`
- `code_agent_plusplus_pack`
- `code_agent_plusplus_retrieve`
- `code_agent_plusplus_tests`
- `code_agent_plusplus_impact`
- `code_agent_plusplus_verify`
- `code_agent_plusplus_explain`

## Experimental Runtime Tools

- `code_agent_plusplus_start_loop`
- `code_agent_plusplus_step`
- `code_agent_plusplus_evaluate`
- `code_agent_plusplus_repair`
- `code_agent_plusplus_finalize`

Runtime tools return structured gate fields such as `nextAction`, `blocking`, `requiredCommands`, `mustInspect`, `allowedEditGlobs`, `avoidEditGlobs`, and `missingEvidence`.

## Status

The stdio server and core tools are a Foundation capability. Agent Native Runtime tools are Experimental and still need per-client end-to-end validation.
