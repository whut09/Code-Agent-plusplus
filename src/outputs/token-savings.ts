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
      "The context pack estimate uses the top-ranked files plus generated summaries, not the entire repository."
    ])
  ].join("\n");
}
