import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "../helpers/loadTypeScript.mjs";

const { createStore } = await nativeDependency("zustand/vanilla");
async function createSocketStore() {
  const { default: store } = await load(
    "apps/webviews/src/features/requests/store/useApis/websocket.ts",
    () => ({
      create: () => (initializer) => createStore(initializer),
      devtools: (initializer) => initializer,
    }),
  );
  return store;
}
const plain = (value) => JSON.parse(JSON.stringify(value));

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
  assert.equal(pool.ws.status, "connecting");
  assert.equal(pool.ws.socketRes, previous.ws.socketRes);
  assert.equal(pool.ws.responseData, undefined);
  assert.equal(pool.socketio, previous.socketio);
  store.getState().appendConnectionResult("ws", "disconnect", {
    action: "error",
    message: "closed",
  });
  assert.equal(
    store.getState().websocketConnectionPool.ws.status,
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
    assert.equal(pool[targetId].status, "disconnect");
    assert.equal(pool[targetId].requestId, undefined);
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
