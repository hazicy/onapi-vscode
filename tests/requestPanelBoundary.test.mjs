import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "./helpers/loadTypeScript.mjs";

const { parseRequestPanelCommand: parse, receiveRequestPanelCommand: receive } =
  await load(
    "apps/extension/src/platform/webviews/request-panel-channel.ts",
    nativeDependency,
  );
const definition = {
  id: "request",
  parentId: "",
  name: "Draft",
  kind: "api",
  request: { method: "GET", url: "https://example.com" },
};

test("request panel rejects invalid wire data before dispatch", async () => {
  for (const value of [
    null,
    [],
    {},
    { action: "unknown" },
    { action: "sendApi", data: definition },
    {
      action: "sendApi",
      executionId: "run",
      data: { ...definition, request: null },
    },
    { action: "saveApiData", data: { ...definition, id: "" } },
    { action: "stopSendApi", executionId: "" },
    { action: "setProjectConfig", data: { key: "__proto__", value: {} } },
  ]) {
    let called = false;
    const errors = [];
    await receive(
      value,
      async () => {
        called = true;
      },
      async (error) => errors.push(error),
    );
    assert.equal(called, false);
    assert.equal(errors.length, 1);
  }
});

test("request panel accepts save, send, cancel and empty URL drafts", () => {
  for (const value of [
    {
      action: "saveApiData",
      data: { ...definition, request: { method: "GET", url: "" } },
    },
    { action: "updateApiActiveData", data: definition },
    { action: "sendApi", executionId: "run", data: definition },
    { action: "stopSendApi", executionId: "run" },
    { action: "getApiList" },
  ])
    assert.deepEqual(JSON.parse(JSON.stringify(parse(value))), value);
});

test("request panel awaits handlers and reports asynchronous rejection", async () => {
  const error = new Error("Disk unavailable");
  let reported;
  await receive(
    { action: "saveApiData", data: definition },
    async () => {
      await Promise.resolve();
      throw error;
    },
    async (failure) => {
      reported = failure;
    },
  );
  assert.match(reported.message, /Disk unavailable/);
});

test("failed sends end loading without accepting stale failures or losing previous results", async () => {
  const { reduceHttpExecutionEvent: reduce } = await load(
    "apps/webviews/src/features/requests/execution/http-state.ts",
  );
  const result = { executionId: "previous", response: { code: 200 } };
  const state = { status: "sending", executionId: "current", result };
  const error = { message: "Invalid request" };
  assert.equal(
    reduce(state, { type: "failure", executionId: "old", error }),
    state,
  );
  const failed = reduce(state, {
    type: "failure",
    executionId: "current",
    error,
  });
  assert.equal(failed.status, "failed");
  assert.equal(failed.result, result);
  assert.equal(failed.error, error);
  const cancelled = reduce(state, { type: "cancel", executionId: "current" });
  assert.equal(
    reduce(cancelled, { type: "failure", executionId: "current", error }),
    cancelled,
  );
});

const contracts = await load(
  "packages/contracts/src/request-panel/index.ts",
  nativeDependency,
);
const plain = (value) => JSON.parse(JSON.stringify(value));

test("Zod retains SDK extensions, scripts and draft URLs while rejecting envelope typos", () => {
  const data = {
    ...definition,
    request: {
      method: "POST",
      url: "{{baseUrl}}/users",
      body: { mode: "raw", raw: "" },
      auth: { type: "bearer", bearer: [{ key: "token", value: "{{token}}" }] },
      custom: { retained: true },
    },
    event: [{ listen: "test", script: { exec: ["pm.test('ok', () => {});"] } }],
    editorExtension: { preserve: true },
  };
  const message = { action: "saveApiData", requestId: "save-one", data };
  assert.deepEqual(plain(parse(message)), message);
  assert.equal(
    contracts.requestPanelCommandSchema.safeParse({ ...message, typo: true })
      .success,
    false,
  );
  for (const url of [
    "",
    "{{url}}",
    { raw: "{{url}}", host: ["{{host}}"], custom: true },
  ]) {
    const draft = {
      ...message,
      data: { ...data, request: { ...data.request, url } },
    };
    assert.deepEqual(plain(parse(draft)), draft);
  }
});

test("Webview sender and receiver share the actual Zod contract", async () => {
  const sent = [];
  const bridge = await load(
    "apps/webviews/src/shared/bridge/request-panel.ts",
    nativeDependency,
    {
      window: { vscode: { postMessage: (message) => sent.push(message) } },
    },
  );
  const requestId = bridge.sendRequestPanelMessage({
    action: "saveApiData",
    data: definition,
  });
  assert.equal(sent[0].requestId, requestId);
  assert.equal(parse(sent[0]).requestId, requestId);
  assert.equal(
    bridge.sendRequestPanelMessage({
      action: "getApiList",
      requestId: "provided",
    }),
    "provided",
  );
  const saved = {
    action: "requestSaved",
    requestId,
    data: { definition, submitted: definition },
  };
  assert.deepEqual(plain(bridge.readRequestPanelResponse(saved)), saved);
  for (const invalid of [
    null,
    { action: "requestSaved", data: {} },
    { action: "generatedCode", data: { requestId: "run" } },
    { source: "oauth-source-subpage", payload: { code: "value" } },
  ]) {
    assert.equal(bridge.readRequestPanelResponse(invalid), undefined);
  }
});

test("execution envelopes validate lifecycle and native results without stripping response bytes", () => {
  const envelope = {
    protocolVersion: 1,
    sessionId: "run",
    sequence: 1,
    timestamp: 100,
    event: {
      protocol: "http",
      type: "response.received",
      native: {
        type: "request",
        response: { code: 200, stream: { type: "Buffer", data: [0, 255] } },
        cursor: { position: 0 },
      },
    },
  };
  assert.deepEqual(
    plain(contracts.executionEnvelopeSchema.parse(envelope)),
    envelope,
  );
  assert.equal(
    contracts.executionEnvelopeSchema.safeParse({ ...envelope, sequence: 0 })
      .success,
    false,
  );
  assert.equal(
    contracts.executionEnvelopeSchema.safeParse({
      ...envelope,
      event: { protocol: "http", type: "unknown" },
    }).success,
    false,
  );
});

test("the actual host receiver rejects invalid messages and correlates asynchronous failures", async () => {
  let listener;
  const replies = [],
    errors = [],
    handled = [];
  const panel = {
    webview: {
      onDidReceiveMessage: (callback) => {
        listener = callback;
      },
      postMessage: (message) => {
        replies.push(message);
        return Promise.resolve(true);
      },
    },
    onDidChangeViewState() {},
    onDidDispose() {},
  };
  const boundary = await load(
    "apps/extension/src/platform/webviews/request-panel-channel.ts",
    nativeDependency,
  );
  const { createOpenPanel } = await load(
    "apps/extension/src/features/requests/open-panel.ts",
    (id) => {
      if (id.endsWith("/request-panel-channel")) return boundary;
      if (id.endsWith("/create-panel"))
        return { createFeaturePanel: () => panel };
      if (id === "./request-panel-handler")
        return {
          handleRequestPanelCommand: async (message) => {
            handled.push(message);
            await Promise.resolve();
            throw new Error("Save rejected");
          },
        };
      if (id === "vscode")
        return {
          workspace: { getConfiguration: () => ({ get: () => "dark" }) },
          Uri: { file: (value) => value },
          window: { showErrorMessage: async (error) => errors.push(error) },
        };
      if (id.endsWith("/config"))
        return {
          globalConfig: { openedPanels: {} },
          PANEL_OPTIONS: { OPEN: { title: "Request" } },
        };
      if (id.endsWith("/request-storage"))
        return { getApiList: () => [], getApiListName: () => "workspace" };
      if (id.endsWith("/project-config"))
        return { getCurrentProjectConfig: () => ({}) };
      if (id.endsWith("/host-utils")) return { showTabName: (value) => value };
      if (id.endsWith("/protocol-icon"))
        return { getProtocolIcon: () => undefined };
      if (id.endsWith("/share-data")) return { getDocBaseUrl: () => "" };
      if (id.endsWith("/http-runner")) return { stopWorker() {} };
      if (id.endsWith("/websocket-session"))
        return { disconnectWebSocketSession() {} };
      if (id.endsWith("/socketio-session"))
        return { disconnectSocketIoSession() {} };
      if (id.endsWith("/request-status")) return { setRequestDraft() {} };
      return nativeDependency(id);
    },
  );
  createOpenPanel(definition, {
    extensionPath: "/extension",
    globalState: { get: () => ({}) },
    subscriptions: [],
  });
  await listener({
    action: "sendApi",
    requestId: "bad",
    executionId: "run",
    data: null,
  });
  assert.equal(handled.length, 0);
  assert.equal(replies[0].requestId, "bad");
  assert.equal(replies[0].data.executionId, "run");
  assert.equal(
    contracts.requestPanelResponseSchema.safeParse(replies[0]).success,
    true,
  );
  await listener({
    action: "saveApiData",
    requestId: "save",
    data: definition,
  });
  assert.equal(handled.length, 1);
  assert.equal(replies[1].requestId, "save");
  assert.match(replies[1].data.error.message, /Save rejected/);
  assert.equal(errors.length, 2);
  for (const [action, kind] of [
    ["ws_connect", "websocket"],
    ["socketio_connect", "socketio"],
  ]) {
    await listener({
      action,
      requestId: action,
      data: { option: {}, target: { ...definition, kind } },
    });
    const reply = replies.at(-1);
    assert.equal(reply.requestId, action);
    assert.equal(reply.data.targetId, definition.id);
    assert.equal(reply.data.action, action);
    assert.equal(
      contracts.requestPanelResponseSchema.safeParse(reply).success,
      true,
    );
  }
});
