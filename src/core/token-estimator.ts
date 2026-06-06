import { encodingForModel, getEncoding, type TiktokenEncoding, type TiktokenModel } from "js-tiktoken";
import type { TokenizerConfig, TokenizerMode } from "./types.js";

export function estimateTokens(textOrBytes: string | number): number {
  if (typeof textOrBytes === "number") {
    return Math.ceil(textOrBytes / 4);
  }

  return Math.ceil(textOrBytes.length / 4);
}

export interface TokenCountResult {
  tokens: number;
  tokenizer: TokenizerMode;
  model?: string;
}

export function countTokens(text: string, tokenizer: TokenizerConfig): TokenCountResult {
  if (tokenizer.mode === "chars_approx") {
    return {
      tokens: estimateTokens(text),
      tokenizer: "chars_approx",
      model: tokenizer.model
    };
  }

  try {
    const encoder = tokenizer.model
      ? encodingForModel(tokenizer.model as TiktokenModel)
      : getEncoding(tokenizer.mode as TiktokenEncoding);
    return {
      tokens: encoder.encode(text).length,
      tokenizer: tokenizer.mode,
      model: tokenizer.model
    };
  } catch {
    try {
      const encoder = getEncoding(tokenizer.mode as TiktokenEncoding);
      return {
        tokens: encoder.encode(text).length,
        tokenizer: tokenizer.mode,
        model: tokenizer.model
      };
    } catch {
      return {
        tokens: estimateTokens(text),
        tokenizer: "chars_approx",
        model: tokenizer.model
      };
    }
  }
}

export function tokenizerFromModel(model: string): TokenizerConfig {
  const normalized = model.toLowerCase();
  if (
    normalized.includes("gpt-4.1")
    || normalized.includes("gpt-4o")
    || normalized.includes("o1")
    || normalized.includes("o3")
    || normalized.includes("o4")
  ) {
    return { mode: "o200k_base", model };
  }

  return { mode: "cl100k_base", model };
}

export function parseTokenizerMode(value: string): TokenizerMode {
  const normalized = value.replace("-", "_");
  if (normalized === "chars_approx" || normalized === "cl100k_base" || normalized === "o200k_base") {
    return normalized;
  }

  throw new Error(`Unsupported tokenizer: ${value}. Expected chars-approx, cl100k_base, or o200k_base.`);
}
