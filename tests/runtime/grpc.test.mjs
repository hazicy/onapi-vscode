import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { build } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const require = createRequire(
  new URL("../../packages/runtime/package.json", import.meta.url),
);
const grpc = require("@grpc/grpc-js");
const loader = require("@grpc/proto-loader");
let modules, server, address, files;
before(async () => {
  await build({
    stdin: {
      contents: `export { GrpcAdapter } from './packages/runtime/src/grpc/adapter.ts'; export { GrpcSchemaCache } from './packages/runtime/src/grpc/cache.ts'; export { importProtoFiles, importProtoDirectory } from './packages/runtime/src/grpc/import.ts'; export { ExecutionService } from './packages/core/src/index.ts'; export { grpcConfigSchema } from './packages/domain/src/requests/grpc.ts'; export { requestPanelResponseSchema } from './packages/contracts/src/request-panel/index.ts';`,
      resolveDir: process.cwd(),
      loader: "ts",
    },
    outfile: "test-results/grpc.cjs",
    bundle: true,
    platform: "node",
    format: "cjs",
  });
  modules = createRequire(import.meta.url)("../../test-results/grpc.cjs");
  files = [
    {
      name: "grpc.proto",
      content: await fs.readFile("tests/fixtures/grpc.proto", "utf8"),
    },
  ];
  const definition = loader.loadSync("tests/fixtures/grpc.proto", {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
  });
  server = new grpc.Server();
  server.addService(definition["onapi.test.Echo"], {
    Unary: (call, callback) => {
      const metadata = new grpc.Metadata();
      metadata.add("x-server", "onapi");
      call.sendMetadata(metadata);
      const trailers = new grpc.Metadata();
      trailers.add("x-trailer", "done");
      callback(
        null,
        {
          message: `Hello ${call.request.name}`,
          count: 1,
          authorization: call.metadata.get("authorization")[0] ?? "",
        },
        trailers,
      );
    },
    Server: (call) => {
      call.write({ message: "first" });
      call.write({ message: "second" });
      call.end();
    },
    Client: (call, callback) => {
      const names = [];
      call.on("data", (value) => names.push(value.name));
      call.on("end", () =>
        callback(null, { message: names.join(","), count: names.length }),
      );
    },
    Bidi: (call) => {
      call.on("data", (value) => call.write({ message: value.name }));
      call.on("end", () => call.end());
    },
    Fail: (_call, callback) =>
      callback({
        code: grpc.status.INVALID_ARGUMENT,
        details: "Invalid fixture argument",
      }),
    Wait: () => {},
  });
  const { ReflectionService } = require("@grpc/reflection");
  new ReflectionService(definition).addToServer(server);
  const port = await new Promise((resolve, reject) =>
    server.bindAsync(
      "127.0.0.1:0",
      grpc.ServerCredentials.createInsecure(),
      (error, port) => (error ? reject(error) : resolve(port)),
    ),
  );
  address = `127.0.0.1:${port}`;
});
after(() => server?.forceShutdown());
const config = (patch) =>
  modules.grpcConfigSchema.parse({
    definition: { source: "proto", files },
    method: "/onapi.test.Echo/Unary",
    message: '{"name":"World","value":"9223372036854775807","payload":"AQI="}',
    ...patch,
  });
function executionRequest(patch) {
  const { definition, ...settings } = config(patch);
  return { config: settings, definition };
}
function execute(method, patch = {}, mode = "invoke") {
  const adapter = new modules.GrpcAdapter(mode);
  const events = [];
  let started;
  const ready = new Promise((resolve) => {
    started = resolve;
  });
  const result = new modules.ExecutionService().execute(
    adapter,
    {
      url: address,
      ...executionRequest({ method: `/onapi.test.Echo/${method}`, ...patch }),
    },
    {
      sessionId: `grpc-${method}`,
      targetId: "grpc",
      observer: (envelope) => {
        assert.equal(
          modules.requestPanelResponseSchema.safeParse({
            action: "protocolExecutionEvent",
            data: envelope,
          }).success,
          true,
          JSON.stringify(envelope),
        );
        events.push(envelope.event);
        if (envelope.event.type === "call.started") started();
      },
    },
  );
  return { adapter, events, result, ready };
}
test("gRPC loads in-memory proto definitions and generates methods, stream shapes and examples", async () => {
  const run = execute("Unary", {}, "discover");
  await run.result;
  const schema = run.events.find(
    (event) => event.type === "schema.loaded",
  ).value;
  assert.equal(schema.methods.length, 6);
  assert.equal(
    schema.methods.find((method) => method.name === "Bidi").requestStream,
    true,
  );
  assert.equal(
    schema.methods.find((method) => method.name === "Bidi").responseStream,
    true,
  );
  assert.equal(schema.methods[0].example.name, "");
  assert.equal(schema.methods[0].example.value, "0");
});
test("gRPC unary sends authorization and exposes response metadata, trailers, status and timing", async () => {
  const run = execute("Unary", {
    auth: { type: "bearer", token: "fixture-token" },
  });
  await run.result;
  const message = run.events.find(
    (event) => event.type === "message.received",
  ).value;
  assert.equal(message.message, "Hello World");
  assert.equal(message.authorization, "Bearer fixture-token");
  assert.equal(
    run.events.find((event) => event.type === "metadata.received").metadata[
      "x-server"
    ][0],
    "onapi",
  );
  const status = run.events.find(
    (event) => event.type === "status.received",
  ).status;
  assert.equal(status.code, 0);
  assert.equal(status.trailers["x-trailer"][0], "done");
  assert.ok(status.durationMs >= 0);
  assert.equal(run.events.at(-1).failed, false);
});
test("gRPC server streaming emits every received message", async () => {
  const run = execute("Server");
  await run.result;
  assert.deepEqual(
    run.events
      .filter((event) => event.type === "message.received")
      .map((event) => event.value.message),
    ["first", "second"],
  );
});
test("gRPC client streaming accepts additional messages and half-closes without cancelling", async () => {
  const run = execute("Client");
  await run.ready;
  run.adapter.write('{"name":"Second"}');
  run.adapter.end();
  await run.result;
  assert.equal(
    run.events.filter((event) => event.type === "message.sent").length,
    2,
  );
  assert.equal(
    run.events.find((event) => event.type === "message.received").value.message,
    "World,Second",
  );
  assert.equal(
    run.events.find((event) => event.type === "status.received").status.code,
    0,
  );
});
test("gRPC bidirectional streaming exchanges messages before ending the client stream", async () => {
  const run = execute("Bidi");
  await run.ready;
  run.adapter.write('{"name":"Second"}');
  run.adapter.end();
  await run.result;
  assert.deepEqual(
    run.events
      .filter((event) => event.type === "message.received")
      .map((event) => event.value.message),
    ["World", "Second"],
  );
});
test("gRPC preserves error status and returns one failed terminal lifecycle", async () => {
  const run = execute("Fail");
  await assert.rejects(run.result, /Invalid fixture argument/);
  assert.equal(
    run.events.find((event) => event.type === "status.received").status.code,
    grpc.status.INVALID_ARGUMENT,
  );
  assert.equal(
    run.events.filter((event) => event.type === "execution.error").length,
    1,
  );
  assert.equal(run.events.at(-1).failed, true);
});
test("gRPC cancellation and deadlines settle active calls", async () => {
  const cancelled = execute("Wait");
  await cancelled.ready;
  cancelled.adapter.cancel();
  await cancelled.result;
  assert.equal(
    cancelled.events.some((event) => event.type === "execution.cancelled"),
    true,
  );
  assert.equal(cancelled.events.at(-1).failed, false);
  const deadline = execute("Wait", { deadlineMs: 40 });
  await assert.rejects(deadline.result, /[Dd]eadline/);
  assert.equal(
    deadline.events.find((event) => event.type === "status.received").status
      .code,
    grpc.status.DEADLINE_EXCEEDED,
  );
});
test("gRPC reflection discovers a real server and cached descriptors can invoke methods", async () => {
  const discovery = execute(
    "Unary",
    { definition: { source: "reflection" } },
    "discover",
  );
  await discovery.result;
  const schema = discovery.events.find(
    (event) => event.type === "schema.loaded",
  ).value;
  assert.ok(schema.descriptorSet);
  const run = execute("Unary", {
    definition: { source: "reflection", descriptorSet: schema.descriptorSet },
  });
  await run.result;
  assert.equal(
    run.events.find((event) => event.type === "message.received").value.message,
    "Hello World",
  );
});
test("gRPC local imports include dependencies and reload from saved sources", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "onapi-grpc-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  await fs.mkdir(path.join(directory, "types"));
  await fs.writeFile(
    path.join(directory, "types", "message.proto"),
    'syntax="proto3"; package imported; message Input { string name=1; }',
  );
  await fs.writeFile(
    path.join(directory, "service.proto"),
    'syntax="proto3"; package imported; import "types/message.proto"; service Demo { rpc Test(Input) returns(Input); }',
  );
  const imported = await modules.importProtoFiles([
    path.join(directory, "service.proto"),
  ]);
  assert.equal(imported.length, 2);
  const run = execute(
    "Unary",
    { definition: { source: "proto", files: imported } },
    "discover",
  );
  await run.result;
  assert.equal(
    run.events.find((event) => event.type === "schema.loaded").value.methods[0]
      .path,
    "/imported.Demo/Test",
  );
});
test("gRPC invalid JSON and unknown fields fail before a call is started", async () => {
  for (const message of [
    '{"unknown":true}',
    '{"name":123}',
    '{"value":"abc"}',
    '{"value":"9223372036854775808"}',
    '{"payload":"invalid base64"}',
    "{invalid",
    "[]",
  ]) {
    const run = execute("Unary", { message });
    await assert.rejects(run.result);
    assert.equal(
      run.events.some((event) => event.type === "call.started"),
      false,
    );
  }
});

test("gRPC TLS and mutual TLS validate certificates and exchange real messages", async (t) => {
  // Public test certificate/key generated solely for this local fixture.
  const cert = await fs.readFile("tests/fixtures/grpc-tls/cert.pem");
  const key = await fs.readFile("tests/fixtures/grpc-tls/key.pem");
  for (const mutual of [false, true]) {
    const secure = new grpc.Server();
    const definition = loader.loadSync("tests/fixtures/grpc.proto");
    secure.addService(definition["onapi.test.Echo"], {
      Unary: (call, callback) => callback(null, { message: call.request.name }),
    });
    const port = await new Promise((resolve, reject) =>
      secure.bindAsync(
        "127.0.0.1:0",
        grpc.ServerCredentials.createSsl(
          mutual ? cert : null,
          [{ private_key: key, cert_chain: cert }],
          mutual,
        ),
        (error, port) => (error ? reject(error) : resolve(port)),
      ),
    );
    t.after(() => secure.forceShutdown());
    const events = [];
    await new modules.ExecutionService().execute(
      new modules.GrpcAdapter("invoke"),
      {
        url: `grpcs://127.0.0.1:${port}`,
        ...executionRequest({
          tls: {
            rootCertificates: cert.toString(),
            ...(mutual
              ? {
                  privateKey: key.toString(),
                  clientCertificate: cert.toString(),
                }
              : {}),
          },
        }),
      },
      {
        sessionId: `tls-${mutual}`,
        observer: (event) => events.push(event.event),
      },
    );
    assert.equal(
      events.find((event) => event.type === "message.received").value.message,
      "World",
    );
    assert.equal(
      events.find((event) => event.type === "status.received").status.code,
      0,
    );
  }
});
test("gRPC resolves built-in Google protobuf imports", async () => {
  const content =
    'syntax="proto3"; package known; import "google/protobuf/empty.proto"; service Health { rpc Check(google.protobuf.Empty) returns(google.protobuf.Empty); }';
  const run = execute(
    "Unary",
    {
      definition: {
        source: "proto",
        files: [{ name: "health.proto", content }],
      },
    },
    "discover",
  );
  await run.result;
  assert.equal(
    run.events.find((event) => event.type === "schema.loaded").value.methods[0]
      .requestType,
    "google.protobuf.Empty",
  );
});

test("gRPC reflection falls back to v1alpha when v1 is not implemented", async (t) => {
  const alpha = new grpc.Server();
  t.after(() => alpha.forceShutdown());
  const definition = loader.loadSync("tests/fixtures/grpc.proto");
  const { ReflectionService } = require("@grpc/reflection");
  // Only expose the legacy service through the official registration callback.
  new ReflectionService(definition).addToServer({
    addService(service, implementation) {
      if (
        Object.values(service).some((method) => method.path.includes("v1alpha"))
      )
        alpha.addService(service, implementation);
    },
  });
  const port = await new Promise((resolve, reject) =>
    alpha.bindAsync(
      "127.0.0.1:0",
      grpc.ServerCredentials.createInsecure(),
      (error, port) => (error ? reject(error) : resolve(port)),
    ),
  );
  const events = [];
  await new modules.ExecutionService().execute(
    new modules.GrpcAdapter("discover"),
    {
      url: `127.0.0.1:${port}`,
      ...executionRequest({ definition: { source: "reflection" } }),
    },
    {
      sessionId: "legacy-reflection",
      observer: (envelope) => events.push(envelope.event),
    },
  );
  assert.equal(
    events.find((event) => event.type === "schema.loaded").value.methods.length,
    6,
  );
});

test("gRPC schema cache deduplicates concurrent parses, isolates codec options and bounds retained schemas", async () => {
  const cache = new modules.GrpcSchemaCache(2);
  const definition = { source: "proto", files };
  const first = cache.load(definition, { includeDefaults: true });
  const second = cache.load(structuredClone(definition), {
    includeDefaults: true,
  });
  assert.equal(first, second);
  assert.equal(await first, await second);
  const otherOptions = await cache.load(definition, { includeDefaults: false });
  assert.notEqual(otherOptions, await first);
  const changed = {
    source: "proto",
    files: [
      {
        name: "other.proto",
        content: files[0].content.replace("onapi.test", "other.test"),
      },
    ],
  };
  await cache.load(changed, { includeDefaults: true });
  assert.equal(cache.size, 2);
  assert.notEqual(
    await cache.load(definition, { includeDefaults: true }),
    await first,
  );
  await assert.rejects(
    cache.load(
      {
        source: "proto",
        files: [{ name: "invalid.proto", content: "invalid proto" }],
      },
      { includeDefaults: true },
    ),
  );
  assert.ok(cache.size <= 2);
});
