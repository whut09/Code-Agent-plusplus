export function resolveDefaultCommandArgs(input: { invokedName: string; argv: string[] }): string[] {
  const args = input.argv.slice(2);
  if (isTuiAlias(input.invokedName) && args.length === 0) {
    return [...input.argv.slice(0, 2), "tui"];
  }
  if (isTuiAlias(input.invokedName) && args[0] === "--pure") {
    return [...input.argv.slice(0, 2), "tui", "--pure", ...args.slice(1)];
  }
  return input.argv;
}

function isTuiAlias(invokedName: string): boolean {
  return invokedName === "opencode-plusplus";
}
