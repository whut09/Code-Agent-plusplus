import type { ContextPackage, IndexedFile } from "../core/types.js";
import { changedFilesSince } from "../core/git.js";
import { bullet, code, heading } from "./markdown.js";

export interface TestSelectionOptions {
  forPaths?: string[];
  diff?: boolean;
  base?: string;
}

export interface TestSelectionReport {
  targetFiles: string[];
  minimalTests: string[];
  recommendedRegressionTests: string[];
  minimalCommands: string[];
  recommendedCommands: string[];
  fullConfidenceCommands: string[];
}

export function buildTestSelection(context: ContextPackage, options: TestSelectionOptions = {}): TestSelectionReport {
  const targets = targetFiles(context, options);
  const targetSet = new Set(targets);
  const targetIndexFiles = indexedFiles(context, targets);
  const sourceTargets = targetIndexFiles.filter((file) => !file.isTest);
  const changedTests = targetIndexFiles.filter(isRunnableTestFile);
  const allTests = context.index.files.filter(isRunnableTestFile);
  const minimalTests = sortedByPath([...changedTests, ...relatedTestsFor(sourceTargets, allTests)]);
  const dependentFiles = dependentsOf(context, targetSet);
  const regressionTests = relatedTestsFor(dependentFiles, allTests).filter((file) => !minimalTests.some((testFile) => testFile.path === file.path));

  return {
    targetFiles: targets,
    minimalTests: minimalTests.map((file) => file.path),
    recommendedRegressionTests: regressionTests.map((file) => file.path),
    minimalCommands: focusedTestCommands(
      context,
      minimalTests.map((file) => file.path)
    ),
    recommendedCommands: recommendedRegressionCommands(
      context,
      regressionTests.map((file) => file.path)
    ),
    fullConfidenceCommands: fullConfidenceCommands(context)
  };
}

export function renderTestSelection(context: ContextPackage, options: TestSelectionOptions = {}): string {
  const report = buildTestSelection(context, options);
  return [
    heading(1, "Test Selection"),
    "",
    heading(2, "Target files"),
    bullet(report.targetFiles.map(code)),
    "",
    heading(2, "Minimal tests"),
    bullet(report.minimalCommands.map(code)),
    "",
    heading(2, "Recommended regression tests"),
    bullet(report.recommendedCommands.map(code)),
    "",
    heading(2, "Full confidence"),
    bullet(report.fullConfidenceCommands.map(code))
  ].join("\n");
}

function targetFiles(context: ContextPackage, options: TestSelectionOptions): string[] {
  const files = new Set<string>();
  for (const filePath of options.forPaths ?? []) {
    const normalized = filePath.replace(/\\/g, "/").replace(/^\.\//, "");
    if (normalized) files.add(normalized);
  }
  if (options.diff) {
    for (const filePath of changedFilesSince(context.scan.root, options.base ?? "main")) files.add(filePath);
  }
  return [...files].sort();
}

function dependentsOf(context: ContextPackage, targetSet: Set<string>): IndexedFile[] {
  const seen = new Set<string>(targetSet);
  const queue = [...targetSet];
  const dependentPaths: string[] = [];

  while (queue.length) {
    const current = queue.shift()!;
    for (const edge of context.graph.fileEdges) {
      if (edge.isExternal || edge.to !== current || seen.has(edge.from)) continue;
      seen.add(edge.from);
      queue.push(edge.from);
      dependentPaths.push(edge.from);
    }
  }

  return indexedFiles(context, dependentPaths).filter((file) => !file.isTest);
}

function relatedTestsFor(files: IndexedFile[], tests: IndexedFile[]): IndexedFile[] {
  const related = tests.filter((testFile) => files.some((file) => isRelatedTest(testFile, file)));
  return sortedByPath(related);
}

function isRunnableTestFile(file: IndexedFile): boolean {
  if (!file.isTest) return false;
  const normalized = file.path.toLowerCase();
  const baseName = normalized.split("/").pop() ?? normalized;
  return (
    baseName.includes(".test.") ||
    baseName.includes(".spec.") ||
    baseName.startsWith("test_") ||
    baseName.endsWith("_test.py") ||
    baseName.endsWith("test.java") ||
    normalized.includes("/__tests__/")
  );
}

function isRelatedTest(testFile: IndexedFile, sourceFile: IndexedFile): boolean {
  if (testFile.imports.some((item) => item.resolvedPath === sourceFile.path)) return true;

  const testPath = testFile.path.toLowerCase();
  const sourcePath = sourceFile.path.toLowerCase();
  const sourceDir = sourcePath.split("/").slice(0, -1).join("/");
  const sourceModuleDir = sourceDir.replace(/^src\//, "");
  const baseName =
    sourceFile.path
      .split("/")
      .pop()
      ?.replace(/\.[^.]+$/, "")
      .toLowerCase() ?? "";
  const moduleName = sourceFile.moduleName.toLowerCase();

  return (
    (baseName.length >= 3 && testPath.includes(baseName)) ||
    (sourceModuleDir.length >= 3 && testPath.includes(sourceModuleDir)) ||
    (moduleName !== "root" && moduleName !== "test" && testPath.includes(moduleName)) ||
    testPath.includes(sourceDir.replace(/^src\//, "test/")) ||
    testPath.includes(sourceDir.replace(/^src\//, "tests/"))
  );
}

function focusedTestCommands(context: ContextPackage, testPaths: string[]): string[] {
  const testCommand = context.scan.testCommands[0];
  if (!testPaths.length) return ["No directly related test files detected; inspect module tests manually."];
  if (!testCommand) return testPaths.map((filePath) => `No test command detected; run or inspect ${filePath}`);
  return testPaths.map((filePath) => `${testCommand} -- ${filePath}`);
}

function recommendedRegressionCommands(context: ContextPackage, testPaths: string[]): string[] {
  const commands = new Set<string>();
  const testCommand = context.scan.testCommands[0];
  if (testCommand) {
    for (const filePath of testPaths) commands.add(`${testCommand} -- ${filePath}`);
  } else {
    for (const filePath of testPaths) commands.add(`No test command detected; run or inspect ${filePath}`);
  }
  for (const command of context.scan.typecheckCommands.slice(0, 1)) commands.add(command);
  for (const command of context.scan.lintCommands.slice(0, 1)) commands.add(command);
  if (!commands.size) commands.add("No regression command detected; inspect project scripts and run affected integration tests manually.");
  return [...commands];
}

function fullConfidenceCommands(context: ContextPackage): string[] {
  const commands = new Set<string>();
  for (const command of context.scan.testCommands.slice(0, 2)) commands.add(command);
  for (const command of context.scan.typecheckCommands.slice(0, 1)) commands.add(command);
  if (!commands.size) commands.add("No full test command detected; inspect package scripts or project docs.");
  return [...commands];
}

function indexedFiles(context: ContextPackage, paths: string[]): IndexedFile[] {
  const wanted = new Set(paths);
  return context.index.files.filter((file) => wanted.has(file.path));
}

function sortedByPath(files: IndexedFile[]): IndexedFile[] {
  return [...new Map(files.map((file) => [file.path, file])).values()].sort((a, b) => a.path.localeCompare(b.path));
}
