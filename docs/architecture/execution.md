# Request execution

`domain` owns saved request definitions. `contracts` owns messages and execution events. `core` owns execution lifecycles and resource ownership. `runtime` owns transport SDKs. The extension binds resource scopes to editors or runners and resolves project configuration; webviews own presentation and temporary execution state.

## Resource ownership

Every editor or runner has one `ExecutionScope`. A slot identifies a replaceable resource, such as `http`, `grpc:<target>`, or `mcp:<target>`. `reserve` installs the new owner before cancelling the previous resource. An `OwnedExecution` supports preparation before adapter attachment, cancellation during preparation, and correlated execution through `ExecutionService`. Only the current entry can forward events or release its slot.

MCP's connection and its requests occupy different slots. Closing a panel disposes its entire scope. Extension deactivation disposes registered scopes, including headless runners. A completed implicit HTTP runner unregisters its owner. Cancellation failures are isolated so one resource cannot prevent another from closing.

## Execution input

`createRequestExecutionContext` captures configured variables and network policy. Variable precedence is global → collection → ancestor folders → request → environment. Disabled variables fall back to broader scopes. Resolution creates an execution copy and preserves command identity. Each transport translates policy into its own SDK options; Postman HTTP scripting and gRPC channel behavior stay in their adapters.

## gRPC service definitions

A saved gRPC request contains `grpc.definition`, which is either `{ source: "proto", files }` or `{ source: "reflection", descriptorSet? }`. Call settings, credentials, message text and the selected method are separate fields. Method lists, examples, field descriptions and execution results are never persisted in the request definition.

The webview sends only request identity for discovery and invocation. The host reads the current document snapshot. Reopening a request describes its saved service definition locally; explicit refresh uses server reflection again. In-flight discovery cannot overwrite a definition that was edited or reverted in the meantime.

Runtime parsing uses a content-addressed LRU cache, keyed by raw definition content and codec options. The cache deduplicates concurrent parses and retains at most 16 entries and 32 MiB of source material. Failed loads are removed. The cache contains no credentials, channels or mutable call state. Persisted sources support offline reopening without storing duplicate derived schemas.

Storage format changes are intentional during pre-release development. There are no migration branches for the former gRPC configuration or protocol-tree representation.
