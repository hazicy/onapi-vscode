import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "./helpers/loadTypeScript.mjs";

const merge = await load(
  "apps/extension/src/features/requests/execution/merge-http-state.ts",
  nativeDependency,
);
const { ExecutionService } = await load(
  "packages/core/src/execution/service.ts",
  nativeDependency,
);
const plain = (value) => JSON.parse(JSON.stringify(value));
const variable = (key, value) => ({ key, value });
const cookie = (key, value) => ({
  key,
  value,
  domain: "example.test",
  path: "/",
});
function config() {
  return {
    http: {
      collection: { info: { name: "Test" }, item: [] },
      activeEnvironment: "env",
      environments: [
        { id: "env", name: "Environment", values: [variable("token", "base")] },
      ],
      options: {
        globals: { values: [variable("shared", "base")] },
        requester: { cookieJar: { cookies: [] } },
      },
    },
  };
}
async function fixture() {
  const adapters = [];
  const configs = { one: config(), two: config() };
  const writes = [];
  const results = [];
  const context = {
    subscriptions: [],
    globalState: { get: () => ({ currentProject: { project_id: "one" } }) },
  };
  const project = (ctx) =>
    ctx.globalState.get("userConfig").currentProject.project_id;
  class HttpAdapter {
    protocol = "http";
    cancelled = false;
    constructor() {
      adapters.push(this);
    }
    execute(request, executionContext) {
      this.request = request;
      this.executionContext = executionContext;
      return new Promise((resolve) => {
        this.resolve = resolve;
      });
    }
    publish(event) {
      this.executionContext.publish({
        protocol: "http",
        type: "runtime.event",
        native: event,
      });
    }
    finish(event = { type: "done" }) {
      this.publish(event);
      this.resolve(event);
    }
    cancel() {
      this.cancelled = true;
    }
  }
  const runner = await load(
    "apps/extension/src/features/requests/execution/http-runner.ts",
    (id) => {
      if (id === "./merge-http-state") return merge;
      if (id === "@onapi/runtime/http/adapter") return { HttpAdapter };
      if (id === "../../../platform/execution/service")
        return { executionService: new ExecutionService() };
      if (
        /\/(?:project-config|request-storage|report-storage|collection-order|import-curl|prepare-options|html|host-utils|user-config)$/.test(
          id,
        )
      )
        return {
          getApiListName: (ctx) => project(ctx),
          getCurrentProjectConfig: (ctx) => configs[project(ctx)],
          getProjectWorkspace: (ctx) => ({
            projectId: project(ctx),
            userId: -1,
          }),
          getProjectConfig: (_ctx, workspace) => configs[workspace.projectId],
          saveProjectConfig: (ctx, workspace, value) => {
            configs[workspace.projectId] = value;
            writes.push({
              project: workspace.projectId,
              notify: workspace.projectId === project(ctx),
            });
          },
        };
      if (id === "../request-status")
        return { setRequestResult: (...args) => results.push(args) };
      if (id === "@onapi/domain")
        return {
          createDefaultHttpConfig: () => config().http,
          toPostmanCollection() {},
        };
      return nativeDependency(id);
    },
    { URL },
  );
  const run = (owner, options = {}, events = []) =>
    runner.runCollection(
      configs.one.http.collection,
      options,
      context,
      (event) => events.push(event),
      owner,
    );
  return { runner, adapters, configs, writes, results, context, run };
}

test("tabs execute independently and stopping one preserves the other", async () => {
  const f = await fixture();
  const a = {},
    b = {};
  const eventsA = [],
    eventsB = [];
  const first = f.run(a, {}, eventsA),
    second = f.run(b, {}, eventsB);
  assert.equal(f.adapters.length, 2);
  assert.equal(f.adapters[0].cancelled, false);
  f.runner.stopWorker(a);
  assert.equal(f.adapters[0].cancelled, true);
  assert.equal(f.adapters[1].cancelled, false);
  f.adapters[0].finish({
    type: "done",
    globals: { values: [variable("cancelled", "bad")] },
  });
  f.adapters[1].finish({
    type: "done",
    globals: {
      values: [variable("shared", "base"), variable("second", "saved")],
    },
  });
  await Promise.all([first, second]);
  assert.equal(f.writes.length, 1);
  assert.deepEqual(plain(f.configs.one.http.options.globals.values), [
    variable("shared", "base"),
    variable("second", "saved"),
  ]);
  assert.notEqual(eventsA[0].sessionId, eventsB[0].sessionId);
  assert.ok(eventsA.every((event) => event.sessionId === eventsA[0].sessionId));
  assert.ok(eventsB.every((event) => event.sessionId === eventsB[0].sessionId));
});

test("replacing a tab does not let old completion unregister the new execution", async () => {
  const f = await fixture(),
    owner = {};
  const old = f.run(owner),
    current = f.run(owner);
  assert.equal(f.adapters[0].cancelled, true);
  f.adapters[0].finish();
  await old;
  f.runner.stopWorker(owner);
  assert.equal(f.adapters[1].cancelled, true);
  f.adapters[1].finish();
  await current;
  assert.equal(f.writes.length, 0);
});

test("parallel completion merges disjoint variables and cookies and preserves concurrent edits", async () => {
  const f = await fixture();
  const a = f.run({}),
    b = f.run({});
  f.configs.one.http.environments[0].values.push(
    variable("manual", "user edit"),
  );
  f.adapters[0].finish({
    type: "done",
    environment: {
      id: "env",
      values: [variable("token", "first"), variable("a", "one")],
    },
    globals: { values: [variable("shared", "first"), variable("a", "one")] },
    cookieJar: { cookies: [cookie("a", "one")] },
  });
  f.adapters[1].finish({
    type: "done",
    environment: {
      id: "env",
      values: [variable("token", "second"), variable("b", "two")],
    },
    globals: { values: [variable("shared", "second"), variable("b", "two")] },
    cookieJar: { cookies: [cookie("b", "two")] },
  });
  await Promise.all([a, b]);
  const http = f.configs.one.http;
  assert.deepEqual(plain(http.environments[0].values), [
    variable("token", "first"),
    variable("manual", "user edit"),
    variable("a", "one"),
    variable("b", "two"),
  ]);
  assert.deepEqual(plain(http.options.globals.values), [
    variable("shared", "first"),
    variable("a", "one"),
    variable("b", "two"),
  ]);
  assert.deepEqual(plain(http.options.requester.cookieJar.cookies), [
    cookie("a", "one"),
    cookie("b", "two"),
  ]);
});

test("workspace switch keeps response status and persisted state in the original workspace", async () => {
  const f = await fixture(),
    owner = {};
  const pending = f.run(owner);
  f.context.globalState.get = () => ({ currentProject: { project_id: "two" } });
  f.adapters[0].publish({
    type: "request",
    item: { id: "request" },
    response: { code: 200 },
  });
  f.adapters[0].finish({
    type: "done",
    globals: { values: [variable("shared", "original workspace")] },
  });
  await pending;
  assert.equal(f.results[0][0], "one");
  assert.deepEqual(f.writes, [{ project: "one", notify: false }]);
  assert.equal(
    f.configs.one.http.options.globals.values[0].value,
    "original workspace",
  );
  assert.equal(f.configs.two.http.options.globals.values[0].value, "base");
});

test("sandbox and failed runs never persist shared runtime state", async () => {
  const f = await fixture();
  const a = f.run({}, { sandbox: true }),
    b = f.run({});
  f.adapters[0].finish();
  f.adapters[1].finish({ type: "done", error: { message: "failed" } });
  await Promise.all([a, b]);
  assert.equal(f.writes.length, 0);
});

test("runtime deletions preserve unrelated keys and respect concurrent changes", () => {
  const before = [variable("remove", "old"), variable("edited", "old")];
  assert.deepEqual(
    plain(
      merge.mergeRuntimeEntries(
        before,
        [],
        [
          variable("remove", "old"),
          variable("edited", "new"),
          variable("extra", "keep"),
        ],
      ),
    ),
    [variable("edited", "new"), variable("extra", "keep")],
  );
});

test("disposing the extension context cancels all of its active sessions", async () => {
  const f = await fixture();
  const a = f.run({}),
    b = f.run({});
  assert.equal(f.context.subscriptions.length, 1);
  f.context.subscriptions[0].dispose();
  assert.ok(f.adapters.every((adapter) => adapter.cancelled));
  f.adapters.forEach((adapter) => adapter.finish());
  await Promise.all([a, b]);
  assert.equal(f.writes.length, 0);
});
