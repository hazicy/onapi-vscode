# Development commands

Use Node.js 22.19+ and the pnpm version pinned in the root manifest.
See [workspace architecture](../docs/monorepo.md) for dependency boundaries.

| Command                          | Result                                                         |
| -------------------------------- | -------------------------------------------------------------- |
| `pnpm install --frozen-lockfile` | Install all workspaces using the committed lockfile            |
| `pnpm build`                     | Production builds, assembly and artifact checks                |
| `pnpm compile`                   | Development bundles with source maps and assembly              |
| `pnpm dev`                       | Initial build, Webview HMR, host/runtime watches and assembly  |
| `pnpm package`                   | Build and package a VSIX in `artifacts/`                       |
| `pnpm lint`                      | Check application and package source with Oxlint               |
| `pnpm check:boundaries`          | Verify declared dependencies and package boundaries            |
| `pnpm test:unit`                 | Cross-workspace execution, storage and conversion regressions  |
| `pnpm test:ui`                   | Browser controls and production Webview flows                  |
| `pnpm test:editor`               | CodeMirror, response formatting and large-body regressions     |
| `pnpm test:websocket`            | Local WebSocket protocol regressions                           |
| `pnpm test:socketio`             | Local Socket.IO protocol regressions                           |
| `pnpm typecheck`                 | All workspace type checks, including existing frontend errors  |
| `pnpm typecheck:e2e`             | TypeScript checks for browser tests, fixtures and Page Objects |

Run `pnpm exec playwright install chromium` before browser tests. Build production
assets before running `test:ui`. Tests that use local HTTP or protocol servers
need permission to listen on loopback interfaces.

See the [Webview browser test guide](../apps/webviews/tests/README.md) for Page
Object, component object and fixture responsibilities.

## Build ownership

Vite configurations live in `apps/webviews/vite.config.mts` and
`apps/extension/vite.config.mts`. Runtime has its own esbuild entry in
`packages/runtime/build.mjs`. Producers write only their own output directories;
`scripts/assemble-extension.mjs` owns `apps/extension/dist`.

The final directory includes the host, Webview entrypoints and chunks, the Worker,
its bundled runtime, fonts, images, PDF worker and licenses. Keep the complete
assembled directory when testing the extension outside this repository.
The extension-generated HTML loads assets from `dist/webviews`; native icons
remain under `dist/images`.

F5 launches `apps/extension` after the finite `dev:debug` task starts or reuses
this workspace's hot reload server on port 8080. The startup task returns only
when readiness is confirmed, without relying on terminal output matching.
The development supervisor keeps Vite, extension, runtime, and assembly watchers
running in the background. Startup logs are shown in the task terminal and saved
under `artifacts/debug-startup-*.log`. Run the `dev:stop` task to stop a supervisor
started by F5. `pnpm dev` runs the same supervisor directly in a terminal.

## Localization

The extension initializes i18next without React. The browser initializes the
React plugin separately, using the same English and Simplified Chinese resources
from `@onapi/domain`. Webviews receive the selected language through HTML.

Supported build language values are `auto`, `en` and `zh-cn`. Restart watchers
after changing the configuration. Run `node scripts/check-localization.mjs` to
check editor/browser language fallback and VS Code manifest translations.

## UI and editors

UI components live under `apps/webviews/src/shared/ui/base`, with component
styles in CSS Modules. Run `pnpm check:ui` to prevent reintroducing removed UI
libraries and global styles. Embedded editors use CodeMirror 6; language parsers
and Prettier formatters remain lazy-loaded.

## README images

The README uses an actual VS Code screenshot at `docs/assets/onapi-vscode.png`
and a protocol overview at `docs/assets/onapi-protocols.png`. The overview uses
the repository's protocol icons in a minimal seven-card layout, without footer
annotations or corner fine print. Its layout and short labels are kept in
`scripts/generate-protocol-overview.mjs`:

```sh
node scripts/generate-protocol-overview.mjs
```

To refresh the plugin screenshot, build the extension and launch an isolated
development window using the command below. Populate that temporary profile with
sample requests, open OnAPI, and send a request to a demo API. Keep all seven
request types visible in the sidebar and resize the response pane so the result
is readable. Then capture the workbench and native sidebar directly:

```sh
node scripts/capture-readme-screenshot.mjs --cdp http://127.0.0.1:9333
```

The capture script leaves VS Code open and saves the screenshot plus
`docs/assets/onapi-native-sidebar.png`. Use only demo data without credentials.
Both rendering scripts require the Playwright Chromium installation described
above; the capture script connects to the running VS Code browser.

### Composed showcase (optional)

The generator is kept in `scripts/generate-readme-preview.mjs`. It renders the
real request editor using built Webview assets and sample response data, then
combines it with a real native tree screenshot and a simulated activity bar and
window. The PNG background is transparent; the window uses the same neutral dark
colors as the native tree.

```sh
pnpm build
pnpm exec playwright install chromium
node scripts/generate-readme-preview.mjs
```

The default output is `apps/webviews/public/images/onapi-preview.png`. The native
sidebar source is retained in `docs/assets/onapi-native-sidebar.png`, so the
composition can be regenerated without a running VS Code instance. To use a
fresh screenshot of just the native sidebar:

```sh
node scripts/generate-readme-preview.mjs --sidebar /path/to/native-sidebar.png
```

To capture a fresh sidebar directly, launch a separate VS Code instance with a
dedicated profile and a local debugging port. On macOS:

```sh
"/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" \
  --user-data-dir=/private/tmp/onapi-showcase-profile \
  --extensions-dir=/private/tmp/onapi-showcase-extensions \
  --extensionDevelopmentPath="$PWD/apps/extension" \
  --remote-debugging-port=9333 \
  --skip-welcome --skip-release-notes --new-window
```

Open **View: Show onapi** from the command palette, expand a sample collection,
and leave the Requests, Automation Tests, and Request History sections visible.
Use **Default Dark Modern** and show only sample data intended for publication.
Then run:

```sh
node scripts/generate-readme-preview.mjs --cdp http://127.0.0.1:9333
```

The fresh sidebar capture is also saved to `artifacts/onapi-native-sidebar.png`.
Copy it to `docs/assets/onapi-native-sidebar.png` to retain it for future runs.
The script disconnects after capture and leaves the VS Code window open.
`--output /path/to/preview.png` generates a separate preview for review.
