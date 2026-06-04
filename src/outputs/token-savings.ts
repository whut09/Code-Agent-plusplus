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
      "The context pack estimate uses compact file summaries, symbols, imports, module context, and graph hints rather than full source files."
    ]),
    "",
    heading(2, "Actual Generated Output"),
    context.tokenSavings.actualOutputTokens
      ? [
        `Tokenizer mode: ${context.tokenSavings.actualOutputTokens.mode}`,
        `Actual output: ${context.tokenSavings.actualOutputTokens.totalTokens.toLocaleString()} tokens`,
        `Scope: ${context.tokenSavings.actualOutputTokens.scope}`,
        "",
        ...context.tokenSavings.actualOutputTokens.files.map((file) => `- \`${file.path}\`: ${file.tokens.toLocaleString()} tokens`)
      ].join("\n")
      : "Actual output tokens are calculated after files are written."
  ].join("\n");
}
