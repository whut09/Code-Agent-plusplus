export function heading(level: number, text: string): string {
  return `${"#".repeat(level)} ${text}`;
}

export function bullet(items: string[]): string {
  if (!items.length) {
    return "- None detected.";
  }

  return items.map((item) => `- ${item}`).join("\n");
}

export function code(value: string): string {
  return `\`${value}\``;
}

export function fenced(info: string, value: string): string {
  return `\`\`\`${info}\n${value.trim()}\n\`\`\``;
}

export function table(headers: string[], rows: string[][]): string {
  const header = `| ${headers.join(" | ")} |`;
  const separator = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.join(" | ")} |`).join("\n");
  return [header, separator, body].filter(Boolean).join("\n");
}
