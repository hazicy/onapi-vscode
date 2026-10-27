# Protocol execution and events

All current execution paths share this boundary:

```text
HTTP / GraphQL / SSE -> HttpAdapter (Postman Worker) --+
WebSocket ----------> WebSocketAdapter --------------+-> ExecutionService
Socket.IO ----------> SocketIoAdapter --------------+        |
                                                       Host observer
                                                     /              \
                                                 Persistence     Webview relay
                                                                      |
                                                             protocolExecutionEvent
                                                                      |
                                                            Protocol-specific views
```

- `packages/contracts/src/execution.ts` defines the event envelope and wire data.
- `packages/core/src/execution/` defines `ProtocolAdapter`, `ExecutionContext` and
  `ExecutionService`. It uses no VS Code, Node or network APIs.
- `packages/runtime/src/{http,websocket,socketio}/` implements protocol execution.
  Socket clients and their proxy/TLS/variable preparation live here, not in the host.
- `apps/extension/src/platform/execution/` creates the shared service and relays
  its events to Webviews. Request handlers select destinations and persist HTTP
  variables, cookies and history; adapters cannot access panels or project storage.
- `apps/webviews/src/features/requests/execution/consume-event.ts` consumes the
  common channel and dispatches protocol data to the existing views.

Every execution supplies a unique `sessionId`. Core adds `protocolVersion: 1`,
`targetId`, a monotonically increasing per-execution `sequence`, and `timestamp`.
Core emits `session.started`, then adapter events, then `execution.completed`
and `session.closed`. Completion/closure carry `failed` when protocol events or
an exception reported an error. A failed send may report an error while its
connection remains open. Observer exceptions are logged without stopping network
execution or other observers. Publications after session closure are ignored.

HTTP callbacks map to `response.received`, `response.chunk`,
`assertion.completed`, `execution.error`, or `runtime.event`. All callbacks retain
`event.native` so scripts, response bytes, cookies, cursor and scope changes are
preserved. GraphQL and SSE continue using this HTTP adapter and their native
Postman definitions. `response.chunk` represents raw response data, not parsed
SSE messages.

Sockets publish `connection.opened`, `connection.closed`, `message.received`,
`message.sent`, and `execution.error` with protocol-specific `event.result`.
Socket.IO additionally publishes `ack.received` and `subscriptions.updated`,
including initial subscriptions and subsequent additions/removals. Cancellation
closes the protocol client. A replacement connection receives a new adapter and
session ID; the host suppresses the previous connection's events. The Webview
also rejects events for replaced sessions and duplicate/out-of-order sequence
numbers. Closing a panel cancels its socket adapters.

The current single-HTTP-execution policy remains: starting an HTTP run cancels
the previous Worker. Collections and request storage still use the existing
models. This change does not introduce a protocol registry, full Session API,
Typed RPC, GraphQL subscriptions, or parsed SSE events.

Verification: `pnpm test:unit` includes `tests/execution.test.mjs`, covering the
Core lifecycle, relay/UI dispatch, actual HTTP/GraphQL/SSE Worker execution,
assertions/scope updates, Worker failures/cancellation, WebSocket round trips,
and Socket.IO subscriptions/acks. Existing client suites run with
`pnpm test:websocket` and `pnpm test:socketio`.
