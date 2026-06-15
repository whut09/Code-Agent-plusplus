import { spawnSync } from "node:child_process";

export interface SafeCommandRunOptions {
  cwd: string;
  encoding?: BufferEncoding;
  maxBuffer?: number;
}

export interface SafeCommandRunResult {
  command: string;
  file: string;
  args: string[];
  stdout: string;
  stderr: string;
  status: number | null;
  error?: Error;
}

export function runSafeCommand(command: string, options: SafeCommandRunOptions): SafeCommandRunResult {
  const parsed = parseCommandLine(command);
  const result = spawnSync(parsed.file, parsed.args, {
    cwd: options.cwd,
    shell: false,
    encoding: options.encoding ?? "utf8",
    maxBuffer: options.maxBuffer
  });
  const stdout = typeof result.stdout === "string" ? result.stdout : "";
  const rawStderr = typeof result.stderr === "string" ? result.stderr : "";
  const stderr = result.error ? `${rawStderr}${rawStderr ? "\n" : ""}${result.error.message}` : rawStderr;
  return {
    command,
    file: parsed.file,
    args: parsed.args,
    stdout,
    stderr,
    status: typeof result.status === "number" ? result.status : result.error ? 1 : null,
    error: result.error
  };
}

export function parseCommandLine(command: string): { file: string; args: string[] } {
  const argv = tokenizeCommandLine(command);
  if (argv.length === 0) {
    throw new Error("Command is empty.");
  }
  return { file: argv[0] ?? "", args: argv.slice(1) };
}

export function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function tokenizeCommandLine(command: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;
  let escaped = false;

  for (let index = 0; index < command.length; index += 1) {
    const char = command[index] ?? "";

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
      continue;
    }

    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    if (isShellControlOperator(char)) {
      throw new Error(`Unsupported shell control operator ${JSON.stringify(char)}. Pass a plain executable plus arguments.`);
    }

    current += char;
  }

  if (escaped) current += "\\";
  if (quote) throw new Error(`Unterminated ${quote} quote in command.`);
  if (current) tokens.push(current);
  return tokens;
}

function isShellControlOperator(char: string): boolean {
  return char === "|" || char === "&" || char === ";" || char === "<" || char === ">" || char === "`";
}
