import { test } from "node:test";
import assert from "node:assert/strict";
import load from "./helpers/loadTypeScript.mjs";
const { reduceHttpExecutionEvent: reduce, hasCompletedResponse } = await load(
  "apps/webviews/src/features/requests/execution/http-state.ts",
);
const { createExecutionConsumer } = await load(
  "apps/webviews/src/features/requests/execution/consume-event.ts",
);
const begin = (state, executionId = "current") =>
  reduce(state, { type: "begin", executionId });
const event = (
  state,
  value,
  executionId = state.executionId,
  sequence = (state.sequence || 0) + 1,
) => reduce(state, { type: "event", executionId, sequence, event: value });
const plain = (value) => JSON.parse(JSON.stringify(value));

test("a new execution preserves the display result and resets runtime data immutably", () => {
  const previous = {
    status: "succeeded",
    executionId: "old",
    result: { executionId: "old", response: { code: 200 } },
    error: { message: "old" },
    consoleList: ["old"],
    assertions: ["old"],
  };
  const snapshot = structuredClone(previous);
  const state = begin(previous);
  assert.equal(state.result, previous.result);
  assert.equal(state.status, "sending");
  assert.equal(state.error, null);
  assert.deepEqual(plain(state.consoleList), []);
  assert.equal(hasCompletedResponse(state), false);
  assert.deepEqual(previous, snapshot);
});

test("native events accumulate logs and assertions and replace response and visualizer", () => {
  const events = [
    { type: "start" },
    { type: "responseData", data: "chunk" },
    {
      type: "request",
      response: { code: 200 },
      request: { method: "GET" },
      cookies: [{ name: "one" }],
    },
    { type: "console", messages: ["hello"] },
    { type: "assertion", assertions: [{ assertion: "status" }] },
    { type: "assertion", assertions: { invalid: true } },
    { type: "item", visualizer: "<p>result</p>" },
    { type: "done" },
  ];
  let state = begin(undefined);
  for (const value of events) {
    const snapshot = structuredClone(plain(state));
    const next = event(state, value);
    assert.deepEqual(plain(state), snapshot);
    state = next;
  }
  assert.deepEqual(plain(state.events), events);
  assert.deepEqual(plain(state.consoleList), [events[3]]);
  assert.deepEqual(plain(state.assertions), events[4].assertions);
  assert.equal(state.result.visualizerHtml, "<p>result</p>");
  assert.equal(state.result.cookies[0].name, "one");
  assert.equal(hasCompletedResponse(state), true);
});

test("cancellation before host startup cannot reassign the old run after a retry", () => {
  let state = begin(undefined, "A");
  state = reduce(state, { type: "cancel", executionId: "A" });
  state = begin(state, "B");
  for (const value of [
    { type: "start" },
    { type: "request", response: { code: 200 } },
    { type: "done" },
  ]) {
    assert.equal(event(state, value, "A"), state);
  }
  assert.equal(state.executionId, "B");
  assert.equal(state.status, "sending");
});

test("only the current execution can cancel or complete and duplicates cannot run twice", () => {
  let state = begin(undefined);
  assert.equal(reduce(state, { type: "cancel", executionId: "old" }), state);
  state = event(state, { type: "request", response: { code: 201 } });
  assert.equal(
    event(state, { type: "request", response: { code: 500 } }, "old"),
    state,
  );
  assert.equal(
    event(
      state,
      { type: "console", messages: ["duplicate"] },
      "current",
      state.sequence,
    ),
    state,
  );
  state = event(state, { type: "done" });
  assert.equal(hasCompletedResponse(state), true);
  assert.equal(event(state, { type: "done" }), state);
});

test("cancelling a resend retains the previous result and rejects late responses", () => {
  let state = event(begin(undefined, "A"), {
    type: "request",
    response: { code: 200 },
  });
  state = event(state, { type: "done" });
  const result = state.result;
  state = begin(state, "B");
  state = reduce(state, { type: "cancel", executionId: "B" });
  assert.equal(state.result, result);
  assert.equal(hasCompletedResponse(state), false);
  assert.equal(
    event(state, { type: "request", response: { code: 500 } }),
    state,
  );
});

test("completion with no response cannot save a retained result", () => {
  const old = {
    status: "succeeded",
    result: { executionId: "old", response: { code: 200 } },
  };
  const state = event(begin(old), { type: "done" });
  assert.equal(state.status, "succeeded");
  assert.equal(state.result, old.result);
  assert.equal(hasCompletedResponse(state), false);
});

test("script and network errors retain their cause and preserve old display data", () => {
  const old = {
    status: "succeeded",
    result: { executionId: "old", response: { code: 200 } },
  };
  const error = { message: "failed" };
  let state = event(begin(old), { type: "request", error });
  state = event(state, { type: "done", error: null });
  assert.equal(state.status, "failed");
  assert.equal(state.error, error);
  assert.equal(state.result, old.result);
  state = event(begin(state, "retry"), { type: "exception", error });
  state = event(state, { type: "done" });
  assert.equal(state.error, error);
  assert.equal(hasCompletedResponse(state), false);
});

test("HTTP protocol errors reach the reducer even before session startup", () => {
  let state = begin(undefined, "failure");
  const consume = createExecutionConsumer();
  const views = {
    http: (value, executionId, sequence) => {
      state = event(state, value, executionId, sequence);
    },
    websocket() {},
    socketio() {},
  };
  consume(
    {
      protocolVersion: 1,
      sessionId: "failure",
      targetId: "request",
      sequence: 1,
      timestamp: 0,
      event: {
        protocol: "http",
        type: "execution.error",
        error: { message: "preparation failed" },
      },
    },
    views,
  );
  assert.equal(state.status, "failed");
  assert.equal(state.error.message, "preparation failed");
});
