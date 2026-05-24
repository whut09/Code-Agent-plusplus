export function estimateTokens(textOrBytes: string | number): number {
  if (typeof textOrBytes === "number") {
    return Math.ceil(textOrBytes / 4);
  }

  return Math.ceil(textOrBytes.length / 4);
}
