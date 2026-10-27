# Workspace architecture

The repository uses pnpm workspaces. Node.js 22.19+ is required for development;
the bundled extension and request runtime target the VS Code Node.js host.
The package manager version is pinned in the root `package.json`.

## Ownership

| Workspace                | Responsibility                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------- |
| `apps/extension`         | VS Code activation, panels, native trees, storage, Worker lifecycle and VSIX manifest                 |
| `apps/webviews`          | React multi-entry application, stores, UI components and browser tests                                |
| `packages/domain`        | Native request/config models, shared protocol definitions, pure request utilities and Mock generation |
| `packages/contracts`     | Serializable Worker commands and execution events shared by host and UI                               |
| `packages/runtime`       | HTTP Worker, WebSocket and Socket.IO protocol execution; no VS Code or UI dependency                  |
| `packages/api-converter` | External import/export formats and collection conversion boundaries                                   |
| `tooling`                | Shared TypeScript configurations and build plugins                                                    |
| `tests`                  | Module regressions, cross-workspace integration and persistence tests                                 |

Shared packages expose explicit workspace entrypoints. Source packages are
compiled by the consuming Vite/esbuild build; they do not produce redundant
JavaScript distributions. Runtime is separately bundled because it runs in a
Worker outside the application module graph. Postman Collection definitions
remain the native request schema, not a second custom transport representation.

Every workspace declares its own dependencies using `workspace:*` for local
packages. Cross-package relative imports are forbidden. The `@/` alias is local
to Webviews. `pnpm check:boundaries` verifies these rules and dependency ownership.

Within Webviews, shared modules must not add imports from application or feature
modules. The checker resolves both aliases and relative imports and rejects all
such edges, including re-exports and literal dynamic imports, without legacy
exceptions. Feature stores are imported directly
from their owner, rather than re-exported by `app/store`. Generic Zustand helpers
and UI services live in `shared/state`; application state remains in `app/store`.

## Domain and contract boundaries

`domain` owns shared product data models, defaults, and pure business-data
operations, including request protocols, projects, environments, users and
settings. It contains no UI state, storage implementation or protocol execution.
`contracts` owns serializable execution commands and events
between the host, Worker, and Webview. Contracts may reference model types;
models must not depend on contracts, Core, runtime, or either application.
`pnpm check:boundaries` enforces this dependency direction.

Socket events carry detected MIME types in `contentType`. The Webview selects
its renderer when consuming an event; runtime and contracts do not name UI
components. Host-only socket parameter preparation lives in
`apps/extension/src/features/requests/execution/`, outside both shared
packages. A type being used during execution does not make it a wire contract.

The domain package still includes shared application configuration and Mock
utilities used by multiple consumers. These are existing responsibilities, not
an invitation to add unrelated business features. New feature-specific code
belongs with its owner; extract another package only when consumers justify it.

## Source layout and naming

Extension code is grouped by feature. `extension.ts` is the activation entry;
`app/` owns initialization and application configuration. `features/`
contains sidebar, requests, collections, environment, import, export, sharing,
sync, testing, cURL and documentation code. Each feature owns its message
handlers and panels. `platform/` contains storage, localization, themes, HTTP
transport and shared Webview setup. Workspace configuration lives in
`platform/storage/project-config.ts`, request persistence in
`features/requests/request-storage.ts`, and reports in
`features/testing/report-storage.ts`. Import these owners directly; there is no
cross-feature project-context facade.

Each request Webview owns one active document and execution result. The collection
list is the only writable source for saved requests; lookup indexes are derived
selectors. HTTP environments, globals and cookies live in `http`; Socket-specific
server and environment settings retain their separate protocol responsibilities.
`platform/webviews/create-panel.ts` owns script paths, resources and common options;
feature panels own reuse, messages and disposal.

```text
apps/extension/src/
  extension.ts
  app/
  features/
    requests/
      request-history.ts
      request-status.ts
      request-server.ts
      execution/
        http-runner.ts
        merge-http-state.ts
        websocket-session.ts
        socketio-session.ts
        prepare-socket-options.ts
        socket-option-types.ts
        socket-option-values.ts
        socket-settings.ts
    sidebar/
    collections/
    environment/
    import/
    export/
    sharing/
    sync/
    testing/
    curl/
    documentation/
  platform/
    storage/
    locale/
    webviews/
```

Webviews retains `app/`, `features/` and `shared/`; see its
[source conventions](../apps/webviews/src/README.md). Domain exposes domain
paths directly, such as `@onapi/domain/requests/types/api`,
`@onapi/domain/environment/types/index` and `@onapi/domain/mock/schema`.
It has no extra `features/` or `shared/` directory layer. API Converter groups
format implementations under `formats/`, application model adaptation under
`adapters/`, and the import/export facade in `export.ts`.

- Use kebab-case for ordinary module filenames and non-component directories:
  `http-runner.ts`, `collection-tree.ts`, `data-tools.ts`.
- Use PascalCase for React component files and component directories, and match
  CSS Module names to their component. Hooks use `useSomething.ts`.
- Use camelCase for functions and variables, PascalCase for types and interfaces,
  and UPPER_SNAKE_CASE for fixed constants. Do not add an `I` prefix to interfaces.
- Prefer names that state a responsibility. New business logic belongs in its
  owning feature rather than a generic `utils.ts` or `common.ts` module.
- Reserve `index.ts` for package, directory or component entrypoints. Name
  implementation modules explicitly.
- Preserve serialized field names, VS Code command IDs, panel IDs, localization
  keys and generated bundle names when moving or renaming source modules.
- WebSocket uses `websocket` for the stored target type, source paths and event
  dispatch keys, and `WebSocket` in type and hook names.
- Keep conventional metadata filenames such as `README.md` and `LICENSE.txt`.

Existing Webview utility and test filenames can adopt these conventions as their
modules are reorganized. Root tests currently include module regressions and
cross-workspace integration tests; browser tests belong to Webviews and VS Code
host tests belong to the extension.

## Build and package

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm package
```

Webviews writes `apps/webviews/dist`; the extension host writes
`apps/extension/.build`; Runtime writes `packages/runtime/dist`.
Only `scripts/assemble-extension.mjs` writes the final `apps/extension/dist`:

```text
apps/extension/dist/
  extension.js
  extension-*.js
  webviews/                 # eight panel entrypoints, chunks, fonts and assets
  runtime/
    worker.js
    postman.cjs
    licenses/
  images/                   # native VS Code icons
  redoc.standalone.js
  licenses/
```

VSIX files are generated in `artifacts/`. Packaging uses the extension's own
manifest and bundles dependencies; it does not ship workspace links or
`node_modules`. The Marketplace identity remains `hazicy.onapi`.
The build checks emitted JavaScript and runs the assembled Worker.

## Development and checks

```sh
pnpm dev                    # initial build, Vite HMR, host/runtime watchers and assembly
pnpm lint
pnpm check:boundaries
pnpm test:unit
pnpm test:ui
pnpm test:editor
pnpm test:websocket
pnpm test:socketio
pnpm typecheck
```

F5 uses `apps/extension` as `extensionDevelopmentPath`. Per-workspace checks can
also be run with `pnpm --dir packages/domain typecheck`, for example.
Development uses the same package exports as production; there are no aliases
that redirect library imports into another package's private source tree.

The workspace split does not suppress existing frontend TypeScript errors.
`pnpm typecheck` reports them; shared packages are checked independently.

### Shared Mock metadata and regression boundaries

`packages/domain/src/mock/faker-definitions.json` is the single source for Faker
function names, arguments and descriptions. Both the expression engine and the
variable picker consume it directly; do not add a separate UI fallback catalog.
The picker uses `Module.function` names so its expressions can execute unchanged.

Module regressions may provide explicit host/UI mocks through
`tests/helpers/loadTypeScript.mjs`. Mocks must use the source import path and
provide every imported name; the loader does not retry historical aliases or
invent missing named exports. `tests/workspaceEntrypoints.test.mjs` additionally
bundles public workspace entrypoints and variable utilities without mocks to
verify real module wiring.
