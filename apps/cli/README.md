# OnAPI CLI

Runs Postman v2.1 collection JSON with the same HTTP runtime as the VS Code extension. HTTP and GraphQL requests, inherited scripts/auth, environment variables and assertions are supported.

From the repository root:

```sh
pnpm build:cli
node apps/cli/dist/onapi.js --help
node apps/cli/dist/onapi.js run collection.json --env staging.json
node apps/cli/dist/onapi.js run collection.json --request 'Login' --reporter json
node apps/cli/dist/onapi.js run collection.json --reporter junit --output results.xml
```

`--request` selects a unique request name or ID, preserving parent folder and collection scripts/auth. `--timeout` is the overall deadline in milliseconds (default 60000), and also bounds individual requests and scripts. Relative upload paths resolve from the current working directory.

Exit codes: 0 successful, 1 execution or assertion failures, 2 input/output or usage errors, 130 interrupted. HTTP error status codes only fail a run when an assertion rejects them. Reports include request names, status, timing, assertion results and errors; they exclude response bodies, headers, cookies and environment snapshots. Script-generated assertion names and error messages may still contain sensitive values.

Environment changes and cookies remain in memory. This first version reads exported collections; it does not read or modify VS Code storage. Conversion commands, realtime protocols and npm publication are outside this version. No global installation is required.

Build before testing:

```sh
node --test tests/cli/runner.test.mjs
```
