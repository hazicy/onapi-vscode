# Request panel messaging

The request editor and extension host share the Zod schemas in
[request-panel/index.ts](../packages/contracts/src/request-panel/index.ts), exported through
`@onapi/contracts/request-panel`. Keep the schemas independent of VS Code,
browser globals and feature handlers. Command and response types are inferred
from the schemas; do not derive wire types from host function signatures.

The contract directory separates command schemas (`commands.ts`), response
schemas (`responses.ts`) and shared payload schemas (`schemas.ts`). Its `index.ts`
is the public entrypoint. Host transport lives in
[request-panel-channel.ts](../apps/extension/src/platform/webviews/request-panel-channel.ts),
Webview transport in
[bridge/request-panel.ts](../apps/webviews/src/shared/bridge/request-panel.ts),
and business dispatch in
[request-panel-handler.ts](../apps/extension/src/features/requests/request-panel-handler.ts).
HTTP, GraphQL and SSE records are defined in the domain
[record.ts](../packages/domain/src/requests/record.ts). Contracts reuse that schema,
and the editor store consumes its inferred types directly, without a cast adapter.

## Boundaries

- Webview features call `sendRequestPanelMessage`. It checks command shapes at
  compile time and assigns a `requestId` when the caller does not supply one.
- The host receives `unknown` and calls `safeParse` before dispatching. Invalid
  commands never reach handlers. Async handler failures return `requestPanelError`
  with the panel target ID. Socket preparation failures clear only the pending
  connection whose target ID and command `requestId` both match.
- Host handlers use `postRequestPanelResponse` for typed replies. Replies to
  saves, reads, code generation, proxy fetches and GraphQL schema fetches carry
  the originating `requestId`; broadcasts have no originating command.
- Webview listeners call `readRequestPanelResponse` before updating state.
  Unrelated channels such as OAuth popup messages are ignored.
- HTTP execution continues to use `executionId`; streaming protocol events use
  the existing session identity and sequence checks. `requestId` correlates
  commands and replies, while execution identity controls the ongoing run.

## Payloads

Message envelopes are strict. SDK request definitions, native execution payloads
and editor metadata retain extension fields. Draft URLs may be empty or contain
variable expressions. Schemas do not resolve variables or enforce URL reachability.
The `extensibleObject` helper preserves extra fields at runtime and exposes
only declared fields in the schema's input and output types. Senders use
`z.input<typeof schema>` directly; no recursive input-type mapping is needed.
HTTP records validate native URLs, headers, authentication attributes, bodies,
scripts and response examples. Optional metadata remains optional; validation
does not fill defaults or change user data. Bootstrap data is validated before
hydration, and invalid initial records display an error instead of mounting an
invalid editor. Other protocols retain their existing feature models and use
identity/metadata validation at this boundary. Remote response bodies remain
opaque payloads.

When adding a command, update the shared schema and handler, then call the typed
sender. Add a response schema for new replies and validate it in the listener.
Tests cover invalid messages, request correlation, async errors, metadata
preservation and stale execution failures. The contracts package also compiles
negative type examples to protect the sender interface.

## JSON Schema tooling

Zod validates this application's message protocol. Generated data is checked
against JSON Schema using the existing `jsonschema` development dependency in
[mockBundling.test.mjs](../tests/mockBundling.test.mjs).
