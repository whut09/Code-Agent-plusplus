import { spawn, spawnSync } from "node:child_process";

export interface SafeCommandRunOptions {
  cwd: string;
  encoding?: BufferEncoding;
  maxBuffer?: number;
  onStdout?: (text: string) => void;
  onStderr?: (text: string) => void;
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
  const result = runParsedCommand(parsed.file, parsed.args, options);
  const fallback = shouldTryWindowsCmdFallback(parsed.file, result.error) ? runWindowsCmdCommand(`${parsed.file}.cmd`, parsed.args, options) : undefined;
  const finalResult = fallback && !fallback.error && fallback.status !== null ? fallback : result;
  const file = fallback && !fallback.error ? `${parsed.file}.cmd` : parsed.file;
  const stdout = typeof finalResult.stdout === "string" ? finalResult.stdout : "";
  const rawStderr = typeof finalResult.stderr === "string" ? finalResult.stderr : "";
  const stderr = finalResult.error ? `${rawStderr}${rawStderr ? "\n" : ""}${finalResult.error.message}` : rawStderr;
  return {
    command,
    file,
    args: parsed.args,
    stdout,
    stderr,
    status: typeof finalResult.status === "number" ? finalResult.status : finalResult.error ? 1 : null,
    error: finalResult.error
  };
}

export async function runSafeCommandStreaming(command: string, options: SafeCommandRunOptions): Promise<SafeCommandRunResult> {
  const parsed = parseCommandLine(command);
  const result = await runParsedCommandStreaming(parsed.file, parsed.args, options);
  const fallback = shouldTryWindowsCmdFallback(parsed.file, result.error)
    ? await runWindowsCmdCommandStreaming(`${parsed.file}.cmd`, parsed.args, options)
    : undefined;
  const finalResult = fallback && !fallback.error && fallback.status !== null ? fallback : result;
  const file = fallback && !fallback.error ? `${parsed.file}.cmd` : parsed.file;
  const stderr = finalResult.error ? `${finalResult.stderr}${finalResult.stderr ? "\n" : ""}${finalResult.error.message}` : finalResult.stderr;
  return {
    command,
    file,
    args: parsed.args,
    stdout: finalResult.stdout,
    stderr,
    status: typeof finalResult.status === "number" ? finalResult.status : finalResult.error ? 1 : null,
    error: finalResult.error
  };
}

function runParsedCommand(file: string, args: string[], options: SafeCommandRunOptions): ReturnType<typeof spawnSync> {
  return spawnSync(file, args, {
    cwd: options.cwd,
    shell: false,
    encoding: options.encoding ?? "utf8",
    maxBuffer: options.maxBuffer
  });
}

function runWindowsCmdCommand(file: string, args: string[], options: SafeCommandRunOptions): ReturnType<typeof spawnSync> {
  const command = [file, ...args].map(windowsCmdQuote).join(" ");
  return spawnSync("cmd.exe", ["/d", "/s", "/c", command], {
    cwd: options.cwd,
    shell: false,
    encoding: options.encoding ?? "utf8",
    maxBuffer: options.maxBuffer
  });
}

async function runParsedCommandStreaming(
  file: string,
  args: string[],
  options: SafeCommandRunOptions
): Promise<{ stdout: string; stderr: string; status: number | null; error?: Error }> {
  return runSpawnStreaming(file, args, options);
}

async function runWindowsCmdCommandStreaming(
  file: string,
  args: string[],
  options: SafeCommandRunOptions
): Promise<{ stdout: string; stderr: string; status: number | null; error?: Error }> {
  const command = [file, ...args].map(windowsCmdQuote).join(" ");
  return runSpawnStreaming("cmd.exe", ["/d", "/s", "/c", command], options);
}

async function runSpawnStreaming(
  file: string,
  args: string[],
  options: SafeCommandRunOptions
): Promise<{ stdout: string; stderr: string; status: number | null; error?: Error }> {
  return new Promise((resolve) => {
    const child = spawn(file, args, {
      cwd: options.cwd,
      shell: false,
      windowsHide: true
    });
    const encoding = options.encoding ?? "utf8";
    const maxBuffer = options.maxBuffer ?? 1024 * 1024;
    let stdout = "";
    let stderr = "";
    let error: Error | undefined;
    let settled = false;

    child.stdout?.setEncoding(encoding);
    child.stderr?.setEncoding(encoding);

    child.stdout?.on("data", (chunk: string | Buffer) => {
      const text = chunk.toString();
      stdout += text;
      options.onStdout?.(text);
      if (stdout.length + stderr.length > maxBuffer && !error) {
        error = new Error(`Command output exceeded maxBuffer (${maxBuffer} bytes).`);
        child.kill();
      }
    });

    child.stderr?.on("data", (chunk: string | Buffer) => {
      const text = chunk.toString();
      stderr += text;
      options.onStderr?.(text);
      if (stdout.length + stderr.length > maxBuffer && !error) {
        error = new Error(`Command output exceeded maxBuffer (${maxBuffer} bytes).`);
        child.kill();
      }
    });

    child.once("error", (spawnError) => {
      error = spawnError;
    });

    child.once("close", (status) => {
      if (settled) return;
      settled = true;
      resolve({ stdout, stderr, status, error });
    });
  });
}

function shouldTryWindowsCmdFallback(file: string, error: Error | undefined): boolean {
  if (process.platform !== "win32") return false;
  if (!error || !("code" in error) || (error as NodeJS.ErrnoException).code !== "ENOENT") return false;
  return !/\.(cmd|bat|exe|ps1)$/i.test(file);
}

function windowsCmdQuote(value: string): string {
  if (value && !/[\s"&|<>^]/.test(value)) return value;
  return `"${value.replace(/(["^])/g, "^$1")}"`;
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
      const next = command[index + 1] ?? "";
      if (next !== "'" && next !== '"' && next !== "\\" && (quote || !/\s/.test(next))) {
        current += char;
        continue;
      }
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
