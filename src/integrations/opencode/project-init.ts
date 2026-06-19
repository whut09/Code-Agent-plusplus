import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

export interface OpencodeInitOptions {
  force?: boolean;
  dryRun?: boolean;
}

export interface OpencodeInitFile {
  path: string;
  status: "written" | "skipped" | "would-write";
  reason?: string;
}

export interface OpencodeInitReport {
  repo: string;
  files: OpencodeInitFile[];
}

export function initOpencodeProject(repo: string, options: OpencodeInitOptions = {}): OpencodeInitReport {
  const root = path.resolve(repo);
  const files = opencodeInitTemplates().map((template): OpencodeInitFile => {
    const absolutePath = path.join(root, template.path);
    if (existsSync(absolutePath) && !options.force) {
      return { path: template.path, status: "skipped", reason: "file already exists; pass --force to overwrite" };
    }

    if (options.dryRun) {
      return { path: template.path, status: "would-write" };
    }

    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, `${template.content.trim()}\n`, "utf8");
    return { path: template.path, status: "written" };
  });

  return { repo: root, files };
}

export function renderOpencodeInitReport(report: OpencodeInitReport): string {
  const written = report.files.filter((file) => file.status === "written");
  const skipped = report.files.filter((file) => file.status === "skipped");
  const wouldWrite = report.files.filter((file) => file.status === "would-write");
  return [
    "OpenCode++ OpenCode Init",
    "",
    `Repo: ${report.repo}`,
    "",
    "Generated OpenCode project integration files:",
    ...formatInitFiles(written, "written"),
    ...formatInitFiles(wouldWrite, "would-write"),
    ...(skipped.length ? ["", "Skipped:", ...skipped.map((file) => `- ${file.path} (${file.reason ?? "skipped"})`)] : []),
    "",
    "Next:",
    "  opencode",
    "  /capp <task>",
    "  /capp-verify"
  ].join("\n");
}

function opencodeInitTemplates(): Array<{ path: string; content: string }> {
  return [
    {
      path: ".opencode/commands/capp.md",
      content: `---
description: Run a coding task through OpenCode++ with OpenCode as the executor
---

# OpenCode++ Task Harness

Task: $ARGUMENTS

Use OpenCode++ as the external harness control plane for this coding task.

1. Run \`capp oc doctor .\` if this repository has not been checked yet.
2. Run \`capp oc "$ARGUMENTS" .\`.
3. Read the compact terminal decision summary.
4. If the decision is blocking, follow the listed \`Next\` commands before claiming completion.
5. Prefer \`capp oc report --last\` for the full report and \`capp oc repair\` for repair guidance.

Do not manually declare the task complete when OpenCode++ reports \`repair\`, \`repack\`, \`block\`, \`rollback\`, or \`human-review\`.`
    },
    {
      path: ".opencode/commands/capp-verify.md",
      content: `---
description: Verify the latest OpenCode++ OpenCode run
---

# OpenCode++ Verification

Verify the latest OpenCode++ run before finalizing.

1. Run \`capp oc report --last --summary\`.
2. Run \`capp verify --diff .\`.
3. Run \`capp policy . --base main --fail-on required\`.
4. If the latest decision is blocking, run \`capp oc repair\` and follow the required commands.
5. Summarize the final decision, changed files, blocking gates, and evidence collected.`
    },
    {
      path: ".opencode/agents/code-agent-plusplus.md",
      content: `---
description: Use OpenCode as the executor under the OpenCode++ reliability harness
---

# OpenCode++ Executor Agent

You are operating as a coding-agent executor under OpenCode++.

OpenCode++ owns context packaging, edit boundaries, trace evidence, policy checks, impact analysis, verification, and the final decision report. OpenCode owns reading source files, editing code, and running commands.

Operating rules:

- Start concrete coding tasks with \`capp oc "$TASK" .\` or the \`/capp\` command.
- Read source files before behavior-changing edits; generated summaries are guidance, not source of truth.
- Keep edits inside the OpenCode++ edit boundary unless the report explicitly requires expansion.
- Treat \`finalize\` as ready for review, not automatic merge.
- Treat \`repair\`, \`repack\`, \`run-tests\`, \`block\`, \`rollback\`, and \`human-review\` as active gates.
- Use \`capp oc report --last\` for details and \`capp oc repair\` for the next repair checklist.
- Do not claim tests passed without command evidence after the final edit.`
    }
  ];
}

function formatInitFiles(files: OpencodeInitFile[], label: OpencodeInitFile["status"]): string[] {
  if (!files.length) return [];
  return files.map((file) => `- ${file.path} (${label})`);
}
