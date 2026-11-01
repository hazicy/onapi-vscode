import { test } from "node:test";
import assert from "node:assert/strict";
import load from "../helpers/loadTypeScript.mjs";
const sessions = await load(
  "apps/webviews/src/features/requests/execution/session.ts",
);

test("MCP connection and request sessions order independently and cleanup rejects late events", async () => {
  let listener;
  let cleanup;
  const received = [];
  const { useProtocolExecution } = await load(
    "apps/webviews/src/features/requests/execution/useProtocolExecution.ts",
    (id) =>
      id.endsWith("/session")
        ? sessions
        : id === "react"
          ? {
              useRef: (current) => ({ current }),
              useState: (value) => [value, () => {}],
              useEffect: (effect) => {
                cleanup = effect();
              },
            }
          : {
              readRequestPanelResponse: (data) => data,
              sendRequestPanelMessage: () => {},
            },
    {
      window: {
        addEventListener: (_, callback) => {
          listener = callback;
        },
        removeEventListener: () => {},
      },
    },
  );
  const hook = useProtocolExecution("target", (event) => received.push(event));
  const emit = (sessionId, sequence, type) =>
    listener({
      data: {
        action: "protocolExecutionEvent",
        data: {
          protocolVersion: 1,
          targetId: "target",
          sessionId,
          sequence,
          event: { type, protocol: "mcp" },
        },
      },
    });
  const connection = hook.start((requestId) => ({
    action: "mcp_connect",
    requestId,
  }));
  emit(connection, 1, "connection.opened");
  const request = hook.start((requestId) => ({
    action: "mcp_request",
    requestId,
  }));
  emit(connection, 2, "message.received");
  emit(request, 1, "execution.completed");
  emit(request, 2, "execution.completed");
  emit(connection, 2, "message.received");
  emit(connection, 3, "session.closed");
  emit(connection, 4, "message.received");
  assert.equal(received.length, 4);
  assert.equal(hook.activeId(), undefined);
  const pending = hook.start((requestId) => ({ action: "ai_send", requestId }));
  cleanup();
  emit(pending, 1, "execution.completed");
  assert.equal(received.length, 4);
});
