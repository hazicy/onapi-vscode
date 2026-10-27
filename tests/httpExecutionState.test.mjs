import { test } from "node:test";
import assert from "node:assert/strict";
import load from "./helpers/loadTypeScript.mjs";

const { reduceHttpExecutionEvent: reduce } = await load(
  "apps/webviews/src/features/requests/execution/http-state.ts",
);
const plain = (value) => JSON.parse(JSON.stringify(value));

test("a new HTTP execution clears previous results without mutating the old state", () => {
  const previous = {
    response: { code: 500 },
    error: { message: "old" },
    events: [],
    consoleList: ["old"],
    assertions: ["old"],
    visualizerHtml: "old",
  };
  const snapshot = structuredClone(previous);
  const start = { type: "start" };
  const next = reduce(previous, start);
  assert.deepEqual(plain(next), {
    events: [start],
    sendStatus: "sending",
    consoleList: [],
    assertions: [],
  });
  assert.deepEqual(previous, snapshot);
});

test("HTTP chunks, logs, assertions and visualizers preserve the request result and event order", () => {
  const events = [
    { type: "start" },
    { type: "responseData", data: "data: hello\n\n" },
    {
      type: "request",
      response: { code: 200 },
      request: { method: "GET" },
      cookies: [{ name: "session", value: "one" }],
    },
    { type: "console", messages: ["hello"] },
    { type: "assertion", assertions: [{ assertion: "status", passed: true }] },
    { type: "assertion", assertions: { invalid: true } },
    { type: "item", visualizer: "<p>result</p>" },
    { type: "done", error: null },
  ];
  let state;
  for (const event of events) {
    const previous = state && structuredClone(plain(state));
    const next = reduce(state, event);
    if (state) assert.deepEqual(plain(state), previous);
    state = next;
  }
  assert.deepEqual(plain(state.events), events);
  assert.deepEqual(plain(state.response), { code: 200 });
  assert.deepEqual(plain(state.cookies), [{ name: "session", value: "one" }]);
  assert.deepEqual(plain(state.consoleList), [events[3]]);
  assert.deepEqual(plain(state.assertions), events[4].assertions);
  assert.equal(state.visualizerHtml, "<p>result</p>");
  assert.equal(state.sendStatus, "initial");
});

test("HTTP completion retains a script failure when the terminal event has no error", () => {
  const error = { message: "script failed" };
  const failed = reduce(reduce(undefined, { type: "start" }), {
    type: "exception",
    error,
  });
  const complete = reduce(failed, { type: "done", error: null });
  assert.equal(complete.error, error);
  assert.equal(complete.sendStatus, "sendError");
  assert.equal(complete.message, error.message);
  const terminal = reduce(failed, {
    type: "done",
    error: { message: "network failed" },
  });
  assert.equal(terminal.message, "network failed");
  assert.equal(failed.error, error);
});
