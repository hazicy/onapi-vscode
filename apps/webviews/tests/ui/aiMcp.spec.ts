import { test, expect, type Page } from "@playwright/test";

async function respond(
  page: Page,
  type: string,
  fields: Record<string, unknown> = {},
) {
  await page.evaluate(
    ({ type, fields }) => {
      const sent = (window as any).aiMcpMessages.findLast((message: any) =>
        ["ai_send", "mcp_connect", "mcp_request"].includes(message.action),
      );
      (window as any).aiMcpSequences ??= {};
      const sequence =
        ((window as any).aiMcpSequences[sent.requestId] ?? 0) + 1;
      (window as any).aiMcpSequences[sent.requestId] = sequence;
      const eventType =
        {
          delta: "response.chunk",
          done: "response.received",
          connected: "connection.opened",
          result: "response.received",
        }[type] ?? type;
      const emit = (event: Record<string, unknown>, sequence: number) =>
        window.dispatchEvent(
          new MessageEvent("message", {
            data: {
              action: "protocolExecutionEvent",
              data: {
                protocolVersion: 1,
                sessionId: sent.requestId,
                targetId: "ai-mcp-fixture",
                sequence,
                timestamp: Date.now(),
                event,
              },
            },
          }),
        );
      const protocol = sent.action.startsWith("ai_") ? "ai" : "mcp";
      emit({ protocol, type: eventType, ...fields }, sequence);
      if (type === "done" || type === "result") {
        emit(
          { protocol, type: "execution.completed", failed: false },
          sequence + 1,
        );
        (window as any).aiMcpSequences[sent.requestId] = sequence + 1;
      }
    },
    { type, fields },
  );
}
test("AI streams a conversation and saves it without the API key", async ({
  page,
}) => {
  await page.goto("/?aiMcp=ai");
  await page.getByRole("button", { name: "设置 Settings" }).click();
  await page.getByLabel("API Key").fill("secret-test");
  await page.getByRole("button", { name: "对话 Chat" }).click();
  await page.getByLabel("Message", { exact: true }).fill("hello");
  await page.getByRole("button", { name: "发送 Send" }).click();
  await expect(page.getByRole("button", { name: "停止 Stop" })).toBeVisible();
  await respond(page, "delta", { text: "Hello back" });
  await expect(page.getByText("Hello back", { exact: true })).toBeVisible();
  await respond(page, "done", {
    value: { usage: { outputTokens: 2 }, finishReason: "stop" },
  });
  await expect(page.getByRole("button", { name: "发送 Send" })).toBeVisible();
  await page.getByRole("button", { name: "保存 Save" }).click();
  const saved = await page.evaluate(() => (window as any).aiMcpMessages.at(-1));
  expect(saved.action).toBe("saveApiData");
  expect(saved.data.ai.messages).toEqual([
    { role: "user", content: "hello" },
    { role: "assistant", content: "Hello back" },
  ]);
  expect(JSON.stringify(saved)).not.toContain("secret-test");
});
test("MCP discovers tools, prepares a call, and shows invalid arguments", async ({
  page,
}) => {
  await page.goto("/?aiMcp=mcp");
  await page.getByRole("button", { name: "连接 Connect" }).click();
  await respond(page, "connected", { value: {} });
  await expect(page.getByRole("status")).toContainText("Connected");
  await page.getByRole("button", { name: "发送 Send" }).click();
  await respond(page, "result", {
    value: { tools: [{ name: "echo", description: "Echo a message" }] },
  });
  await page.getByRole("button", { name: "echo Echo a message" }).click();
  await expect(page.getByLabel("MCP method")).toHaveValue("tools/call");
  await page.getByLabel("Arguments (JSON)").fill("invalid");
  await page.getByRole("button", { name: "发送 Send" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByLabel("Arguments (JSON)").fill('{"message":"hello"}');
  await page.getByRole("button", { name: "发送 Send" }).click();
  const call = await page.evaluate(() => (window as any).aiMcpMessages.at(-1));
  expect(call.data.operation).toEqual({
    method: "tools/call",
    name: "echo",
    arguments: { message: "hello" },
  });
  await respond(page, "result", {
    value: { content: [{ type: "text", text: "hello" }] },
  });
  await expect(
    page.getByText('"hello"', { exact: false }).last(),
  ).toBeVisible();
});

test("AI handles correlated host validation failures and allows another send", async ({
  page,
}) => {
  await page.goto("/?aiMcp=ai");
  await page.getByLabel("Server URL").fill("invalid-url");
  await page.getByLabel("Message", { exact: true }).fill("hello");
  await page.getByRole("button", { name: "发送 Send" }).click();
  await page.evaluate(() => {
    const sent = (window as any).aiMcpMessages.at(-1);
    window.dispatchEvent(
      new MessageEvent("message", {
        data: {
          action: "requestPanelError",
          requestId: sent.requestId,
          data: { action: "ai_send", error: { message: "Invalid URL" } },
        },
      }),
    );
  });
  await expect(page.getByRole("alert")).toContainText("Invalid URL");
  await expect(page.getByRole("button", { name: "停止 Stop" })).toHaveCount(0);
  await expect(page.getByLabel("Server URL")).toBeEnabled();
});
test("MCP raw arguments survive native save and revert follows the document", async ({
  page,
}) => {
  await page.goto("/?aiMcp=mcp");
  await page.getByRole("button", { name: "设置 Settings" }).click();
  await page.getByLabel("Transport").selectOption("stdio");
  await page.getByLabel("Command", { exact: true }).fill("node");
  await page.getByLabel("Arguments (JSON array)").fill('["server.js"]');
  await page.getByRole("button", { name: "Checkpoint", exact: true }).click();
  await page.getByLabel("Arguments (JSON array)").fill('["unfinished');
  await page.getByRole("button", { name: "Native save", exact: true }).click();
  const saved = await page.evaluate(() => (window as any).aiMcpMessages.at(-1));
  expect(saved.data.draft.argsText).toBe('["unfinished');
  await page
    .getByRole("button", { name: "Revert document", exact: true })
    .click();
  await expect(page.getByLabel("Arguments (JSON array)")).toHaveValue(
    '["server.js"]',
  );
  await page.getByRole("button", { name: "Headers", exact: true }).click();
  await page.getByLabel("Headers JSON").fill('{"Authorization":"test"}');
  await page
    .getByRole("button", { name: "Revert document", exact: true })
    .click();
  await expect(page.getByLabel("Headers JSON")).toHaveValue("{}");
});
test("MCP discovers additional pages and forwards the cursor", async ({
  page,
}) => {
  await page.goto("/?aiMcp=mcp");
  await page.getByRole("button", { name: "连接 Connect" }).click();
  await respond(page, "connected", { value: {} });
  await page.getByRole("button", { name: "发送 Send" }).click();
  await respond(page, "result", {
    value: { tools: [{ name: "first" }], nextCursor: "page-2" },
  });
  await page.getByRole("button", { name: "加载更多 Load more" }).click();
  const request = await page.evaluate(() =>
    (window as any).aiMcpMessages.at(-1),
  );
  expect(request.data.operation.cursor).toBe("page-2");
  await respond(page, "result", { value: { tools: [{ name: "second" }] } });
  await expect(
    page.getByRole("button", { name: "first", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "second", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "加载更多 Load more" }),
  ).toHaveCount(0);
});

test("AI stop preserves partial output and reports a cancellation terminal state", async ({
  page,
}) => {
  await page.goto("/?aiMcp=ai");
  await page.getByLabel("Message", { exact: true }).fill("hello");
  await page.getByRole("button", { name: "发送 Send" }).click();
  await respond(page, "delta", { text: "partial answer" });
  await page.getByRole("button", { name: "停止 Stop" }).click();
  await respond(page, "execution.cancelled");
  await respond(page, "execution.completed", { failed: false });
  await expect(page.getByRole("status")).toContainText("Cancelled");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "停止 Stop" })).toHaveCount(0);
  await page.getByRole("button", { name: "Native save", exact: true }).click();
  const saved = await page.evaluate(() => (window as any).aiMcpMessages.at(-1));
  expect(saved.data.ai.messages.at(-1)).toEqual({
    role: "assistant",
    content: "partial answer",
  });
});
