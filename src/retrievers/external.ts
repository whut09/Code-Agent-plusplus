import type { ContextHit, ContextRetriever, ContextRetrieverOptions, RetrieverProvider } from "./types.js";

export class ExternalProtocolRetriever implements ContextRetriever {
  constructor(readonly name: Extract<RetrieverProvider, "lightrag" | "embedding">) {}

  async search(_task: string, _options: ContextRetrieverOptions): Promise<ContextHit[]> {
    throw new Error(
      `${this.name} retriever requires an external service adapter. Use the ContextRetriever interface to implement search(task, options) without binding the core package to a specific RAG framework.`
    );
  }
}
