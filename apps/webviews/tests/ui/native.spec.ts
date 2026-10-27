import { emitHttpEvents } from "./protocol";
import { expect } from "@playwright/test";
import { test } from "./fixtures";

test("GraphQL edits and sends the native request body", async ({
  page,
  requestPage,
}) => {
  const errors = await requestPage.open("graphql", {
    method: "POST",
    url: "https://example.com/graphql",
    header: [],
    body: {
      mode: "graphql",
      graphql: { query: "{ before }", variables: '{"id":1}' },
    },
  });
  // The query editor and variable editor read the imported native body directly.
  const editors = requestPage.codeEditorTextbox;
  await expect(editors.first()).toContainText("before");
  await editors.first().fill("query Native { after }");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as any).messages.findLast(
            (message: any) => message.action === "updateApiActiveData",
          )?.data.request.body.graphql.query,
      ),
    )
    .toBe("query Native { after }");
  await editors.nth(1).fill('{"id":2}');
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as any).messages.some(
          (message: any) =>
            message.action === "updateApiActiveData" &&
            message.data?.request?.body?.graphql?.variables === '{"id":2}',
        ),
      ),
    )
    .toBe(true);
  const urlInput = requestPage.enterURLTextbox;
  await expect(urlInput).toHaveValue("https://example.com/graphql");
  await urlInput.fill("https://example.com/changed");
  await requestPage.sendButton.click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as any).messages.findLast(
            (message: any) => message.action === "sendApi",
          )?.data.request,
      ),
    )
    .toMatchObject({
      method: "POST",
      url: {
        raw: "https://example.com/changed",
        protocol: "https",
        host: ["example", "com"],
        path: ["changed"],
      },
      body: {
        mode: "graphql",
        graphql: { query: "query Native { after }", variables: '{"id":2}' },
      },
    });
  expect(errors).toEqual([]);
});

test("SSE displays native responseData while the request is running", async ({
  page,
  requestPage,
}) => {
  const errors = await requestPage.open("sse", {
    method: "GET",
    url: "https://example.com/events",
    header: [],
  });
  await expect(requestPage.input.first()).toBeVisible();
  await emitHttpEvents(page, "native", [
    { type: "start" },
    { type: "responseData", data: "data: hello\n\n" },
    { type: "responseData", data: "data: world\n\n" },
  ]);
  await expect(requestPage.codeEditorTextbox).toContainText("data: hello");
  await expect(requestPage.codeEditorTextbox).toContainText("data: world");
  expect(errors).toEqual([]);
});

test("API Key controls write the native apikey attributes", async ({
  page,
  requestPage,
}) => {
  const errors = await requestPage.open("api", {
    method: "GET",
    url: "https://example.com",
    header: [],
    auth: {
      type: "apikey",
      apikey: [
        { key: "key", value: "x-api-key" },
        { key: "value", value: "before" },
        { key: "in", value: "header" },
      ],
    },
  });
  await requestPage.authTab.click();
  const panel = requestPage.authTabpanel;
  await expect(panel.getByRole("textbox").first()).toHaveValue("x-api-key");
  await panel.getByRole("textbox").first().fill("x-native-key");
  await requestPage.sendButton.click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as any).messages.findLast(
            (message: any) => message.action === "sendApi",
          )?.data.request.auth,
      ),
    )
    .toMatchObject({
      type: "apikey",
      apikey: expect.arrayContaining([
        // The SDK accepts omitted variable types; editing must preserve sibling attributes.
        { key: "key", value: "x-native-key" },
        { key: "value", value: "before" },
        { key: "in", value: "header" },
      ]),
    });
  expect(errors).toEqual([]);
});

test("Cookie manager saves the native requester jar", async ({
  page,
  requestPage,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => {
    errors.push(error.message);
    console.error(error.message);
  });
  await page.route("**/cookies.html", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html><head><link rel="stylesheet" href="/webviews.css"></head><body><div id="root"></div><script>window.vscodeData={};window.messages=[];window.vscode={postMessage(message){window.messages.push(message)}};window.resourceBaseUrl=location.origin;</script><script type="module" src="/environmentPanel.js"></script></body></html>`,
    }),
  );
  await page.goto("http://127.0.0.1:4180/cookies.html");
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as any).messages.some(
          (message: any) => message.action === "getProjectConfig",
        ),
      ),
    )
    .toBe(true);
  await page.evaluate(() =>
    window.postMessage({ action: "setProjectConfig", data: {} }, "*"),
  );
  await expect(requestPage.table).toBeVisible();
  const fields = requestPage.table.getByRole("textbox");
  await fields.nth(0).fill("session");
  await fields.nth(1).fill("native");
  await fields.nth(2).fill("example.com");
  await requestPage.saveButton.click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as any).messages.findLast(
            (message: any) => message.action === "setProjectConfig",
          )?.data,
      ),
    )
    .toMatchObject({
      key: "http",
      value: {
        options: {
          requester: {
            cookieJar: {
              cookies: [
                {
                  key: "session",
                  value: "native",
                  domain: "example.com",
                  path: "/",
                  expires: "Infinity",
                },
              ],
            },
          },
        },
      },
    });
  expect(errors).toEqual([]);
});

test("pasting cURL replaces the SDK request without writing legacy parameter tables", async ({
  page,
  requestPage,
}) => {
  const errors = await requestPage.open("api", {
    method: "GET",
    url: "https://example.com/before",
    header: [],
  });
  const url = requestPage.enterURLOrPasteCURLTextTextbox;
  await url.evaluate((element, command) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData("text/plain", command);
    element.dispatchEvent(
      new ClipboardEvent("paste", {
        clipboardData,
        bubbles: true,
        cancelable: true,
      }),
    );
  }, "curl 'https://example.com/after?a=1&a=2' -H 'X-From-Curl: yes' --data 'hello'");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as any).messages
            .filter((message: any) => message.action === "updateApiActiveData")
            .at(-1)?.data,
      ),
    )
    .toMatchObject({
      id: "native",
      name: "Native request",
      request: {
        method: "POST",
        header: expect.arrayContaining([{ key: "X-From-Curl", value: "yes" }]),
      },
    });
  const request = await page.evaluate(
    () =>
      (window as any).messages
        .filter((message: any) => message.action === "updateApiActiveData")
        .at(-1).data.request,
  );
  const query =
    typeof request.url === "string"
      ? [...new URL(request.url).searchParams.entries()]
      : request.url.query.map((row: any) => [row.key, row.value]);
  expect(query).toEqual([
    ["a", "1"],
    ["a", "2"],
  ]);
  expect(request.query).toBeUndefined();
  expect(request.header.parameter).toBeUndefined();
  expect(errors).toEqual([]);
});

test("native form files retain SDK fields when editing paths and selection", async ({
  page,
  requestPage,
}) => {
  const errors = await requestPage.open("api", {
    method: "POST",
    url: "https://example.com/upload",
    header: [],
    body: {
      mode: "formdata",
      formdata: [
        {
          key: "asset",
          type: "file",
          src: "/tmp/before.png",
          contentType: "image/png",
          description: "attachment",
          disabled: true,
        },
      ],
    },
  });
  await requestPage.multiPartTab.click();
  const body = requestPage.multiPartTabpanel;
  await body.getByPlaceholder("File path").fill("/tmp/after.png");
  await body.getByRole("checkbox").first().check();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as any).messages
            .filter((message: any) => message.action === "updateApiActiveData")
            .at(-1)?.data.request.body.formdata[0],
      ),
    )
    .toMatchObject({
      key: "asset",
      type: "file",
      src: "/tmp/after.png",
      disabled: false,
      contentType: "image/png",
      description: "attachment",
    });
  expect(errors).toEqual([]);
});

test("HTTP test results have a dedicated tab with counts and failure details", async ({
  page,
  requestPage,
}) => {
  await requestPage.open("api", {
    method: "GET",
    url: "https://example.com",
    header: [],
  });
  await expect(page.getByRole("tab", { name: /Test results/i })).toHaveCount(0);
  await emitHttpEvents(page, "native", [
    { type: "start" },
    {
      type: "request",
      response: { code: 200, body: "{}" },
      request: { method: "GET" },
    },
    {
      type: "assertion",
      assertions: [
        { assertion: "Status is 200" },
        { assertion: "Required field", error: { message: "Missing name" } },
        { assertion: "Optional check", skipped: true },
      ],
    },
    { type: "done", error: null },
  ]);
  const results = page.getByRole("tab", { name: /Test results.*1\/3/i });
  await expect(results).toBeVisible();
  await results.click();
  await expect(page.getByText("Status is 200", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Required field: Missing name", { exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-skipped="true"]')).toContainText(
    "Optional check",
  );
  await emitHttpEvents(page, "native", [
    { type: "start" },
    { type: "request", response: { code: 200, body: "{}" } },
    { type: "done", error: null },
  ]);
  await page.getByRole("tab", { name: /Test results/i }).click();
  await expect(
    page.getByText("No tests yet. Add tests in the post-response script."),
  ).toBeVisible();
});

test("response navigation collapses tabs instead of wrapping metadata", async ({
  page,
  requestPage,
}) => {
  await page.setViewportSize({ width: 480, height: 1000 });
  await requestPage.open("api", {
    method: "GET",
    url: "https://example.com",
    header: [],
  });
  await expect(requestPage.sendButton).toBeVisible();
  await requestPage.sendButton.click();
  await emitHttpEvents(page, "native", [
    { type: "start" },
    {
      type: "request",
      response: { code: 200, body: "{}", responseTime: 123, responseSize: 456 },
    },
    { type: "done", error: null },
  ]);
  const response = page.getByRole("tab", { name: "Response", exact: true });
  const nav = response.locator(
    'xpath=ancestor::*[contains(@class, "_tabsNav_")]',
  );
  const more = nav.getByRole("button", { name: "More tabs", exact: true });
  await expect(more).toBeVisible();
  const status = nav.getByText("200", { exact: true });
  await expect(status).toBeVisible();
  await expect(nav).toHaveCSS("flex-wrap", "nowrap");
  const tabBox = await response.boundingBox();
  const statusBox = await status.boundingBox();
  expect(
    Math.abs(
      tabBox!.y + tabBox!.height / 2 - statusBox!.y - statusBox!.height / 2,
    ),
  ).toBeLessThan(4);
  await more.click();
  await page.getByRole("menuitem", { name: /Test results/i }).click();
  await expect(
    page.getByRole("tab", { name: /Test results/i }),
  ).toHaveAttribute("aria-selected", "true");
  expect(
    await nav.evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
});

test("resend cancellation preserves results without saving examples or switching tabs", async ({
  page,
  requestPage,
}) => {
  const errors = await requestPage.open(
    "api",
    { method: "GET", url: "https://example.com", header: [] },
    {
      send_after_save_example: 2,
      send_after_response_to_tab: 1,
    },
  );
  const exampleCount = () =>
    page.evaluate(() => {
      const changes = (window as any).messages.filter(
        (message: any) => message.action === "updateApiActiveData",
      );
      return changes.at(-1)?.data.response?.length || 0;
    });
  await requestPage.sendButton.click();
  await emitHttpEvents(page, "native", [
    { type: "start" },
    { type: "request", response: { code: 200, body: '{"previous":true}' } },
    { type: "done", error: null },
  ]);
  await expect.poll(exampleCount).toBe(1);
  const headers = page
    .getByRole("tab", { name: "Headers", exact: true })
    .last();
  await headers.click();
  await requestPage.sendButton.click();
  const cancelled = await emitHttpEvents(page, "native", [{ type: "start" }]);
  await page
    .getByRole("button", { name: "Cancel sending", exact: true })
    .click();
  await expect(headers).toHaveAttribute("aria-selected", "true");
  expect(await exampleCount()).toBe(1);
  await page.evaluate(({ sessionId, sequence }) => {
    const emit = (native: unknown) =>
      window.dispatchEvent(
        new MessageEvent("message", {
          data: {
            action: "protocolExecutionEvent",
            data: {
              protocolVersion: 1,
              targetId: "native",
              sessionId,
              sequence: ++sequence,
              timestamp: Date.now(),
              event: { protocol: "http", type: "runtime.event", native },
            },
          },
        }),
      );
    emit({ type: "request", response: { code: 500, body: "late response" } });
    emit({ type: "done", error: null });
  }, cancelled);
  await expect(requestPage.sendButton).toBeVisible();
  await expect(headers).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "Response", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Code editor" }).last(),
  ).toContainText('"previous"');
  expect(await exampleCount()).toBe(1);
  await requestPage.sendButton.click();
  const completed = await emitHttpEvents(page, "native", [
    { type: "start" },
    { type: "request", response: { code: 201, body: '{"replacement":true}' } },
    { type: "done", error: null },
  ]);
  await expect.poll(exampleCount).toBe(2);
  await expect(
    page.getByRole("textbox", { name: "Code editor" }).last(),
  ).toContainText('"replacement"');
  await page.evaluate(
    ({ sessionId, sequence }) =>
      window.dispatchEvent(
        new MessageEvent("message", {
          data: {
            action: "protocolExecutionEvent",
            data: {
              protocolVersion: 1,
              targetId: "native",
              sessionId,
              sequence: sequence + 1,
              timestamp: Date.now(),
              event: {
                protocol: "http",
                type: "runtime.event",
                native: { type: "done", error: null },
              },
            },
          },
        }),
      ),
    completed,
  );
  expect(await exampleCount()).toBe(2);
  expect(errors).toEqual([]);
});
