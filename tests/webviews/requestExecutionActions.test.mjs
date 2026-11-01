import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "../helpers/loadTypeScript.mjs";
const sessionState = await load(
  "apps/webviews/src/features/requests/execution/session.ts",
);
const executionState = await load(
  "apps/webviews/src/features/requests/protocols/http/http-state.ts",
  () => sessionState,
);

test("sending and cancelling preserve results and prevent duplicate sends", async () => {
  const response = { code: 200, body: "previous" };
  const state = {
    httpExecution: {
      result: { executionId: "old", response },
      status: "succeeded",
      error: { message: "old error" },
    },
  };
  state.setHttpExecution = (next) => {
    state.httpExecution = next;
  };
  const messages = [];
  const globals = {
    window: { vscode: { postMessage: (message) => messages.push(message) } },
  };
  const bridge = await load(
    "apps/webviews/src/shared/bridge/request-panel.ts",
    nativeDependency,
    globals,
  );
  const { beginRequest, cancelRequest } = await load(
    "apps/webviews/src/features/requests/execution/request-actions.ts",
    (id) =>
      id === "@/shared/bridge/request-panel"
        ? bridge
        : id.endsWith("http/http-state")
          ? executionState
          : { default: { getState: () => state } },
    {
      window: { vscode: { postMessage: (message) => messages.push(message) } },
    },
  );
  const executionId = beginRequest();
  assert.equal(typeof executionId, "string");
  assert.equal(state.httpExecution.session.executionId, executionId);
  assert.equal(state.httpExecution.result.response, response);
  assert.equal(state.httpExecution.error, null);
  assert.equal(state.httpExecution.session.status, "running");
  const pending = state.httpExecution;
  assert.equal(beginRequest(), undefined);
  assert.equal(state.httpExecution, pending);
  cancelRequest();
  assert.equal(state.httpExecution.result.response, response);
  assert.equal(state.httpExecution.session.status, "cancelled");
  assert.equal(messages.length, 1);
  assert.equal(messages[0].action, "stopSendApi");
  assert.equal(messages[0].executionId, executionId);
});
