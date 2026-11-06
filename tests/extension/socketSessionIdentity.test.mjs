import assert from "node:assert/strict";
import test from "node:test";
import load, { nativeDependency } from "../helpers/loadTypeScript.mjs";
import { owners } from "../helpers/executionOwners.mjs";
import { requestPanelStubs } from "../helpers/requestPanelStubs.mjs";

const { ExecutionService } = await load(
  "packages/core/src/execution/service.ts",
  nativeDependency,
  { console },
);
const sessions = await load(
  "apps/webviews/src/features/requests/execution/session.ts",
);
const { reduceSocketExecutionEvent } = await load(
  "apps/webviews/src/features/requests/protocols/shared/socket-state.ts",
  () => sessions,
);
const relay = await load(
  "apps/extension/src/platform/execution/webview-relay.ts",
  () => ({ PROTOCOL_EXECUTION_EVENT: "protocolExecutionEvent" }),
);

for (const [protocol, action, connect, prepare, adapterName] of [
  [
    "websocket",
    "ws_connect",
    "connectWebSocketSession",
    "prepareWebSocketSessionOptions",
    "WebSocketAdapter",
  ],
  [
    "socketio",
    "socketio_connect",
    "connectSocketIoSession",
    "prepareSocketIoSessionOptions",
    "SocketIoAdapter",
  ],
]) {
  test(`${protocol} connection events reach the UI session started by the command`, async () => {
    const requestId = `${protocol}-ui-session`;
    let state = { session: sessions.beginSession(requestId), socketRes: [] };
    const events = [];
    let finish;
    const completed = new Promise((resolve) => {
      finish = resolve;
    });
    const panel = {
      webview: {
        postMessage({ data }) {
          events.push(data);
          state = reduceSocketExecutionEvent(state, data);
          if (data.event.type === "session.closed") finish();
        },
      },
    };
    class Adapter {
      protocol = protocol;
      async execute(_request, context) {
        context.publish({
          protocol,
          type: "connection.opened",
          result: {
            type: "connection",
            isSuccess: true,
            message: "Connected",
          },
        });
        context.publish({
          protocol,
          type: "message.received",
          result: {
            type: "message",
            isSuccess: true,
            message: "echo",
          },
        });
      }
      cancel() {}
    }
    const host = await load(
      `apps/extension/src/features/requests/execution/${protocol}-session.ts`,
      (id) => {
        if (id.endsWith("/execution/owners")) return owners;
        if (id.endsWith("/config"))
          return { globalConfig: { openedPanels: { request: panel } } };
        if (id === `@onapi/runtime/${protocol}/adapter`)
          return { [adapterName]: Adapter };
        if (id.endsWith("/execution/service"))
          return { executionService: new ExecutionService() };
        if (id.endsWith("/execution/webview-relay")) return relay;
        if (id === "./socket-settings") return { applySocketSettings() {} };
        if (id === "./prepare-socket-options")
          return { prepareSocketOptions() {} };
        if (id.endsWith("/request-storage")) return { getApiList() {} };
        if (id.endsWith("/project-config"))
          return { getCurrentProjectConfig() {} };
        if (id === "vscode") return { workspace: {} };
        return nativeDependency(id);
      },
    );
    const { handleRequestPanelCommand } = await load(
      "apps/extension/src/features/requests/request-panel-handler.ts",
      (id) => {
        if (id === `./execution/${protocol}-session`)
          return { ...host, [prepare]: async () => ({}) };
        if (id.endsWith("/panel-actions"))
          return { handlePanelAction: () => false };
        if (id.endsWith("/request-history"))
          return { recordRequestHistory: async () => {} };
        if (id === "vscode") return { workspace: {} };
        if (id.endsWith("/config")) return { globalConfig: {} };
        if (id.endsWith("/request-storage")) return { getApiList() {} };
        if (id.endsWith("/project-config"))
          return { getCurrentProjectConfig() {}, setProjectConfig() {} };
        return requestPanelStubs[id] ?? nativeDependency(id);
      },
    );
    await handleRequestPanelCommand(
      { action, requestId, data: { target: { id: "request" } } },
      {},
      panel,
      {},
    );
    await completed;
    assert.ok(events.length >= 4);
    assert.ok(events.every((event) => event.sessionId === requestId));
    assert.equal(state.session.opened, true);
    assert.equal(state.session.status, "succeeded");
    assert.deepEqual(
      Array.from(state.socketRes, (entry) => entry.action),
      ["connect", "message"],
    );
    await owners.disposeExecutionOwner(panel);
  });
}
