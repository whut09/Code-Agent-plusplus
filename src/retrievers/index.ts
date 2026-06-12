import type { ContextPackage } from "../core/types.js";
import { StaticContextRetriever } from "./static.js";
import { RipgrepContextRetriever } from "./ripgrep.js";
import { HybridContextRetriever } from "./hybrid.js";
import { ExternalProtocolRetriever } from "./external.js";
import type { ContextHit, ContextRetriever, ContextRetrieverOptions, RetrieverProvider } from "./types.js";
import { code, heading, table } from "../outputs/markdown.js";

export type { ContextHit, ContextRetriever, ContextRetrieverOptions, RetrieverProvider } from "./types.js";

export function createContextRetriever(context: ContextPackage, provider: RetrieverProvider): ContextRetriever {
  if (provider === "static") return new StaticContextRetriever(context);
  if (provider === "ripgrep") return new RipgrepContextRetriever(context);
  if (provider === "hybrid") return new HybridContextRetriever([new StaticContextRetriever(context), new RipgrepContextRetriever(context)]);
  return new ExternalProtocolRetriever(provider);
}

export function renderContextHits(task: string, provider: RetrieverProvider, hits: ContextHit[]): string {
  return [
    heading(1, "Context Retrieval"),
    "",
    `Task: ${task}`,
    `Provider: ${provider}`,
    "",
    table(
      ["Score", "Path", "Module", "Kind", "Source"],
      hits.map((hit) => [hit.score.toFixed(1), code(hit.path), hit.moduleName, hit.kind, hit.source])
    ),
    "",
    heading(2, "Snippets"),
    ...hits.flatMap((hit) => ["", heading(3, hit.path), hit.snippet || "No snippet available."])
  ].join("\n");
}
