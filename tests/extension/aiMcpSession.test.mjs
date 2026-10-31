import { owners } from "../helpers/executionOwners.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "../helpers/loadTypeScript.mjs";

const { ExecutionService } = await load(
  "packages/core/src/execution/service.ts",
  nativeDependency,
  { console },
);
const service = new ExecutionService();
const run = (adapter, request, events) =>
  service.execute(adapter, request, {
    sessionId: "run",
    targetId: "request",
    observer: (event) => events.push(event),
  });
const config = {
  model: "test",
  system: "",
  messages: [{ role: "user", content: "hello" }],
  temperature: 0,
  maxOutputTokens: 32,
  headers: {},
};
const abortHelpers = await load(
  "packages/runtime/src/network/abort.ts",
  nativeDependency,
);
const network = {
  createNetworkClient: (_, fetch) => ({ fetch, close: async () => {} }),
};

async function aiFixture(streamFactory) {
  const { AiAdapter } = await load(
    "packages/runtime/src/ai/adapter.ts",
    (id) => {
      if (id === "../network/abort") return abortHelpers;
      if (id === "../network/fetch") return network;
      if (id === "ai") return { streamText: streamFactory };
      if (id === "@ai-sdk/openai-compatible")
        return { createOpenAICompatible: () => (model) => model };
      throw new Error(id);
    },
    { AbortController, Error },
  );
  return new AiAdapter();
}
test("AI runs through the core, publishes ordered deltas, usage and one terminal lifecycle", async () => {
  let options;
  const adapter = await aiFixture((input) => {
    options = input;
    return {
      fullStream: (async function* () {
        yield { type: "text-delta", text: "hello" };
      })(),
      usage: { outputTokens: 1 },
      finishReason: "stop",
    };
  });
  const events = [];
  await run(adapter, { url: "http://localhost/v1", config }, events);
  assert.equal(options.temperature, 0);
  assert.deepEqual(
    events.map((e) => e.sequence),
    [1, 2, 3, 4, 5],
  );
  assert.deepEqual(
    events.map((e) => e.event.type),
    [
      "session.started",
      "response.chunk",
      "response.received",
      "execution.completed",
      "session.closed",
    ],
  );
  assert.equal(events[2].event.value.usage.outputTokens, 1);
});
test("AI cancellation preserves partial deltas and completes without reporting an error", async () => {
  let started;
  const ready = new Promise((resolve) => {
    started = resolve;
  });
  const adapter = await aiFixture(({ abortSignal }) => ({
    fullStream: (async function* () {
      yield { type: "text-delta", text: "partial" };
      started();
      await new Promise((resolve) =>
        abortSignal.addEventListener("abort", resolve, { once: true }),
      );
      throw new Error("aborted");
    })(),
  }));
  const events = [];
  const pending = run(adapter, { url: "http://localhost/v1", config }, events);
  await ready;
  adapter.cancel();
  await pending;
  assert.equal(
    events.some((e) => e.event.type === "execution.cancelled"),
    true,
  );
  assert.equal(
    events.some((e) => e.event.type === "execution.error"),
    false,
  );
  assert.equal(events.at(-1).event.failed, false);
});
test("AI SDK stream errors have a correlated failure and terminal lifecycle", async () => {
  const adapter = await aiFixture(() => ({
    fullStream: (async function* () {
      yield { type: "error", error: new Error("provider failed") };
    })(),
  }));
  const events = [];
  await assert.rejects(
    run(adapter, { url: "http://localhost/v1", config }, events),
    /provider failed/,
  );
  assert.equal(events.at(-1).event.failed, true);
  assert.equal(
    events.filter((e) => e.event.type === "execution.error").length,
    1,
  );
});
async function mcpFixture({ pending = false, unresponsive = false } = {}) {
  const clients = [];
  let releaseConnect;
  let ready;
  const started = new Promise((resolve) => {
    ready = resolve;
  });
  class Client {
    constructor() {
      clients.push(this);
    }
    async connect(transport, options) {
      this.transport = transport;
      ready();
      if (pending)
        await new Promise((resolve, reject) => {
          releaseConnect = resolve;
          if (!unresponsive)
            options.signal.addEventListener(
              "abort",
              () => reject(new Error("aborted")),
              { once: true },
            );
        });
    }
    async close() {
      this.closed = true;
      this.onclose?.();
    }
    getServerVersion() {
      return { name: "fixture" };
    }
    getServerCapabilities() {
      return { tools: {} };
    }
    async listTools(params) {
      return {
        tools: [{ name: params?.cursor ? "second" : "first" }],
        nextCursor: params?.cursor ? undefined : "page-2",
      };
    }
    async callTool() {
      return {
        isError: true,
        content: [{ type: "text", text: "Tool failed" }],
      };
    }
  }
  class Transport {
    constructor(...args) {
      this.args = args;
    }
  }
  const module = await load(
    "packages/runtime/src/mcp/adapter.ts",
    (id) => {
      if (id === "../network/abort") return abortHelpers;
      if (id === "../network/fetch") return network;
      if (id.endsWith("client/index.js")) return { Client };
      if (id.endsWith("streamableHttp.js"))
        return { StreamableHTTPClientTransport: Transport };
      if (id.endsWith("sse.js")) return { SSEClientTransport: Transport };
      if (id.endsWith("stdio.js")) return { StdioClientTransport: Transport };
      throw new Error(id);
    },
    { URL, AbortController, AbortSignal, Error },
  );
  return {
    ...module,
    clients,
    started,
    releaseConnect: () => releaseConnect?.(),
  };
}
const connectionRequest = (transport) => ({
  url: "http://localhost/mcp",
  config: {
    transport,
    headers: { Authorization: "Bearer test" },
    command: "node",
    args: ["fixture.js"],
  },
});
test("MCP cancel during initialization closes the pending client immediately", async () => {
  const f = await mcpFixture({ pending: true });
  const adapter = new f.McpAdapter();
  const events = [];
  const pending = run(adapter, connectionRequest("stdio"), events);
  await f.started;
  await adapter.cancel();
  assert.equal(f.clients[0].closed, true);
  await pending;
  assert.equal(
    events.some((e) => e.event.type === "connection.opened"),
    false,
  );
  assert.equal(events.at(-1).event.type, "session.closed");
});
test("MCP connection and individual requests have independent lifecycles and support cursors", async () => {
  for (const transport of ["http", "sse", "stdio"]) {
    const f = await mcpFixture();
    const adapter = new f.McpAdapter();
    const events = [];
    const connected = run(adapter, connectionRequest(transport), events);
    await f.started;
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(events.at(-1).event.type, "connection.opened");
    if (transport !== "stdio")
      assert.equal(
        f.clients[0].transport.args[1].requestInit.headers.Authorization,
        "Bearer test",
      );
    const requestEvents = [];
    await run(
      new f.McpRequestAdapter(adapter),
      { method: "tools/list", cursor: "page-2" },
      requestEvents,
    );
    assert.equal(
      requestEvents.find((e) => e.event.type === "response.received").event
        .value.tools[0].name,
      "second",
    );
    assert.equal(f.clients[0].closed, undefined);
    const errors = [];
    await run(
      new f.McpRequestAdapter(adapter),
      { method: "tools/call", name: "failing", arguments: {} },
      errors,
    );
    assert.equal(errors.at(-1).event.failed, true);
    await adapter.cancel();
    await connected;
    assert.equal(f.clients[0].closed, true);
  }
});
test("protocol model validation rejects malformed saved configuration and keeps raw editor drafts", async () => {
  const { editorRecordSchema } = await load(
    "packages/domain/src/requests/record.ts",
    nativeDependency,
  );
  const base = { id: "request", parentId: "0", name: "Test" };
  for (const kind of ["ai", "mcp"]) {
    const parsed = editorRecordSchema.parse({
      ...base,
      kind,
      draft: { headersText: "{unfinished" },
    });
    assert.equal(parsed.draft.headersText, "{unfinished");
  }
  assert.equal(
    editorRecordSchema.safeParse({
      ...base,
      kind: "ai",
      ai: { model: "test", temperature: 99 },
    }).success,
    false,
  );
  assert.equal(
    editorRecordSchema.safeParse({
      ...base,
      kind: "mcp",
      mcp: { args: "invalid" },
    }).success,
    false,
  );
});

test("host connection replacement and disposal cancel adapters and suppress obsolete events", async () => {
  const adapters = [];
  class Connection {
    constructor() {
      this.protocol = "mcp";
      adapters.push(this);
    }
    async execute(_, context) {
      this.context = context;
      await new Promise((resolve) => {
        this.release = resolve;
      });
    }
    async cancel() {
      this.cancelled = true;
      this.release?.();
    }
  }
  const { handleAiMcpCommand } = await load(
    "apps/extension/src/features/requests/execution/ai-mcp-session.ts",
    (id) => {
      if (id.endsWith("/execution/owners")) return owners;
      if (id === "@onapi/runtime/ai/adapter") return { AiAdapter: class {} };
      if (id === "@onapi/runtime/mcp/adapter")
        return { McpAdapter: Connection, McpRequestAdapter: class {} };
      if (id.endsWith("/execution/service"))
        return { executionService: service };
      if (id.endsWith("/execution/webview-relay"))
        return {
          relayExecutionEvent: (target, event) => target.postMessage(event),
        };
      throw new Error(id);
    },
    { console },
  );
  let dispose;
  const events = [];
  const panel = {
    webview: { postMessage: (event) => events.push(event) },
    onDidDispose: (callback) => {
      dispose = callback;
    },
  };
  const command = (requestId) => ({
    action: "mcp_connect",
    requestId,
    data: { id: "mcp", ...connectionRequest("http") },
  });
  await handleAiMcpCommand(command("first"), panel);
  await new Promise((resolve) => setImmediate(resolve));
  await handleAiMcpCommand(command("second"), panel);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(adapters[0].cancelled, true);
  const count = events.length;
  adapters[0].context.publish({
    protocol: "mcp",
    type: "connection.opened",
    value: {},
  });
  assert.equal(events.length, count);
  dispose();
  assert.equal(adapters[1].cancelled, true);
  adapters[1].context.publish({
    protocol: "mcp",
    type: "connection.opened",
    value: {},
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(events.length, count);
});

test("MCP cancellation settles even when a transport never finishes starting", async () => {
  const f = await mcpFixture({ pending: true, unresponsive: true });
  const adapter = new f.McpAdapter();
  const events = [];
  const pending = run(adapter, connectionRequest("sse"), events);
  await f.started;
  await adapter.cancel();
  await pending;
  assert.equal(f.clients[0].closed, true);
  assert.equal(events.at(-1).event.type, "session.closed");
});

test("gRPC wire calls contain only identity and saved definitions reject derived method lists", async () => {
  const { requestPanelCommandSchema } = await load(
    "packages/contracts/src/request-panel/commands.ts",
    nativeDependency,
  );
  const { grpcConfigSchema } = await load(
    "packages/domain/src/requests/grpc.ts",
    nativeDependency,
  );
  assert.equal(
    requestPanelCommandSchema.safeParse({
      action: "grpc_invoke",
      requestId: "run",
      data: { id: "grpc" },
    }).success,
    true,
  );
  assert.equal(
    requestPanelCommandSchema.safeParse({
      action: "grpc_invoke",
      requestId: "run",
      data: { id: "grpc", config: {} },
    }).success,
    false,
  );
  assert.equal(
    grpcConfigSchema.safeParse({
      definition: { source: "reflection" },
      methods: [],
    }).success,
    false,
  );
  assert.equal(
    grpcConfigSchema.safeParse({ source: "reflection", files: [] }).success,
    false,
  );
});
