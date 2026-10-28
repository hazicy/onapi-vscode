import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "../helpers/loadTypeScript.mjs";
const executionState = await load(
  "apps/webviews/src/features/requests/execution/http-state.ts",
);

test("sending and cancelling preserve results and prevent duplicate sends", async () => {
  const response = { code: 200, body: "previous" };
  const state = {
    currentSendingData: {
      result: { executionId: "old", response },
      status: "succeeded",
      error: { message: "old error" },
    },
  };
  state.updateCurrentSendingData = (next) => {
    state.currentSendingData = next;
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
    "apps/webviews/src/features/requests/utils/requestExecution.ts",
    (id) =>
      id === "@/shared/bridge/request-panel"
        ? bridge
        : id.endsWith("execution/http-state")
          ? executionState
          : { default: { getState: () => state } },
    {
      window: { vscode: { postMessage: (message) => messages.push(message) } },
    },
  );
  const executionId = beginRequest();
  assert.equal(typeof executionId, "string");
  assert.equal(state.currentSendingData.executionId, executionId);
  assert.equal(state.currentSendingData.result.response, response);
  assert.equal(state.currentSendingData.error, null);
  assert.equal(state.currentSendingData.status, "sending");
  const pending = state.currentSendingData;
  assert.equal(beginRequest(), undefined);
  assert.equal(state.currentSendingData, pending);
  cancelRequest();
  assert.equal(state.currentSendingData.result.response, response);
  assert.equal(state.currentSendingData.status, "cancelled");
  assert.equal(messages.length, 1);
  assert.equal(messages[0].action, "stopSendApi");
  assert.equal(messages[0].executionId, executionId);
});
