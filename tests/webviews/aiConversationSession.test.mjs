import { test } from "node:test";
import assert from "node:assert/strict";
import load from "../helpers/loadTypeScript.mjs";

test("AI cancellation saves partial output once before the session rejects later completion", async () => {
  const slots = [];
  let cursor = 0;
  let listener;
  const react = {
    useRef(current) {
      const index = cursor++;
      return (slots[index] ??= { current });
    },
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [
        slots[index],
        (value) => {
          slots[index] =
            typeof value === "function" ? value(slots[index]) : value;
        },
      ];
    },
    useEffect(effect) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = effect();
    },
  };
  const globals = {
    performance: { now: () => 10 },
    window: {
      addEventListener: (_, callback) => {
        listener = callback;
      },
      removeEventListener: () => {},
    },
  };
  const sessions = await load(
    "apps/webviews/src/features/requests/execution/session.ts",
  );
  const commands = [];
  const bridge = {
    readRequestPanelResponse: (data) => data,
    sendRequestPanelMessage: (command) => commands.push(command),
  };
  const execution = await load(
    "apps/webviews/src/features/requests/execution/useProtocolExecution.ts",
    (id) =>
      id === "react" ? react : id.endsWith("/session") ? sessions : bridge,
    globals,
  );
  const { useAiConversation } = await load(
    "apps/webviews/src/features/requests/protocols/ai/useAiConversation.ts",
    (id) =>
      id === "react"
        ? react
        : id === "react-i18next"
          ? { useTranslation: () => ({ t: (key) => key }) }
          : id.endsWith("useProtocolExecution")
            ? execution
            : id.endsWith("request-input")
              ? { parseAiConfig: (record) => record.ai }
              : bridge,
    globals,
  );
  let record = {
    id: "ai",
    url: "http://example.test",
    ai: {
      provider: "openai",
      model: "test",
      prompt: "hello",
      messages: [],
    },
  };
  let writes = 0;
  const render = () => {
    cursor = 0;
    return useAiConversation(
      record,
      (next) => {
        record = next;
        writes++;
      },
      {},
    );
  };
  render().send();
  const hook = render();
  assert.equal(hook.busy, true);
  const sessionId = commands[0].requestId;
  const emit = (sequence, event) =>
    listener({
      data: {
        action: "protocolExecutionEvent",
        data: {
          protocolVersion: 1,
          targetId: "ai",
          sessionId,
          sequence,
          event: { protocol: "ai", ...event },
        },
      },
    });
  emit(1, { type: "response.chunk", text: "partial" });
  emit(2, { type: "execution.cancelled" });
  assert.equal(record.ai.messages.at(-1).content, "partial");
  assert.equal(record.ai.messages.at(-1).result.state, "cancelled");
  assert.equal(render().busy, false);
  assert.equal(render().partial.text, "");
  emit(3, { type: "execution.completed", failed: false });
  emit(4, { type: "response.chunk", text: "late" });
  assert.equal(writes, 2);
  assert.equal(record.ai.messages.length, 2);
});
