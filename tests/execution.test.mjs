import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { build } from "esbuild";
import { createServer } from "node:http";
import { once } from "node:events";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { fakerLocalesEsbuild } from "../tooling/build/faker-locales.mjs";
import { buildRuntime } from "../scripts/build-runtime.mjs";

let modules, server, address;
before(async () => {
  await build({
    stdin: {
      contents: `
      export { ExecutionService } from './packages/core/src/index.ts';
      export { HttpAdapter } from './packages/runtime/src/http/adapter.ts';
      export { WebSocketAdapter } from './packages/runtime/src/websocket/adapter.ts';
      export { SocketIoAdapter } from './packages/runtime/src/socketio/adapter.ts';
      export { createExecutionConsumer } from './apps/webviews/src/features/requests/execution/consume-event.ts';
      export { relayExecutionEvent } from './apps/extension/src/platform/execution/webview-relay.ts';
    `,
      resolveDir: process.cwd(),
      loader: "ts",
    },
    outfile: "test-results/execution.cjs",
    bundle: true,
    platform: "node",
    format: "cjs",
    plugins: [
      fakerLocalesEsbuild(),
      {
        name: "workspace",
        setup(builder) {
          builder.onResolve({ filter: /^@onapi\// }, (args) => {
            const require = createRequire(
              path.join(args.resolveDir, "entry.js"),
            );
            return { path: require.resolve(args.path) };
          });
        },
      },
    ],
  });
  modules = createRequire(import.meta.url)("../test-results/execution.cjs");
});

test("core emits ordered lifecycles, isolates observers, and ignores late events", async () => {
  const errors = [],
    events = [];
  const service = new modules.ExecutionService((error) => errors.push(error));
  let late;
  const unsubscribe = service.subscribe(() => {
    throw new Error("broken view");
  });
  const result = await service.execute(
    {
      protocol: "websocket",
      cancel() {},
      async execute(_, context) {
        late = context.publish;
        context.publish({
          protocol: "websocket",
          type: "connection.opened",
          result: { type: "connection" },
        });
        return 42;
      },
    },
    {},
    {
      sessionId: "one",
      targetId: "target",
      observer: (event) => events.push(event),
    },
  );
  unsubscribe();
  late({ protocol: "websocket", type: "message.received", result: {} });
  assert.equal(result, 42);
  assert.deepEqual(
    events.map((e) => e.event.type),
    [
      "session.started",
      "connection.opened",
      "execution.completed",
      "session.closed",
    ],
  );
  assert.deepEqual(
    events.map((e) => e.sequence),
    [1, 2, 3, 4],
  );
  assert.equal(errors.length, 4);
  assert.ok(
    events.every(
      (e) =>
        e.sessionId === "one" &&
        e.targetId === "target" &&
        e.protocolVersion === 1,
    ),
  );
});

test("core closes failed executions and marks reported protocol failures", async () => {
  const service = new modules.ExecutionService();
  const events = [];
  await assert.rejects(
    service.execute(
      {
        protocol: "http",
        cancel() {},
        async execute() {
          throw new Error("failed");
        },
      },
      {},
      {
        sessionId: "failed",
        observer: (e) => events.push(e),
      },
    ),
    /failed/,
  );
  assert.deepEqual(
    events.map((e) => e.event.type),
    [
      "session.started",
      "execution.error",
      "execution.completed",
      "session.closed",
    ],
  );
  assert.equal(events.at(-1).event.failed, true);
  const reported = [];
  await service.execute(
    {
      protocol: "http",
      cancel() {},
      async execute(_, context) {
        context.publish({
          protocol: "http",
          type: "runtime.event",
          native: { type: "done", error: { message: "network failure" } },
        });
      },
    },
    {},
    { sessionId: "reported", observer: (e) => reported.push(e) },
  );
  assert.equal(reported.at(-1).event.failed, true);
});

test("host relays a single channel and UI rejects replaced sessions and duplicate events", () => {
  const consume = modules.createExecutionConsumer(),
    received = [];
  const views = {
    http: (e) => received.push(e),
    websocket: (e) => received.push(e),
    socketio: (e) => received.push(e),
  };
  const envelope = (sessionId, sequence, event) => ({
    protocolVersion: 1,
    sessionId,
    targetId: "target",
    sequence,
    timestamp: 1,
    event,
  });
  consume(
    envelope("old", 1, { protocol: "http", type: "session.started" }),
    views,
  );
  consume(
    envelope("new", 1, { protocol: "http", type: "session.started" }),
    views,
  );
  const response = envelope("new", 2, {
    protocol: "http",
    type: "response.received",
    native: { type: "request", response: { code: 200 } },
  });
  consume(response, views);
  consume(response, views);
  consume(
    envelope("old", 3, {
      protocol: "http",
      type: "runtime.event",
      native: { type: "done" },
    }),
    views,
  );
  assert.equal(received.length, 1);
  assert.equal(received[0].response.code, 200);
  let relayed;
  modules.relayExecutionEvent(
    {
      postMessage: (e) => {
        relayed = e;
      },
    },
    response,
  );
  assert.deepEqual(relayed, {
    action: "protocolExecutionEvent",
    data: response,
  });
});

test("socket view preserves ack/subscription payloads and send-error connection semantics", () => {
  const consume = modules.createExecutionConsumer(),
    received = [];
  const views = {
    http() {},
    websocket: (e) => received.push(e),
    socketio: (e) => received.push(e),
  };
  let sequence = 0;
  const publish = (event) =>
    consume(
      {
        protocolVersion: 1,
        sessionId: "socket",
        targetId: "target",
        sequence: ++sequence,
        timestamp: 1,
        event,
      },
      views,
    );
  publish({ protocol: "socketio", type: "session.started" });
  publish({
    protocol: "socketio",
    type: "ack.received",
    result: { type: "send_ack", message: { event: "echo", data: [1, 2] } },
  });
  publish({
    protocol: "socketio",
    type: "subscriptions.updated",
    subscriptions: { addedEvents: ["echo"], removedEvents: [] },
  });
  publish({
    protocol: "socketio",
    type: "execution.error",
    result: { type: "error", isSuccess: false, message: "bad send" },
  });
  assert.deepEqual(
    received.map((e) => e.action),
    ["received", "updateEvent", "received"],
  );
  assert.deepEqual(received[0].message.message.data, [1, 2]);
});

test("socket rendering is selected by the Webview without changing wire results", () => {
  const consume = modules.createExecutionConsumer();
  const received = [];
  const views = {
    http() {},
    websocket: (event) => received.push(event),
    socketio: (event) => received.push(event),
  };
  let sequence = 0;
  const publish = (protocol, type, result) =>
    consume(
      {
        protocolVersion: 1,
        sessionId: protocol,
        targetId: "target",
        sequence: ++sequence,
        timestamp: 1,
        event: { protocol, type, ...(result ? { result } : {}) },
      },
      views,
    );
  publish("websocket", "session.started");
  for (const [contentType, renderer] of [
    ["image/png", "Image"],
    ["image/svg+xml", "Image"],
    ["application/pdf", "Other"],
    [undefined, "Monaco"],
  ]) {
    const result = { type: "message", dataType: "binary", contentType };
    publish("websocket", "message.received", result);
    assert.equal(received.at(-1).message.fitForShow, renderer);
    assert.equal("fitForShow" in result, false);
    assert.equal(received.at(-1).message.contentType, contentType);
  }
  publish("socketio", "session.started");
  publish("socketio", "message.received", {
    type: "message",
    message: "hello",
  });
  assert.equal(received.at(-1).message.fitForShow, "Monaco");
});

function nextEvent(service, type) {
  return new Promise((resolve) => {
    const unsubscribe = service.subscribe((envelope) => {
      if (envelope.event.type === type) {
        unsubscribe();
        resolve(envelope);
      }
    });
  });
}

test(
  "WebSocket adapter runs connection, send, receive and disconnect through core",
  { timeout: 10000 },
  async (t) => {
    const { WebSocketServer } = createRequire(
      new URL("../packages/runtime/package.json", import.meta.url),
    )("ws");
    const http = createServer(),
      sockets = new WebSocketServer({ server: http });
    sockets.on("connection", (socket) =>
      socket.on("message", (data, binary) => socket.send(data, { binary })),
    );
    t.after(() => {
      for (const socket of sockets.clients) socket.terminate();
      sockets.close();
      http.close();
    });
    http.listen(0, "127.0.0.1");
    await once(http, "listening");
    const service = new modules.ExecutionService(),
      events = [];
    service.subscribe((e) => events.push(e));
    const opened = nextEvent(service, "connection.opened"),
      adapter = new modules.WebSocketAdapter();
    const execution = service.execute(
      adapter,
      { target: { url: `ws://127.0.0.1:${http.address().port}` }, option: {} },
      { sessionId: "ws" },
    );
    await opened;
    const received = nextEvent(service, "message.received");
    await adapter.send({ msg: "hello" });
    assert.equal((await received).event.result.data.toString(), "hello");
    adapter.cancel();
    await execution;
    assert.ok(events.some((e) => e.event.type === "message.sent"));
    assert.ok(events.some((e) => e.event.type === "connection.closed"));
    assert.equal(events.at(-1).event.type, "session.closed");
  },
);

test(
  "Socket.IO adapter preserves initial subscriptions, ack and subscription changes through core",
  { timeout: 10000 },
  async (t) => {
    const { Server } = createRequire(import.meta.url)("socket.io");
    const http = createServer(),
      sockets = new Server(http);
    sockets.on("connection", (socket) =>
      socket.on("echo", (data, ack) => {
        ack(data);
        socket.emit("reply", data);
      }),
    );
    t.after(() => {
      sockets.close();
      http.close();
    });
    http.listen(0, "127.0.0.1");
    await once(http, "listening");
    const service = new modules.ExecutionService(),
      events = [];
    service.subscribe((e) => events.push(e));
    const opened = nextEvent(service, "connection.opened"),
      adapter = new modules.SocketIoAdapter();
    const execution = service.execute(
      adapter,
      {
        target: {
          url: `ws://127.0.0.1:${http.address().port}`,
          request: { event: { parameter: [{ key: "reply", value: "1" }] } },
        },
        option: {},
      },
      { sessionId: "io" },
    );
    await opened;
    const ack = nextEvent(service, "ack.received"),
      reply = nextEvent(service, "message.received");
    await adapter.send({
      event: "echo",
      msg: '{"value":42}',
      type: "json",
      is_ack: true,
    });
    assert.deepEqual((await ack).event.result.message, {
      event: "echo",
      data: { value: 42 },
    });
    assert.deepEqual((await reply).event.result.message, {
      event: "reply",
      data: { value: 42 },
    });
    adapter.updateEvent([{ key: "next", value: "1" }]);
    assert.deepEqual(
      events
        .filter((e) => e.event.type === "subscriptions.updated")
        .map((e) => e.event.subscriptions),
      [
        { addedEvents: ["reply"], removedEvents: [] },
        { addedEvents: ["next"], removedEvents: ["reply"] },
      ],
    );
    adapter.cancel();
    await execution;
    assert.ok(events.some((e) => e.event.type === "connection.closed"));
    assert.equal(events.at(-1).event.type, "session.closed");
  },
);

test("HTTP adapter forwards real GraphQL, SSE, assertions and variable updates through core", async () => {
  await buildRuntime({ outdir: "test-results/adapter-runtime" });
  server = createServer(async (req, res) => {
    if (req.url === "/sse") {
      res.writeHead(200, { "content-type": "text/event-stream" });
      res.write("data: hello\n\n");
      setTimeout(() => res.end("data: done\n\n"), 15);
    } else {
      let body = "";
      for await (const data of req) body += data;
      res.setHeader("content-type", "application/json");
      res.setHeader("set-cookie", "session=saved; Path=/");
      res.end(JSON.stringify({ body: JSON.parse(body) }));
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  address = `http://127.0.0.1:${server.address().port}`;
  const events = [];
  const result = await new modules.ExecutionService().execute(
    new modules.HttpAdapter(
      pathToFileURL(path.resolve("test-results/adapter-runtime/worker.js")),
    ),
    {
      collection: {
        info: { name: "Protocols" },
        item: [
          {
            name: "GraphQL",
            request: {
              method: "POST",
              url: `${address}/graphql`,
              body: {
                mode: "graphql",
                graphql: { query: "query { hello }", variables: "{}" },
              },
            },
            event: [
              {
                listen: "test",
                script: {
                  exec: [
                    'pm.test("query", () => pm.expect(pm.response.json().body.query).to.eql("query { hello }")); pm.environment.set("saved", "yes");',
                  ],
                },
              },
            ],
          },
          { name: "SSE", request: { method: "GET", url: `${address}/sse` } },
        ],
      },
      options: { environment: { id: "env", values: [] } },
    },
    { sessionId: "http", observer: (e) => events.push(e) },
  );
  assert.equal(result.error, null);
  assert.ok(
    result.environment.values.some(
      (v) => v.key === "saved" && v.value === "yes",
    ),
  );
  assert.ok(result.cookieJar);
  assert.equal(
    events.filter((e) => e.event.type === "response.received").length,
    2,
  );
  assert.ok(events.some((e) => e.event.type === "response.chunk"));
  assert.ok(
    events.some(
      (e) =>
        e.event.type === "assertion.completed" &&
        e.event.native.assertions.some(
          (a) => a.name === "query" && a.passed && !a.error,
        ),
    ),
    JSON.stringify(
      events.filter((e) => e.event.type === "assertion.completed"),
    ),
  );
  assert.equal(events.at(-1).event.type, "session.closed");
});

test("HTTP worker failure and cancellation emit one native done and close the core execution", async () => {
  const service = new modules.ExecutionService(),
    failed = [];
  await assert.rejects(
    service.execute(
      new modules.HttpAdapter(
        pathToFileURL(path.resolve("test-results/no-such-worker.js")),
      ),
      { collection: {}, options: {} },
      { sessionId: "broken", observer: (e) => failed.push(e) },
    ),
  );
  assert.equal(failed.filter((e) => e.event.native?.type === "done").length, 1);
  assert.equal(failed.at(-1).event.type, "session.closed");
  const adapter = new modules.HttpAdapter(
    pathToFileURL(path.resolve("test-results/adapter-runtime/worker.js")),
  );
  const events = [];
  const execution = service.execute(
    adapter,
    { collection: { info: { name: "Cancel" }, item: [] }, options: {} },
    { sessionId: "cancel", observer: (e) => events.push(e) },
  );
  adapter.cancel();
  const result = await execution;
  assert.match(result.error.message, /Run stopped/);
  assert.equal(events.filter((e) => e.event.native?.type === "done").length, 1);
});

after(() => {
  server?.closeAllConnections();
  server?.close();
});
