# Release Checklist

OpenCode++ is not published to npm yet. The next product milestone is `opencode-plusplus@0.1.0`, so external users can install the tool without cloning this repository.

After publishing, the recommended install path becomes:

```bash
npm i -g opencode-plusplus opencode-ai
cd your-repo
opencode-plusplus
```

## Pre-Release Gate

Run the full gate before publishing:

```bash
npm run check
npm run lint
npm run format:check
npm run docs:cli:check
npm test
npm run benchmark
npm run benchmark:agent
npm run build
npm run pack:dry-run
```

CI already runs the same baseline. `prepublishOnly` also runs these checks so local npm publishing uses the same gate.

## Manual Checks

- Confirm `package.json` has the intended package name and version: `opencode-plusplus@0.1.0`.
- Confirm `README.md` and `README.en.md` still say the package is not published until the npm publish actually succeeds.
- Inspect `npm pack --dry-run` output for unwanted local files, secrets, caches, traces, or generated runtime artifacts.
- Confirm the tarball does not include local dependency folders such as `node_modules/` or `apps/desktop/node_modules/`.
- Confirm the tarball does not include generated local caches such as `.agent-context/cache/`.
- Smoke test the packed tarball in a temporary directory before publishing when possible.
- After publishing, update README install instructions to make `npm i -g opencode-plusplus opencode-ai` the primary path.

## Publish Command

Publishing requires an npm account with permission to publish `opencode-plusplus`:

```bash
npm publish
```

Do not mark the package as published in documentation until `npm publish` succeeds.
