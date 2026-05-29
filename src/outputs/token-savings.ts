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
      "The context pack estimate uses compact file summaries, symbols, imports, module context, and graph hints rather than full source files."
    ])
  ].join("\n");
}
