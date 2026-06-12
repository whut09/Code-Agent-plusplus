import type { ContextPackage, IndexedFile } from "../core/types.js";
import { buildRagDocuments } from "../outputs/rag.js";
import type { ContextHit, ContextRetriever, ContextRetrieverOptions } from "./types.js";

export class StaticContextRetriever implements ContextRetriever {
  readonly name = "static" as const;

  constructor(private readonly context: ContextPackage) {}

  async search(task: string, options: ContextRetrieverOptions): Promise<ContextHit[]> {
    const terms = taskTerms(task);
    const fileMap = new Map(this.context.index.files.map((file) => [file.path, file]));
    const changed = new Set(options.changedFiles ?? []);
    const docs = buildRagDocuments(this.context);
    const hits = docs
      .map((doc) => {
        const file = fileMap.get(doc.path);
        if (!matchesFilters(file, doc.moduleName, options)) return null;
        const haystack = [doc.title, doc.path, doc.moduleName, doc.kind, doc.text].join("\n").toLowerCase();
        const pathScore = scoreTerms(terms, doc.path.toLowerCase()) * 1.5;
        const textScore = scoreTerms(terms, haystack);
        const changedBoost = changed.has(doc.path) ? 50 : 0;
        const importance = typeof doc.metadata.importanceScore === "number" ? doc.metadata.importanceScore / 20 : 0;
        const score = pathScore + textScore + changedBoost + importance;
        if (score <= 0 && terms.length > 0 && !changedBoost) return null;
        return {
          id: doc.id,
          path: doc.path,
          title: doc.title,
          moduleName: doc.moduleName,
          kind: doc.kind,
          score,
          source: this.name,
          snippet: snippetFor(doc.text, terms),
          metadata: {
            ...doc.metadata,
            tokens: doc.tokens
          }
        };
      })
      .filter((hit): hit is NonNullable<typeof hit> => Boolean(hit));

    return sortHits(hits).slice(0, Math.max(1, options.topK));
  }
}

export function taskTerms(task: string): string[] {
  return [...new Set(task.toLowerCase().match(/[\p{L}\p{N}_/-]+/gu)?.filter((term) => term.length >= 2) ?? [])];
}

export function scoreTerms(terms: string[], haystack: string): number {
  return terms.reduce((score, term) => score + (haystack.includes(term) ? Math.min(40, 10 + term.length * 2) : 0), 0);
}

export function snippetFor(text: string, terms: string[]): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  const lower = normalized.toLowerCase();
  const index = terms.map((term) => lower.indexOf(term)).filter((item) => item >= 0).sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, index - 80);
  const end = Math.min(normalized.length, index + 220);
  return `${start > 0 ? "..." : ""}${normalized.slice(start, end)}${end < normalized.length ? "..." : ""}`;
}

export function matchesFilters(file: IndexedFile | undefined, moduleName: string, options: ContextRetrieverOptions): boolean {
  if (options.modules?.length && !options.modules.includes(moduleName)) return false;
  if (file?.isTest && !options.includeTests) return false;
  return true;
}

export function sortHits<T extends { score: number; path: string }>(hits: T[]): T[] {
  return [...hits].sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
}
