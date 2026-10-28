import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createRequire } from "node:module";
import { Worker } from "node:worker_threads";
import { once } from "node:events";
import fs from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { build } from "esbuild";
import { buildRuntime } from "../../scripts/build-runtime.mjs";

let runtime, model, server, address;
const received = [];
before(async () => {
  await buildRuntime({ outdir: "test-results/native-runtime" });
  const require = createRequire(import.meta.url);
  runtime = require("../../test-results/native-runtime/postman.cjs");
  await build({
    entryPoints: ["packages/domain/src/index.ts"],
    outfile: "test-results/native-model.cjs",
    bundle: true,
    platform: "node",
    format: "cjs",
  });
  model = require("../../test-results/native-model.cjs");
  server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    received.push(req.url);
    if (req.url === "/stream") {
      res.writeHead(200, { "content-type": "text/event-stream" });
      res.write("data: hello\n\n");
      setTimeout(() => res.end("data: done\n\n"), 10);
      return;
    }
    res.setHeader("content-type", "application/json");
    res.setHeader("set-cookie", "session=saved; Path=/; HttpOnly");
    res.end(
      JSON.stringify({
        url: req.url,
        headers: req.headers,
        body: Buffer.concat(chunks).toString(),
        value: 42,
      }),
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  address = `http://127.0.0.1:${server.address().port}`;
});
after(() => {
  server?.closeAllConnections();
  server?.close();
});
const collection = (item) => ({
  info: { name: "Native collection" },
  item: Array.isArray(item) ? item : [item],
});
const item = (extra = {}) => ({
  id: "request",
  name: "Request",
  request: {
    method: "POST",
    url: "{{baseUrl}}/echo",
    header: [],
    body: {
      mode: "raw",
      raw: '{"value":"{{value}}"}',
      options: { raw: { language: "json" } },
    },
  },
  ...extra,
});
const event = (listen, script) => ({
  listen,
  script: { type: "text/javascript", exec: [script] },
});
const options = () => ({
  environment: {
    id: "env",
    name: "Local",
    values: [
      { key: "baseUrl", value: address },
      { key: "value", value: "before" },
    ],
  },
  globals: { values: [] },
  stopOnError: true,
});
async function run(definition, settings = options()) {
  const events = [];
  await runtime.run(definition, settings, (value) =>
    events.push(JSON.parse(runtime.serialize(value))),
  );
  return events;
}
const responseText = (response) => Buffer.from(response.stream.data).toString();
const responseBody = (events) =>
  JSON.parse(
    responseText(events.find((event) => event.type === "request").response),
  );

test("URLs edited in the UI execute with SDK host, protocol and path fields", async () => {
  const url = model.editedUrl(`${address}/edited?search=hello%20world&flag`);
  const events = await run(
    collection(item({ request: { method: "GET", url, header: [] } })),
  );
  assert.equal(events.at(-1).error, null);
  assert.equal(responseBody(events).url, "/edited?search=hello%20world&flag");

  const updated = model.urlWithQuery(`${address}/params`, [
    { key: "search", value: "new value" },
    { key: "ignored", value: "hidden", disabled: true },
  ]);
  const params = await run(
    collection(item({ request: { method: "GET", url: updated, header: [] } })),
  );
  assert.equal(responseBody(params).url, "/params?search=new%20value");
});

test("edited templated URLs preserve path variable values and native query encoding", async () => {
  const url = model.editedUrl("{{baseUrl}}/:id?value=%2B", {
    variable: [{ key: "id", value: "native" }],
  });
  const events = await run(
    collection(item({ request: { method: "GET", url, header: [] } })),
  );
  assert.equal(responseBody(events).url, "/native?value=%2B");
});

test("stored raw-only editor URLs regain executable SDK fields when reopened", async () => {
  const native = collection(
    item({
      request: {
        method: "GET",
        url: { raw: `${address}/stored`, query: [], variable: [] },
        header: [],
      },
    }),
  );
  const rows = model.fromPostmanCollection(native);
  const events = await run(model.toPostmanCollection(rows, native));
  assert.equal(responseBody(events).url, "/stored");
});

test("native requests and collection/folder events execute without task translation", async () => {
  const definition = collection({
    id: "folder",
    name: "Folder",
    event: [
      event(
        "prerequest",
        'pm.request.headers.upsert({key:"x-folder",value:"yes"});',
      ),
    ],
    item: [
      item({
        event: [
          event(
            "prerequest",
            'pm.environment.set("value","after");console.log("native log");',
          ),
          event(
            "test",
            'pm.test("status",()=>pm.response.to.have.status(200));pm.globals.set("saved",42);pm.visualizer.set("<p>{{value}}</p>",{value:42});',
          ),
        ],
      }),
    ],
  });
  const events = await run(definition);
  assert.equal(events.at(-1).error, null);
  assert.equal(responseBody(events).headers["x-folder"], "yes");
  assert.equal(JSON.parse(responseBody(events).body).value, "after");
  assert.equal(
    events.find((event) => event.type === "assertion").assertions[0].passed,
    true,
  );
  assert.equal(
    events.find((event) => event.type === "console").messages[0],
    "native log",
  );
  assert.equal(
    events.find((event) => event.type === "item" && event.visualizer).visualizer
      .processedTemplate,
    "<p>42</p>",
  );
  assert.equal(
    events.at(-1).environment.values.find((value) => value.key === "value")
      .value,
    "after",
  );
  assert.equal(
    events.at(-1).globals.values.find((value) => value.key === "saved").value,
    42,
  );
});
test("official iteration data, entrypoints and auth are honored", async () => {
  const events = await run(
    collection([
      item(),
      item({
        id: "other",
        request: { method: "GET", url: "{{baseUrl}}/other" },
      }),
    ]),
    {
      ...options(),
      entrypoint: { execute: "request", lookupStrategy: "idOrName" },
      iterationCount: 2,
      data: [{ value: "one" }, { value: "two" }],
    },
  );
  assert.equal(events.filter((event) => event.type === "request").length, 2);
  assert.deepEqual(
    events
      .filter((event) => event.type === "request")
      .map(
        (event) =>
          JSON.parse(JSON.parse(responseText(event.response)).body).value,
      ),
    ["one", "two"],
  );
  const auth = await run(
    collection(
      item({
        request: {
          method: "GET",
          url: `${address}/auth`,
          auth: { type: "bearer", bearer: [{ key: "token", value: "native" }] },
        },
      }),
    ),
  );
  assert.equal(responseBody(auth).headers.authorization, "Bearer native");
});
test("pre-request errors stop network traffic", async () => {
  const count = received.length;
  const events = await run(
    collection(
      item({ event: [event("prerequest", 'throw new Error("blocked");')] }),
    ),
  );
  assert.equal(received.length, count);
  assert.ok(events.some((event) => event.error?.message?.includes("blocked")));
});
test("native cookie jar round-trips serialized expiry dates", async () => {
  const first = await run(collection(item()));
  const jar = first.at(-1).cookieJar;
  jar.cookies.push({
    key: "expires",
    value: "valid",
    domain: "127.0.0.1",
    path: "/",
    expires: new Date(Date.now() + 86400000).toISOString(),
  });
  const events = await run(collection(item()), {
    ...options(),
    requester: { cookieJar: jar },
  });
  assert.match(responseBody(events).headers.cookie, /session=saved/);
  assert.match(responseBody(events).headers.cookie, /expires=valid/);
});
test("native SSE callbacks preserve stream content", async () => {
  const events = await run(
    collection(item({ request: { method: "GET", url: `${address}/stream` } })),
  );
  assert.match(
    events
      .filter((event) => event.type === "responseData")
      .map((event) => event.data)
      .join(""),
    /data: hello/,
  );
});
test("native collection storage projections preserve request, event, auth and variable definitions", () => {
  const native = {
    info: { name: "Imported" },
    variable: [{ key: "collectionVar", value: "value" }],
    event: [event("prerequest", "console.log('root');")],
    item: [
      {
        id: "folder",
        name: "Folder",
        auth: { type: "noauth" },
        item: [item({ event: [event("test", "pm.test('native',()=>{});")] })],
      },
    ],
  };
  const rows = model.fromPostmanCollection(native);
  const restored = model.toPostmanCollection(rows, native);
  assert.deepEqual(restored, native);
  assert.equal(rows[1].request.method, "POST");
  assert.equal(rows[1].request.pre_tasks, undefined);
  assert.equal(rows[1].method, undefined);
  assert.equal(rows[1].url, undefined);
});
test("packaged worker runs a native collection outside the repository", async () => {
  const folder = await fs.mkdtemp(path.join(tmpdir(), "onapi-native-worker-"));
  await fs.mkdir(path.join(folder, "runtime"));
  await fs.copyFile(
    "packages/runtime/src/worker.js",
    path.join(folder, "work.mjs"),
  );
  await fs.copyFile(
    "test-results/native-runtime/postman.cjs",
    path.join(folder, "postman.cjs"),
  );
  const worker = new Worker(path.join(folder, "work.mjs"));
  try {
    const events = [];
    const done = new Promise((resolve, reject) => {
      worker.on("error", reject);
      worker.on("message", (event) => {
        events.push(event);
        if (event.type === "done") resolve(event);
      });
    });
    worker.postMessage({ collection: collection(item()), options: options() });
    const result = await Promise.race([
      done,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Worker timeout")), 15000).unref(),
      ),
    ]);
    assert.equal(result.error, null);
    assert.equal(responseBody(events).value, 42);
  } finally {
    await worker.terminate();
    await fs.rm(folder, { recursive: true, force: true });
  }
});
