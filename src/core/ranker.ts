import type { DependencyGraph, IndexedFile, RepoIndex, RepoScan } from "./types.js";

export function rankFiles(scan: RepoScan, index: RepoIndex, graph: DependencyGraph): IndexedFile[] {
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();
  for (const edge of graph.fileEdges) {
    outgoing.set(edge.from, (outgoing.get(edge.from) ?? 0) + 1);
    if (!edge.isExternal) {
      incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
    }
  }

  const entrypoints = new Set(scan.entrypoints);

  for (const file of index.files) {
    const reasons: string[] = [];
    let score = 0;

    if (entrypoints.has(file.path)) {
      score += 35;
      reasons.push("entrypoint");
    }
    if (file.kind === "config") {
      score += 25;
      reasons.push("configuration");
    }
    if (file.path.toLowerCase().includes("readme")) {
      score += 20;
      reasons.push("readme");
    }
    if (file.exports.length) {
      score += Math.min(20, file.exports.length * 4);
      reasons.push(`${file.exports.length} export${file.exports.length === 1 ? "" : "s"}`);
    }
    if (file.symbols.length) {
      score += Math.min(15, file.symbols.length * 2);
      reasons.push(`${file.symbols.length} symbol${file.symbols.length === 1 ? "" : "s"}`);
    }

    const inbound = incoming.get(file.path) ?? 0;
    const outbound = outgoing.get(file.path) ?? 0;
    if (inbound) {
      score += Math.min(25, inbound * 5);
      reasons.push(`${inbound} inbound ${dependencyWord(inbound)}`);
    }
    if (outbound) {
      score += Math.min(15, outbound * 2);
      reasons.push(`${outbound} outbound ${dependencyWord(outbound)}`);
    }
    if (file.isTest) {
      score += 8;
      reasons.push("test coverage signal");
    }
    if (file.confidence === "high") {
      score += 5;
      reasons.push("high-confidence analysis");
    } else if (file.confidence === "low") {
      score -= 5;
      reasons.push("low-confidence analysis");
    }
    if (file.kind === "lockfile" || file.isGenerated || file.kind === "asset") {
      score -= 30;
      reasons.push("low-value generated/asset/lockfile");
    }

    file.importanceScore = Math.max(0, score);
    file.importanceReasons = reasons;
  }

  const moduleScores = new Map<string, number>();
  for (const file of index.files) {
    moduleScores.set(file.moduleName, (moduleScores.get(file.moduleName) ?? 0) + file.importanceScore);
  }
  for (const module of index.modules) {
    module.importanceScore = moduleScores.get(module.name) ?? 0;
  }

  return [...index.files]
    .filter((file) => file.importanceScore > 0)
    .sort((a, b) => b.importanceScore - a.importanceScore || a.path.localeCompare(b.path));
}

function dependencyWord(count: number): string {
  return count === 1 ? "dependency" : "dependencies";
}
