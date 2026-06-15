import type { ContextPackage } from "../core/types.js";
import { exploreWithCodeGraph } from "../integrations/codegraph.js";
import { HybridContextRetriever } from "./hybrid.js";
import { RipgrepContextRetriever } from "./ripgrep.js";
import { StaticContextRetriever } from "./static.js";
import type { ContextHit, ContextRetriever, ContextRetrieverOptions } from "./types.js";

export class CodeGraphContextRetriever implements ContextRetriever {
  readonly name = "codegraph" as const;
  private readonly fallback: HybridContextRetriever;

  constructor(private readonly context: ContextPackage) {
    this.fallback = new HybridContextRetriever([new StaticContextRetriever(context), new RipgrepContextRetriever(context)]);
  }

  async search(task: string, options: ContextRetrieverOptions): Promise<ContextHit[]> {
    const codegraph = exploreWithCodeGraph(this.context, task, options.topK);
    if (codegraph.hits.length) return codegraph.hits;

    const fallbackHits = await this.fallback.search(task, options);
    return fallbackHits.map((hit) => ({
      ...hit,
      metadata: {
        ...hit.metadata,
        codegraphFallbackReason: codegraph.status.reason
      }
    }));
  }
}
