import { test } from "node:test";
import assert from "node:assert/strict";
import load from "../helpers/loadTypeScript.mjs";
const { beginSession, acceptsSession, advanceSession, finishSession } =
  await load("apps/webviews/src/features/requests/execution/session.ts");

test("sessions reject foreign, unordered and invalid events without mutation", () => {
  const initial = beginSession("current");
  const next = advanceSession(initial, "current", 3);
  assert.equal(initial.sequence, 0);
  assert.equal(next.sequence, 3);
  for (const sequence of [0, 2, 3, NaN, Infinity, 3.5]) {
    assert.equal(advanceSession(next, "current", sequence), undefined);
  }
  assert.equal(advanceSession(next, "old", 99), undefined);
});

test("every terminal status blocks events and local actions until a new session begins", () => {
  for (const status of ["succeeded", "failed", "cancelled"]) {
    const closed = finishSession(beginSession("run"), status);
    assert.equal(acceptsSession(closed, "run"), false);
    assert.equal(advanceSession(closed, "run", 99), undefined);
    assert.equal(finishSession(closed, "failed"), closed);
    assert.equal(acceptsSession(beginSession("retry"), "retry", 1), true);
  }
});

const { reduceSession, receiveSessionEvent } = await load(
  "apps/webviews/src/features/requests/execution/session.ts",
);
const envelope = (protocol, sequence, event, sessionId = "run") => ({
  protocolVersion: 1,
  sessionId,
  sequence,
  event: { protocol, ...event },
});

test("startup cannot replace an existing session, reopen a terminal session or replay startup", () => {
  let state = beginSession("run");
  const initial = state;
  assert.equal(
    receiveSessionEvent(
      state,
      envelope("websocket", 1, { type: "session.started" }, "old"),
    ),
    state,
  );
  state = receiveSessionEvent(
    state,
    envelope("websocket", 1, { type: "session.started" }),
  );
  assert.equal(initial.sequence, 0);
  assert.equal(
    receiveSessionEvent(
      state,
      envelope("websocket", 2, { type: "session.started" }),
    ),
    state,
  );
  state = reduceSession(state, {
    type: "finish",
    executionId: "run",
    status: "cancelled",
  });
  assert.equal(
    receiveSessionEvent(
      state,
      envelope("websocket", 3, { type: "session.started" }),
    ),
    state,
  );
  assert.equal(state.status, "cancelled");
});

for (const protocol of ["ai", "mcp", "grpc"]) {
  test(`${protocol} errors survive completion and terminal sessions reject later events`, () => {
    let state = beginSession("run");
    state = receiveSessionEvent(
      state,
      envelope(protocol, 1, {
        type: "execution.error",
        error: { message: "failed" },
      }),
    );
    assert.equal(state.status, "running");
    state = receiveSessionEvent(
      state,
      envelope(protocol, 2, { type: "execution.completed" }),
    );
    assert.equal(state.status, "failed");
    assert.equal(
      receiveSessionEvent(
        state,
        envelope(protocol, 3, { type: "session.closed" }),
      ),
      state,
    );
  });
}

test("socket send errors preserve the connection but connection failure terminates it", () => {
  let state = beginSession("run");
  state = receiveSessionEvent(
    state,
    envelope("socketio", 1, {
      type: "connection.opened",
      result: { type: "connect", isSuccess: true },
    }),
  );
  state = receiveSessionEvent(
    state,
    envelope("socketio", 2, {
      type: "execution.error",
      result: { type: "error", isSuccess: false },
    }),
  );
  assert.equal(state.status, "running");
  assert.equal(state.opened, true);
  state = receiveSessionEvent(
    state,
    envelope("socketio", 3, {
      type: "connection.closed",
      result: { type: "disconnect", isSuccess: true },
    }),
  );
  assert.equal(state.status, "succeeded");
  const failed = receiveSessionEvent(
    beginSession("run"),
    envelope("websocket", 1, {
      type: "connection.opened",
      result: { type: "connection", isSuccess: false },
    }),
  );
  assert.equal(failed.status, "failed");
});
