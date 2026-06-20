import { createHash } from "node:crypto";

const PREVIEW_EDGE_CHARS = 400;
const REDACTION_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/gi, replacement: "[REDACTED_PRIVATE_KEY]" },
  { pattern: /\bauthorization\s*:\s*(?:Bearer|Basic)?\s*[^ \r\n]+/gi, replacement: "[REDACTED_AUTH]" },
  { pattern: /\b(?:api[_-]?key|token|secret|password|passwd|pwd|cookie|authorization)\s*[:=]\s*["']?[^"'\s]+/gi, replacement: "[REDACTED_SECRET]" },
  { pattern: /\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi, replacement: "[REDACTED_AUTH]" },
  { pattern: /\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g, replacement: "[REDACTED_JWT]" },
  { pattern: /\b(?:sk|pk|ghp|gho|github_pat|xox[baprs])[-_A-Za-z0-9]{16,}\b/gi, replacement: "[REDACTED_TOKEN]" }
];

export interface SanitizedOutput {
  hash: string;
  preview: string;
  truncated: boolean;
  redacted: boolean;
  bytes: number;
}

export function sanitizeToolOutput(value: unknown): SanitizedOutput {
  const text = String(value ?? "");
  const hash = hashText(text);
  const redacted = redactSecrets(text);
  const truncated = redacted.text.length > PREVIEW_EDGE_CHARS * 2;
  const preview = truncated
    ? `${redacted.text.slice(0, PREVIEW_EDGE_CHARS)}\n...[truncated ${redacted.text.length - PREVIEW_EDGE_CHARS * 2} chars]...\n${redacted.text.slice(-PREVIEW_EDGE_CHARS)}`
    : redacted.text;
  return {
    hash,
    preview,
    truncated,
    redacted: redacted.redacted,
    bytes: Buffer.byteLength(text, "utf8")
  };
}

export function hashText(text: unknown): string {
  return createHash("sha256")
    .update(String(text ?? ""))
    .digest("hex");
}

function redactSecrets(text: string): { text: string; redacted: boolean } {
  let redacted = false;
  let result = text;
  for (const { pattern, replacement } of REDACTION_PATTERNS) {
    result = result.replace(pattern, () => {
      redacted = true;
      return replacement;
    });
  }
  return { text: result, redacted };
}
