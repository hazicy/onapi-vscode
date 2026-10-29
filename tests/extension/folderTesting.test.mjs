import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "../helpers/loadTypeScript.mjs";

const rows = [
  { id: "folder", parentId: "0", kind: "folder", name: "Tests" },
  { id: "nested", parentId: "folder", kind: "folder", name: "Nested", sort: 2 },
  {
    id: "first",
    parentId: "folder",
    kind: "api",
    name: "First",
    sort: 1,
    request: { method: "GET", url: "https://example.com/first" },
  },
  {
    id: "second",
    parentId: "nested",
    kind: "graphql",
    name: "Second",
    request: { method: "POST", url: "https://example.com/second" },
  },
  { id: "socket", parentId: "folder", kind: "websocket" },
  {
    id: "other",
    parentId: "0",
    kind: "api",
    request: { method: "GET", url: "https://example.com/other" },
  },
];
const data = await load(
  "apps/extension/src/features/testing/folder-test-data.ts",
  (id) => {
    if (id.endsWith("/request-storage")) return { getApiList: () => rows };
    if (id === "./report-storage")
      return {
        getNativeTestReports: (value) => value || [],
        getTestingFolderData: () => ({
          config: { execute_count: 3 },
          reportList: [],
        }),
      };
    return nativeDependency(id);
  },
);

test("folder test lists HTTP requests in nested folders and excludes siblings and sockets", () => {
  const page = data.getFolderTestPageData("folder", {});
  assert.deepEqual(
    Array.from(page.eventList, (event) => event.event_id),
    ["first", "second"],
  );
  assert.ok(
    page.eventList.every((event) => event.enabled === 1 && event.data.request),
  );
  assert.equal(page.config.execute_count, 3);
  assert.equal(page.config.interval_time, 0);
  assert.equal(data.getFolderTestEvents("missing", {}).length, 0);
});

test("folder execution honors selection and settings and delivers request results and completion", async () => {
  const messages = [];
  let received;
  const { runFolderTest } = await load(
    "apps/extension/src/features/testing/folder-test-runner.ts",
    (id) => {
      if (id.endsWith("/request-storage")) return { getApiList: () => rows };
      if (id === "./folder-test-data") return data;
      if (id.endsWith("/http-runner"))
        return {
          getHttpProjectConfig: () => ({
            collection: { info: { name: "Project" } },
            environments: [{ id: "env", name: "Staging" }],
          }),
          runCollection: async (collection, options, context, emit) => {
            received = { collection, options };
            const send = (event) => emit({ event: { native: event } });
            for (let iteration = 0; iteration < 2; iteration++) {
              const cursor = { iteration, position: 0 };
              send({
                type: "request",
                cursor,
                request: rows[2].request,
                response: { code: 200, responseTime: 10, header: [] },
              });
              send({
                type: "assertion",
                cursor,
                assertions: [{ assertion: "OK" }],
              });
              send({ type: "item", cursor });
            }
            send({ type: "done" });
          },
        };
      return nativeDependency(id);
    },
  );
  const events = data.getFolderTestEvents("folder", {});
  events[1].enabled = -1;
  // A forged selection outside the folder cannot add a sibling request.
  events.push({ event_id: "other", enabled: 1 });
  await runFolderTest(
    "folder",
    {
      settings: {
        execute_count: 2,
        interval_time: 15,
        env_id: "env",
        enable_sandbox: 1,
        iteration_data: [{ value: "test" }],
      },
      event_list: events,
    },
    {},
    {
      webview: { postMessage: (message) => messages.push(message) },
    },
  );
  const root = received.collection.item[0];
  assert.equal(root.id, "folder");
  assert.deepEqual(
    Array.from(root.item, (item) => item.id),
    ["first"],
  );
  assert.equal(received.options.entrypoint.execute, "folder");
  assert.equal(received.options.iterationCount, 2);
  assert.equal(received.options.delay.item, 15);
  assert.equal(received.options.environment.id, "env");
  assert.equal(received.options.sandbox, true);
  const native = messages
    .filter((message) => message.action === "folderTestEvent")
    .map((message) => message.data);
  assert.equal(native.filter((event) => event.type === "request").length, 2);
  assert.equal(native.filter((event) => event.type === "done").length, 1);
  assert.equal(
    native.find((event) => event.type === "request").request.url,
    rows[2].request.url,
  );
  assert.equal(
    native.find((event) => event.type === "assertion").assertions[0].assertion,
    "OK",
  );
  assert.ok(
    native.every((event) => !("status" in event) && !("data" in event)),
  );
});
