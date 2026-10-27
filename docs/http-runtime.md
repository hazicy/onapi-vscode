# Native Postman runtime

HTTP, GraphQL and SSE use Postman Collection SDK definitions throughout storage,
editing, import/export, and execution. There is no legacy runtime adapter or task
compiler, and no migration of historical request data.

- Requests use `request.method`, `request.url`, `request.header[]` and native
  `body`/`auth` definitions.
- The shared editor request type is `HttpRequest`; HTTP, GraphQL and SSE details
  use the same SDK request definition. Body, auth and script controls have one
  format and do not select between old and new request schemas.
- Onapi document types live under `import/types/onapi.ts` and are used only at
  file conversion boundaries. Shared socket parameters are separate from HTTP
  Collection inheritance; socket ancestry does not compile HTTP requests.
- Scripts use `event[]`, with `listen: "prerequest"` or `"test"` and
  `script.exec[]`. Assertions and extraction are ordinary `pm.test` and
  `pm.environment.set` / `pm.globals.set` scripts.
- Environments and globals are native VariableScope definitions with `values[]`.
- The authoritative HTTP data is the nested Collection at
  `projectConfig.http.collection`. Tree metadata is kept separately in
  `itemMetadata`; the flat list returned to tree views is a UI projection.
- Collection runs pass native `entrypoint`, `iterationCount`, `data`, `delay`,
  `timeout`, and `requester` options directly to `Runner.run`.
- Results retain the official callbacks' `cursor`, `request`, `response`,
  `assertions`, and script results. The UI reads native headers and response
  bytes instead of a custom response schema.

[runtime/postman.js](../packages/runtime/src/http/postman.js) is only a Worker transport
for the official `Runner.run` / `run.start` API. It rehydrates serialized SDK
scopes and cookie jars and serializes callback events across the Worker boundary.
[HttpAdapter](../packages/runtime/src/http/adapter.ts) owns Worker execution and
maps callbacks into the shared Core event channel. The host
[http-runner.ts](../apps/extension/src/features/requests/execution/http-runner.ts) persists
native variable/cookie updates. The old custom `pm` aliases, Faker-expression
translation, visual task objects, and custom loop/condition scheduler are gone.
Use the official Postman scripting API and collection execution controls.

Postman collection import/export preserves scripts, inherited auth and variable
definitions without substituting or flattening their values. OpenAPI and Thunder
conversion happens only at external file boundaries. HAR remains an external
code-generation format.

WebSocket and Socket.IO continue to use their own protocol clients and request
models. They read the selected native variable scopes, but do not run through
Postman Runtime.

`pnpm package` builds a self-contained runtime at
`dist/postman.cjs`. `pnpm test:unit` covers native execution,
serialized cookies, collection persistence, scripts and imports. The native
browser flows are covered by `apps/webviews/tests/ui/native.spec.ts` and startup tests.

Business code uses `HttpProjectConfig`, `requestRunner` and the unified
`protocolExecutionEvent` channel. HTTP events retain native Postman callbacks in
`event.native`; socket events retain their protocol-specific results. See
[execution architecture](./execution-architecture.md). Postman names identify the runtime implementation and
collection import/export format. Project configurations use the `http` key; historical keys are not read.
