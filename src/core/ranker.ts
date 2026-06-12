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
  const sourceFileCount = index.files.filter((file) => file.kind === "source").length;
  const smallRepo = scan.files.length <= 12 || sourceFileCount <= 4;
  const hasSourceFiles = sourceFileCount > 0;

  for (const file of index.files) {
    const reasons: string[] = [];
    let score = 0;

    if (entrypoints.has(file.path)) {
      score += 35;
      reasons.push("entrypoint");
    }
    if (isApiOrRouteFile(file.path)) {
      score += 18;
      reasons.push("route/api surface");
    }
    if (file.kind === "config") {
      score += isHighSignalConfig(file.path) ? 22 : 8;
      reasons.push("configuration");
    }
    if (file.path.toLowerCase().includes("readme")) {
      score += 20;
      reasons.push("readme");
    }
    if (isArchitectureDoc(file.path)) {
      score += 18;
      reasons.push("architecture doc");
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
    if (isGenericConfig(file)) {
      score -= 8;
      reasons.push("generic config");
    }
    if (isToolingConfig(file.path)) {
      score -= 10;
      reasons.push("tooling config");
    }
    if (file.kind === "docs" && !isArchitectureDoc(file.path) && !file.path.toLowerCase().includes("readme")) {
      score -= 4;
      reasons.push("secondary documentation");
    }

    if (smallRepo && hasSourceFiles && isPackageManifest(file.path)) {
      score -= 12;
      reasons.push("small-repo manifest balance");
    }
    if (smallRepo && hasSourceFiles && file.kind === "config" && !isManifestOrDeploymentConfig(file.path)) {
      score -= 14;
      reasons.push("small-repo config balance");
    }
    if (smallRepo && hasSourceFiles && isToolingConfig(file.path)) {
      score -= 12;
      reasons.push("small-repo tooling balance");
    }
    if (smallRepo && hasSourceFiles && file.kind === "docs" && !isArchitectureDoc(file.path)) {
      score -= file.path.toLowerCase().includes("readme") ? 8 : 12;
      reasons.push("small-repo docs balance");
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

  return [...index.files].filter((file) => file.importanceScore > 0).sort((a, b) => b.importanceScore - a.importanceScore || a.path.localeCompare(b.path));
}

function dependencyWord(count: number): string {
  return count === 1 ? "dependency" : "dependencies";
}

function isApiOrRouteFile(filePath: string): boolean {
  return /(^|\/)(api|routes?)\//i.test(filePath) || /(^|\/)(route|controller|handler)\.[cm]?[tj]sx?$/i.test(filePath);
}

function isArchitectureDoc(filePath: string): boolean {
  return /(^|\/)(architecture|design|adr|decision[s]?)(\.|\/|$)/i.test(filePath);
}

function isHighSignalConfig(filePath: string): boolean {
  return /(^|\/)(package\.json|pyproject\.toml|Cargo\.toml|go\.mod|Dockerfile|docker-compose\.yml|docker-compose\.yaml|next\.config\.[cm]?js|vite\.config\.[cm]?ts)$/i.test(
    filePath
  );
}

function isGenericConfig(file: IndexedFile): boolean {
  return file.kind === "config" && !isHighSignalConfig(file.path);
}

function isToolingConfig(filePath: string): boolean {
  return /(^|\/)(tsconfig\.json|eslint\.config\.[cm]?js|prettier\.config\.[cm]?js|babel\.config\.[cm]?js|vitest\.config\.[cm]?ts|jest\.config\.[cm]?js)$/i.test(
    filePath
  );
}

function isManifestOrDeploymentConfig(filePath: string): boolean {
  return /(^|\/)(package\.json|pyproject\.toml|Cargo\.toml|go\.mod|Dockerfile|docker-compose\.yml|docker-compose\.yaml|pm2\.config\.[cm]?js|ecosystem\.config\.[cm]?js)$/i.test(
    filePath
  );
}

function isPackageManifest(filePath: string): boolean {
  return /(^|\/)package\.json$/i.test(filePath);
}
