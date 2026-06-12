import type { ContextPackage } from "../core/types.js";
import { formatTokenSavings } from "../core/token-savings.js";
import { bullet, heading } from "./markdown.js";

export function renderTokenSavings(context: ContextPackage): string {
  return [
    heading(1, "Token Savings Report"),
    "",
    formatTokenSavings(context.tokenSavings),
    "",
    heading(2, "Selection"),
    bullet([
      `Selected files: ${context.tokenSavings.selectedFiles}`,
      `Total scanned files: ${context.tokenSavings.totalFiles}`,
      `Token budget: ${context.tokenSavings.tokenBudget.toLocaleString()}`,
      "Original repo tokens are estimated from scanned source sizes.",
      "Estimated context pack tokens use compact file summaries, symbols, imports, module context, and graph hints.",
      "Actual context pack tokens are counted from generated Markdown, Mermaid, and RAG JSONL files after writing."
    ]),
    "",
    heading(2, "Estimated Tokens"),
    bullet([
      `Original repo: ${context.tokenSavings.originalRepoTokens.tokens.toLocaleString()} tokens (${context.tokenSavings.originalRepoTokens.tokenizer})`,
      `Estimated context pack: ${context.tokenSavings.estimatedContextPackTokens.tokens.toLocaleString()} tokens (${context.tokenSavings.estimatedContextPackTokens.tokenizer})`
    ]),
    "",
    heading(2, "Actual Generated Output"),
    context.tokenSavings.actualOutputTokens
      ? [
          `Tokenizer: ${context.tokenSavings.actualOutputTokens.tokenizer}${context.tokenSavings.actualOutputTokens.model ? ` (${context.tokenSavings.actualOutputTokens.model})` : ""}`,
          `Actual output: ${context.tokenSavings.actualOutputTokens.total.toLocaleString()} tokens`,
          `Scope: ${context.tokenSavings.actualOutputTokens.scope}`,
          "",
          ...Object.entries(context.tokenSavings.actualOutputTokens.files).map(([file, tokens]) => `- \`${file}\`: ${tokens.toLocaleString()} tokens`)
        ].join("\n")
      : "Actual output tokens are calculated after files are written."
  ].join("\n");
}
