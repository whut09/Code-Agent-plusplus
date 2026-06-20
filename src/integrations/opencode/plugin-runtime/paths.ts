export function commandFromTool(tool: unknown, args: unknown): string | null {
  if (!args || typeof args !== "object") return null;
  const record = args as Record<string, unknown>;
  if (typeof record.command === "string") return record.command;
  if (typeof record.cmd === "string") return record.cmd;
  if (typeof record.shell === "string") return record.shell;
  if (typeof record.input === "string" && /^(bash|shell|terminal|run)$/i.test(String(tool ?? ""))) return record.input;
  return null;
}

export function pathsFromTool(args: unknown): string[] {
  if (!args || typeof args !== "object") return [];
  const record = args as Record<string, unknown>;
  const values: string[] = [];
  for (const key of ["path", "file", "filepath", "filePath", "target", "destination"]) {
    if (typeof record[key] === "string") values.push(record[key]);
  }
  if (Array.isArray(record.files)) {
    for (const file of record.files) if (typeof file === "string") values.push(file);
  }
  return values;
}
