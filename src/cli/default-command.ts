export function resolveDefaultCommandArgs(input: { invokedName: string; argv: string[] }): string[] {
  if (input.invokedName === "capp" && input.argv.slice(2).length === 0) {
    return [...input.argv.slice(0, 2), "tui"];
  }
  return input.argv;
}
