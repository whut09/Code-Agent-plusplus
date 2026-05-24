import type { DependencyGraph, RepoIndex } from "./types.js";

export function buildDependencyGraph(index: RepoIndex): DependencyGraph {
  const fileToModule = new Map(index.files.map((file) => [file.path, file.moduleName]));
  const moduleEdgeCounts = new Map<string, { from: string; to: string; count: number }>();

  for (const edge of index.imports) {
    if (edge.isExternal) continue;
    const from = fileToModule.get(edge.from);
    const to = fileToModule.get(edge.to);
    if (!from || !to || from === to) continue;

    const key = `${from}->${to}`;
    const current = moduleEdgeCounts.get(key) ?? { from, to, count: 0 };
    current.count += 1;
    moduleEdgeCounts.set(key, current);
  }

  return {
    fileEdges: index.imports,
    moduleEdges: [...moduleEdgeCounts.values()].sort((a, b) => {
      const from = a.from.localeCompare(b.from);
      return from || a.to.localeCompare(b.to);
    })
  };
}
