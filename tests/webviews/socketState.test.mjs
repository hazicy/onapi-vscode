import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "../helpers/loadTypeScript.mjs";

const sessionState = await load(
  "apps/webviews/src/features/requests/execution/session.ts",
);
const socketState = await load(
  "apps/webviews/src/features/requests/protocols/shared/socket-state.ts",
  () => sessionState,
);
const { createStore } = await nativeDependency("zustand/vanilla");
async function createSocketStore() {
  const { default: store } = await load(
    "apps/webviews/src/features/requests/store/useSocketConnectionsStore.ts",
    (id) =>
      id.endsWith("/session")
        ? sessionState
        : id.includes("socket-state")
          ? socketState
          : {
              create: () => (initializer) => createStore(initializer),
              devtools: (initializer) => initializer,
            },
  );
  return store;
}
const status = socketState.getSocketConnectionStatus;
const plain = (value) => JSON.parse(JSON.stringify(value));

const envelope = (sessionId, sequence, event, targetId = "ws") => ({
  protocolVersion: 1,
  sessionId,
  sequence,
  targetId,
  timestamp: 1,
  event: { protocol: "websocket", ...event },
});

test("socket reducer rejects stale starts, duplicate events and messages after local disconnect", async () => {
  const store = await createSocketStore();
  const send = (session, sequence, event) =>
    store.getState().consumeExecutionEvent(envelope(session, sequence, event));
  store.getState().startConnection("ws", "new");
  const pending = store.getState();
  send("old", 1, { type: "session.started" });
  assert.equal(store.getState(), pending);
  send("new", 1, { type: "session.started" });
  send("new", 2, {
    type: "connection.opened",
    result: {
      type: "connection",
      isSuccess: true,
      data: { response: { headers: { server: "echo" } } },
    },
  });
  const connected = store.getState();
  send("new", 2, { type: "connection.opened", result: { type: "connection" } });
  assert.equal(store.getState(), connected);
  send("old", 99, { type: "message.received", result: { type: "message" } });
  assert.equal(store.getState(), connected);
  send("new", 3, {
    type: "message.received",
    result: { type: "message", message: "hello" },
  });
  assert.equal(
    store.getState().websocketConnectionPool.ws.responseData.response.headers
      .server,
    "echo",
  );
  store.getState().appendConnectionResult("ws", "disconnect", {});
  const closed = store.getState();
  send("new", 4, {
    type: "message.received",
    result: { type: "message", message: "late" },
  });
  send("old", 1, { type: "session.started" });
  assert.equal(store.getState(), closed);
  store.getState().startConnection("ws", "retry");
  send("retry", 1, { type: "session.started" });
  send("retry", 2, {
    type: "connection.opened",
    result: { type: "connection", isSuccess: true },
  });
  assert.equal(status(store.getState().websocketConnectionPool.ws), "connect");
});

test("Socket.IO reducer records subscriptions and acks while send errors preserve the connection", () => {
  const reduce = socketState.reduceSocketExecutionEvent;
  let state;
  let sequence = 0;
  const send = (event) => {
    state = reduce(
      state,
      envelope("io", ++sequence, { protocol: "socketio", ...event }),
    );
  };
  send({ type: "session.started" });
  send({
    type: "connection.opened",
    result: {
      type: "connect",
      isSuccess: true,
      actualRequestParas: { url: "http://echo" },
    },
  });
  send({
    type: "subscriptions.updated",
    subscriptions: { addedEvents: ["echo"], removedEvents: ["old"] },
  });
  send({
    type: "ack.received",
    result: { type: "send_ack", message: { event: "echo", data: [1, 2] } },
  });
  send({
    type: "execution.error",
    result: { type: "error", isSuccess: false, message: "bad send" },
  });
  assert.equal(status(state), "connect");
  assert.equal(state.responseData.url, "http://echo");
  assert.deepEqual(plain(state.socketRes.map((item) => item.action)), [
    "connect",
    "listen-end",
    "listen",
    "send_ack",
    "error",
  ]);
  send({
    type: "connection.closed",
    result: { type: "disconnect", isSuccess: true },
  });
  const closed = state;
  send({
    type: "message.received",
    result: { type: "message", message: "late" },
  });
  assert.equal(state, closed);
});

test("socket updates preserve other connections, messages and handshake metadata", async () => {
  const store = await createSocketStore();
  const { appendConnectionResult: append } = store.getState();
  append(
    "ws",
    "connect",
    { action: "connect" },
    { headers: { server: "echo" } },
  );
  const previous = store.getState().websocketConnectionPool;
  const snapshot = plain(previous);
  append(
    "socketio",
    "connect",
    { action: "listen", message: "event" },
    { query: { token: "one" } },
  );
  append("ws", "connect", { action: "message", message: "hello" });
  const pool = store.getState().websocketConnectionPool;
  assert.deepEqual(plain(previous), snapshot);
  assert.deepEqual(plain(pool.ws.socketRes), [
    { action: "connect" },
    { action: "message", message: "hello" },
  ]);
  assert.deepEqual(plain(pool.ws.responseData), {
    headers: { server: "echo" },
  });
  assert.deepEqual(plain(pool.socketio.responseData), {
    query: { token: "one" },
  });
});

test("reconnecting retains history and clears obsolete handshake data only for that connection", async () => {
  const store = await createSocketStore();
  store
    .getState()
    .appendConnectionResult(
      "ws",
      "connect",
      { action: "connect" },
      { header: "old" },
    );
  store.getState().appendConnectionResult("ws", "connect", {
    action: "message",
    message: "hello",
  });
  store
    .getState()
    .appendConnectionResult("socketio", "connect", { action: "listen" });
  const previous = store.getState().websocketConnectionPool;
  const snapshot = plain(previous);
  store.getState().startConnection("ws");
  const pool = store.getState().websocketConnectionPool;
  assert.deepEqual(plain(previous), snapshot);
  assert.equal(status(pool.ws), "connecting");
  assert.equal(pool.ws.socketRes, previous.ws.socketRes);
  assert.equal(pool.ws.responseData, undefined);
  assert.equal(pool.socketio, previous.socketio);
  store.getState().appendConnectionResult("ws", "disconnect", {
    action: "error",
    message: "closed",
  });
  assert.equal(
    status(store.getState().websocketConnectionPool.ws),
    "disconnect",
  );
  assert.equal(store.getState().websocketConnectionPool.ws.socketRes.length, 3);
});

test("an absent socket payload leaves connection state untouched", async () => {
  const store = await createSocketStore();
  const previous = store.getState();
  store.getState().appendConnectionResult("ws", "connect", undefined);
  assert.equal(store.getState(), previous);
});

for (const targetId of ["ws", "socketio"]) {
  test(`${targetId} preparation failures reset only the matching pending connection`, async () => {
    const store = await createSocketStore();
    const { startConnection, failConnection, appendConnectionResult } =
      store.getState();
    appendConnectionResult(targetId, "disconnect", {
      action: "message",
      message: "history",
    });
    startConnection("other", "other-attempt");
    startConnection(targetId, "old");
    startConnection(targetId, "current");
    const pending = store.getState();
    failConnection(targetId, "old", { message: "Late error" });
    assert.equal(store.getState(), pending);
    failConnection(targetId, "current", { message: "Preparation failed" });
    const pool = store.getState().websocketConnectionPool;
    assert.equal(status(pool[targetId]), "disconnect");
    assert.equal(pool[targetId].session.status, "failed");
    assert.equal(pool[targetId].socketRes.length, 2);
    assert.equal(
      pool[targetId].socketRes[1].message.message,
      "Preparation failed",
    );
    assert.equal(pool.other, pending.websocketConnectionPool.other);
    const failed = store.getState();
    failConnection(targetId, "current", { message: "Duplicate" });
    assert.equal(store.getState(), failed);

    startConnection(targetId, "cancelled");
    appendConnectionResult(targetId, "disconnect", {});
    const cancelled = store.getState();
    failConnection(targetId, "cancelled", { message: "Late after cancel" });
    assert.equal(store.getState(), cancelled);

    startConnection(targetId, "connected");
    appendConnectionResult(targetId, "connect", { action: "connect" });
    const connected = store.getState();
    failConnection(targetId, "connected", { message: "Late after connection" });
    assert.equal(store.getState(), connected);
  });
}
