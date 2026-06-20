import type { Command } from "commander";
import { buildContextPackage } from "../../core/context-builder.js";
import { buildRagDocuments, buildRagManifest } from "../../outputs/rag.js";
import { createContextRetriever, renderContextHits } from "../../retrievers/index.js";
import { parseInteger, parseRetrieverProvider, retrieveOptions, type RetrieveCliOptions } from "../parsers/options.js";

export function registerRagCommands(program: Command): void {
  const rag = program.command("rag").description("RAG integration commands.");

  rag
    .command("export")
    .argument("[repo]", "repository path", ".")
    .option("-b, --token-budget <tokens>", "target token budget", parseInteger)
    .description("Print a LightRAG-friendly export summary.")
    .action(async (repo: string, options: { tokenBudget?: number }) => {
      const context = await buildContextPackage(repo, options);
      const documents = buildRagDocuments(context);
      const manifest = buildRagManifest(context, documents.length);
      console.log("# LightRAG Export");
      console.log("");
      console.log(`Documents: ${documents.length}`);
      console.log(`Provider: ${manifest.provider}`);
      console.log(`Mode: ${manifest.mode}`);
      console.log("");
      console.log("Run `opencode-plusplus build` to write `.agent-context/rag/documents.jsonl`.");
    });

  rag
    .command("search")
    .argument("<task>", "task or search query")
    .argument("[repo]", "repository path", ".")
    .option("--provider <provider>", "retriever provider: static, ripgrep, hybrid, lightrag, embedding, codegraph", parseRetrieverProvider, "hybrid")
    .option("-k, --top-k <count>", "number of context hits", parseInteger, 8)
    .option("--modules <modules>", "comma-separated module filter")
    .option("--changed-files <files>", "comma-separated changed file filter")
    .option("--include-tests", "include test files in retrieval results")
    .option("--json", "print machine-readable context hits")
    .description("Search repository context through the unified retrieval protocol.")
    .action(async (task: string, repo: string, options: RetrieveCliOptions) => {
      const context = await buildContextPackage(repo);
      const retriever = createContextRetriever(context, options.provider);
      const hits = await retriever.search(task, retrieveOptions(options));
      console.log(options.json ? JSON.stringify(hits, null, 2) : renderContextHits(task, options.provider, hits));
    });

  program
    .command("retrieve")
    .argument("<task>", "task or search query")
    .argument("[repo]", "repository path", ".")
    .option("--provider <provider>", "retriever provider: static, ripgrep, hybrid, lightrag, embedding, codegraph", parseRetrieverProvider, "hybrid")
    .option("-k, --top-k <count>", "number of context hits", parseInteger, 8)
    .option("--modules <modules>", "comma-separated module filter")
    .option("--changed-files <files>", "comma-separated changed file filter")
    .option("--include-tests", "include test files in retrieval results")
    .option("--json", "print machine-readable context hits")
    .description("Search repository context through the unified retrieval protocol.")
    .action(async (task: string, repo: string, options: RetrieveCliOptions) => {
      const context = await buildContextPackage(repo);
      const retriever = createContextRetriever(context, options.provider);
      const hits = await retriever.search(task, retrieveOptions(options));
      console.log(options.json ? JSON.stringify(hits, null, 2) : renderContextHits(task, options.provider, hits));
    });
}
