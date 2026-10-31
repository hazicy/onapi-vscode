import { test } from "node:test";
import assert from "node:assert/strict";
import load from "../helpers/loadTypeScript.mjs";
const { parseEventStream, isEventStream, eventStreamText } = await load(
  "apps/webviews/src/features/requests/execution/event-stream.ts",
);
const plain = (value) => JSON.parse(JSON.stringify(value));

test("SSE frames preserve multiline data, names and IDs without dispatching partial events", () => {
  const body =
    "\uFEFF: heartbeat\r\n\r\nid: 7\r\nevent: update\r\ndata: 你好\r\ndata: world\r\n\r\ndata: next\n\nid:\n\ndata: reset\n\ndata: incomplete";
  assert.deepEqual(plain(parseEventStream(body)), [
    { event: "update", id: "7", data: "你好\nworld" },
    { event: "message", id: "7", data: "next" },
    { event: "message", id: "", data: "reset" },
  ]);
  assert.equal(parseEventStream("data: half\r\n\r").length, 0);
  assert.equal(parseEventStream("data: half\r\n\r\n").length, 1);
});

test("HTTP stream detection uses current response headers, never request kind or old result", () => {
  const state = {
    executionId: "current",
    result: {
      executionId: "current",
      response: {
        header: [
          { key: "Content-Type", value: "Text/Event-Stream; charset=utf-8" },
        ],
      },
    },
    events: [
      { type: "responseData", data: "data: one\n" },
      { type: "console" },
      { type: "responseData", data: "\n" },
    ],
  };
  assert.equal(isEventStream(state), true);
  assert.equal(eventStreamText(state), "data: one\n\n");
  assert.equal(isEventStream({ ...state, executionId: "next" }), false);
  state.result.response.header[0].value = "application/json";
  assert.equal(isEventStream(state), false);
  assert.equal(isEventStream(undefined), false);
});
