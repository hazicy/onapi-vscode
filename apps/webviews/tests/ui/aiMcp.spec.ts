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
  await page.getByRole("tab", { name: "Authorization" }).click();
  await page.getByLabel("API Key").fill("secret-test");
  await page.getByRole("tab", { name: "Prompt" }).click();
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("hello");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  await respond(page, "delta", { text: "Hello back" });
  await expect(page.getByText("Hello back", { exact: true })).toBeVisible();
  await respond(page, "done", {
    value: { usage: { outputTokens: 2 }, finishReason: "stop" },
  });
  await expect(page.getByRole("button", { name: "Send" })).toBeVisible();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const saved = await page.evaluate(() => (window as any).aiMcpMessages.at(-1));
  expect(saved.action).toBe("saveApiData");
  expect(saved.data.ai.messages).toMatchObject([
    { role: "user", content: "hello" },
    { role: "assistant", content: "Hello back" },
  ]);
  expect(JSON.stringify(saved)).not.toContain("secret-test");
});
test("MCP discovers tools, prepares a call, and shows invalid arguments", async ({
  page,
}) => {
  await page.goto("/?aiMcp=mcp");
  await page.getByRole("button", { name: "Connect" }).click();
  await respond(page, "connected", { value: {} });
  await expect(page.getByRole("status")).toContainText("Connected");
  await page.getByRole("button", { name: "Send" }).click();
  await respond(page, "result", {
    value: { tools: [{ name: "echo", description: "Echo a message" }] },
  });
  await page.getByRole("button", { name: "echo Echo a message" }).click();
  await expect(page.getByLabel("MCP method")).toHaveValue("tools/call");
  await page.getByLabel("Arguments (JSON)").fill("invalid");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByLabel("Arguments (JSON)").fill('{"message":"hello"}');
  await page.getByRole("button", { name: "Send" }).click();
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
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("hello");
  await page.getByRole("button", { name: "Send" }).click();
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
  await expect(page.getByRole("button", { name: "Stop" })).toHaveCount(0);
  await expect(page.getByLabel("Server URL")).toBeEnabled();
});
test("MCP raw arguments survive native save and revert follows the document", async ({
  page,
}) => {
  await page.goto("/?aiMcp=mcp");
  await page.getByRole("tab", { name: "Settings" }).click();
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
  await page.getByRole("tab", { name: "Headers", exact: true }).click();
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
  await page.getByRole("button", { name: "Connect" }).click();
  await respond(page, "connected", { value: {} });
  await page.getByRole("button", { name: "Send" }).click();
  await respond(page, "result", {
    value: { tools: [{ name: "first" }], nextCursor: "page-2" },
  });
  await page.getByRole("button", { name: "Load more" }).click();
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
  await expect(page.getByRole("button", { name: "Load more" })).toHaveCount(0);
});

test("AI stop preserves partial output and reports a cancellation terminal state", async ({
  page,
}) => {
  await page.goto("/?aiMcp=ai");
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("hello");
  await page.getByRole("button", { name: "Send" }).click();
  await respond(page, "delta", { text: "partial answer" });
  await page.getByRole("button", { name: "Stop" }).click();
  await respond(page, "execution.cancelled");
  await respond(page, "execution.completed", { failed: false });
  await expect(page.getByRole("status")).toContainText("Stopped");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Stop" })).toHaveCount(0);
  await page.getByRole("button", { name: "Native save", exact: true }).click();
  const saved = await page.evaluate(() => (window as any).aiMcpMessages.at(-1));
  expect(saved.data.ai.messages.at(-1)).toMatchObject({
    role: "assistant",
    content: "partial answer",
  });
});

test("AI provider selection applies defaults and keeps credentials separate", async ({
  page,
}) => {
  await page.goto("/?aiMcp=ai");
  await page.getByRole("tab", { name: "Authorization", exact: true }).click();
  await page.getByLabel("API Key").fill("openai-secret");
  await page.getByLabel("Provider", { exact: true }).selectOption("deepseek");
  await expect(page.getByLabel("Server URL")).toHaveValue(
    "https://api.deepseek.com",
  );
  await expect(page.getByLabel("Model", { exact: true })).toHaveValue(
    "deepseek-flash",
  );
  await expect(page.getByLabel("API Key")).toHaveValue("");
  await page.getByLabel("API Key").fill("deepseek-secret");
  await page.getByLabel("Provider", { exact: true }).selectOption("openai");
  await expect(page.getByLabel("API Key")).toHaveValue("openai-secret");
  await expect(page.getByLabel("Server URL")).toHaveValue(
    "https://api.openai.com/v1",
  );
  await page.getByLabel("Provider", { exact: true }).selectOption("deepseek");
  await expect(page.getByLabel("API Key")).toHaveValue("deepseek-secret");
  await page.getByRole("tab", { name: "Parameters", exact: true }).click();
  await page.getByLabel("Thinking mode").selectOption("enabled");
  await expect(page.getByLabel("Temperature", { exact: true })).toBeDisabled();
  await page.getByRole("tab", { name: "Prompt", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("hello");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  const request = await page.evaluate(() =>
    (window as any).aiMcpMessages.at(-1),
  );
  expect(request.data.apiKey).toBe("deepseek-secret");
  expect(request.data.config.provider).toBe("deepseek");
  expect(request.data.config.thinking).toBe("enabled");
  await expect(page.getByLabel("Provider", { exact: true })).toBeDisabled();
  await respond(page, "delta", {
    channel: "reasoning",
    text: "Thinking about it",
  });
  await expect(
    page.getByText("Thinking about it", { exact: true }),
  ).toBeVisible();
  await respond(page, "delta", { text: "Answer" });
  await respond(page, "done", {
    value: {
      model: "deepseek-flash",
      usage: { inputTokens: 8, outputTokens: 2, totalTokens: 10 },
      durationMs: 1234,
      finishReason: "stop",
    },
  });
  await expect(page.getByText("1.23s", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const saved = await page.evaluate(() => (window as any).aiMcpMessages.at(-1));
  expect(saved.data.ai.messages.at(-1)).toMatchObject({
    role: "assistant",
    content: "Answer",
    reasoning: "Thinking about it",
  });
  expect(JSON.stringify(saved)).not.toContain("secret");
});

test("AI edits context and regenerates without duplicating user turns", async ({
  page,
}) => {
  await page.goto("/?aiMcp=ai");
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("Original prompt");
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .press("Control+Enter");
  await respond(page, "delta", { text: "First answer" });
  await respond(page, "done", { value: { usage: {}, finishReason: "stop" } });
  await page
    .getByRole("button", { name: "Edit message 1", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Edit message 1", exact: true })
    .fill("Edited prompt");
  await page.getByRole("button", { name: "Regenerate", exact: true }).click();
  const request = await page.evaluate(() =>
    (window as any).aiMcpMessages.at(-1),
  );
  expect(request.data.config.messages).toEqual([
    { role: "user", content: "Edited prompt" },
  ]);
  await respond(page, "delta", { text: "New answer" });
  await respond(page, "done", { value: { usage: {}, finishReason: "stop" } });
  await expect(page.getByText("First answer", { exact: true })).toHaveCount(0);
  await expect(page.getByText("New answer", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Clear chat", exact: true }).click();
  await expect(
    page.getByText("Test your AI model", { exact: true }),
  ).toBeVisible();
});

test("AI controls remain accessible in a narrow panel", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 380, height: 800 });
  await page.goto("/?aiMcp=ai");
  const workspace = page.getByRole("region", {
    name: "AI request",
    exact: true,
  });
  for (const name of ["Prompt", "Authorization", "Parameters", "Headers"]) {
    const tab = workspace.getByRole("tab", { name, exact: true });
    if (await tab.isVisible()) {
      await tab.click();
    } else {
      await workspace
        .getByRole("button", { name: "More tabs", exact: true })
        .click();
      await page.getByRole("menuitem", { name, exact: true }).click();
    }
  }
  await workspace.getByRole("tab", { name: "Prompt", exact: true }).click();
  await workspace
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("hello");
  await workspace.getByRole("button", { name: "Send", exact: true }).click();
  const hasHorizontalOverflow = await workspace.evaluate(
    (node) => node.scrollWidth > node.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
  await workspace.screenshot({ path: testInfo.outputPath("ai-narrow.png") });
  await expect(
    workspace.getByRole("button", { name: "Stop", exact: true }),
  ).toBeVisible();
});

test("AI separates prompt editing from conversation and supports resizing", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto("/?aiMcp=ai");
  await page.addStyleTag({
    content: `:root { --vscode-foreground: #d4d4d4; --vscode-editor-background: #1e1e1e; --vscode-input-background: #252526; --vscode-input-foreground: #d4d4d4; --vscode-panel-border: #3c3c3c; --vscode-input-border: #454545; --vscode-descriptionForeground: #9d9d9d; --vscode-focusBorder: #007fd4; --vscode-button-background: #0078d4; --vscode-button-foreground: #fff; --vscode-textLink-foreground: #4daafc; --vscode-testing-iconPassed: #73c991; }`,
  });
  const prompt = page.getByRole("textbox", { name: "Message", exact: true });
  const system = page.getByLabel("System prompt", { exact: true });
  await prompt.fill("Explain this API response");
  await system.fill("Be concise and give actionable advice.");
  const promptBox = (await prompt.boundingBox())!;
  const systemBox = (await system.boundingBox())!;
  expect(systemBox.x).toBeGreaterThan(promptBox.x + promptBox.width);
  const separator = page.getByRole("separator", {
    name: "Resize request and conversation",
  });
  const before = (await separator.boundingBox())!.y;
  await separator.focus();
  await separator.press("ArrowUp");
  await expect
    .poll(async () => (await separator.boundingBox())!.y)
    .toBeLessThan(before);
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await respond(page, "delta", {
    text: "Inspect the status code and response body.",
  });
  await respond(page, "done", {
    value: {
      model: "test-model",
      usage: { inputTokens: 20, outputTokens: 10, totalTokens: 30 },
      durationMs: 1540,
      finishReason: "stop",
    },
  });
  await expect(prompt).toHaveValue("Explain this API response");
  await page.getByRole("tab", { name: "Authorization", exact: true }).click();
  await expect(
    page.getByText("Inspect the status code and response body.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send", exact: true }),
  ).toBeEnabled();
  await page.getByRole("tab", { name: "Prompt", exact: true }).click();
  await page
    .getByRole("region", { name: "AI request", exact: true })
    .screenshot({ path: testInfo.outputPath("ai-layout-wide.png") });
  await page.setViewportSize({ width: 380, height: 800 });
  const narrowPrompt = (await prompt.boundingBox())!;
  const narrowSystem = (await system.boundingBox())!;
  expect(narrowSystem.y).toBeGreaterThan(narrowPrompt.y + narrowPrompt.height);
});

test("AI preserves each response's model and usage when switching providers", async ({
  page,
}) => {
  await page.goto("/?aiMcp=ai");
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("First prompt");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await respond(page, "delta", { text: "First model answer" });
  await respond(page, "done", {
    value: {
      usage: { totalTokens: 11 },
      durationMs: 1000,
      finishReason: "stop",
    },
  });
  await page.getByLabel("Provider", { exact: true }).selectOption("deepseek");
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("Second prompt");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await respond(page, "delta", { text: "Second model answer" });
  await respond(page, "done", {
    value: {
      usage: { totalTokens: 22 },
      durationMs: 2000,
      finishReason: "stop",
    },
  });
  const responses = page.getByRole("article", {
    name: "Response",
    exact: true,
  });
  await expect(responses.first()).toContainText("DeepSeek · deepseek-flash");
  await expect(responses.first()).toContainText("22 tokens");
  await expect(responses.last()).toContainText("OpenAI · test-model");
  await expect(responses.last()).toContainText("11 tokens");
  await page.getByRole("button", { name: "Native save", exact: true }).click();
  const saved = await page.evaluate(() => (window as any).aiMcpMessages.at(-1));
  expect(saved.data.ai.messages[1].result).toMatchObject({
    provider: "openai",
    model: "test-model",
    durationMs: 1000,
    state: "completed",
    usage: { totalTokens: 11 },
  });
  expect(saved.data.ai.messages[3].result).toMatchObject({
    provider: "deepseek",
    model: "deepseek-flash",
    durationMs: 2000,
    state: "completed",
    usage: { totalTokens: 22 },
  });
});

test("AI prompt and system instructions follow native save and revert", async ({
  page,
}) => {
  await page.goto("/?aiMcp=ai");
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("Saved prompt");
  await page
    .getByLabel("System prompt", { exact: true })
    .fill("Saved instructions");
  await page.getByRole("button", { name: "Checkpoint", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("Changed prompt");
  await page.getByRole("button", { name: "Native save", exact: true }).click();
  const saved = await page.evaluate(() => (window as any).aiMcpMessages.at(-1));
  expect(saved.data.ai.prompt).toBe("Changed prompt");
  expect(saved.data.ai.system).toBe("Saved instructions");
  await page
    .getByRole("button", { name: "Revert document", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Message", exact: true }),
  ).toHaveValue("Saved prompt");
  await expect(page.getByLabel("System prompt", { exact: true })).toHaveValue(
    "Saved instructions",
  );
});
