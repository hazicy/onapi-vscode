import { test } from "node:test";
import assert from "node:assert/strict";
import load from "./helpers/loadTypeScript.mjs";

test("sending and cancelling preserve results and prevent duplicate sends", async () => {
  const response = { code: 200, body: "previous" };
  const state = {
    currentSendingData: {
      response,
      sendStatus: "initial",
      message: "old error",
    },
  };
  state.updateCurrentSendingData = (next) => {
    state.currentSendingData = next;
  };
  const messages = [];
  let cancellations = 0;
  const { beginRequest, cancelRequest } = await load(
    "apps/webviews/src/features/requests/utils/requestExecution.ts",
    (id) =>
      id === "@/app/store"
        ? {
            useGlobal: {
              getState: () => ({
                cancelToken: () => {
                  cancellations++;
                },
              }),
            },
          }
        : { default: { getState: () => state } },
    {
      window: { vscode: { postMessage: (message) => messages.push(message) } },
    },
  );
  assert.equal(beginRequest(), true);
  assert.equal(state.currentSendingData.response, response);
  assert.equal(state.currentSendingData.message, undefined);
  assert.equal(state.currentSendingData.sendStatus, "sending");
  const pending = state.currentSendingData;
  assert.equal(beginRequest(), false);
  assert.equal(state.currentSendingData, pending);
  cancelRequest();
  assert.equal(state.currentSendingData.response, response);
  assert.equal(state.currentSendingData.sendStatus, "initial");
  assert.equal(cancellations, 1);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].action, "stopSendApi");
});
