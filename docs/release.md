# Release Checklist

OpenCode++ is published on npm as `opencode-plusplus`. The first npm release is `opencode-plusplus@0.1.0`.

The recommended install path is:

```bash
npm i -g opencode-plusplus opencode-ai
cd your-repo
opencode-plusplus
```

## Release Gate

Run the full gate before publishing a new version:

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

- Confirm `package.json` has the intended package name and version.
- Confirm `README.md` and `README.en.md` use the npm install path.
- Inspect `npm pack --dry-run` output for unwanted local files, secrets, caches, traces, or generated runtime artifacts.
- Confirm the tarball does not include local dependency folders such as `node_modules/` or `apps/desktop/node_modules/`.
- Confirm the tarball does not include generated local caches such as `.agent-context/cache/`.
- Smoke test the packed tarball in a temporary directory before publishing when possible.
- After publishing, confirm the published version with `npm view opencode-plusplus version`.

## Publish Command

Publishing requires an npm account with permission to publish `opencode-plusplus`:

```bash
npm publish
```

For packages that require two-factor authentication, use a one-time password or a granular access token with publish permission and 2FA bypass enabled.
