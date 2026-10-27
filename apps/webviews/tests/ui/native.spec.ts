import { emitHttpEvents } from "./protocol";
import { expect, test, type Page } from "@playwright/test";

async function openRequest(page: Page, kind: string, request: unknown) {
  const errors: string[] = [];
  page.on("pageerror", (error) => {
    errors.push(error.message);
    console.error(error.message);
  });
  const initialData = {
    apiData: {
      id: "native",
      parentId: "0",
      project_id: "-1",
      name: "Native request",
      kind,
      request,
      event: [],
      response: [],
    },
    projectConfig: {},
    systemConfig: {},
    vscodeTheme: "Default Dark Modern",
    docBaseUrl: "",
  };
  await page.route("**/native.html", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html><head><link rel="stylesheet" href="/webviews.css"></head><body><div id="root"></div><script>
      window.vscodeData=${JSON.stringify({ kind, initialData })};
      window.messages=[];window.vscode={postMessage(message){window.messages.push(message)}};
      window.resourceBaseUrl=location.origin;
      </script><script type="module" src="/tagPanel.js"></script></body></html>`,
    }),
  );
  await page.goto("http://127.0.0.1:4180/native.html");
  return errors;
}

test("GraphQL edits and sends the native request body", async ({ page }) => {
  const errors = await openRequest(page, "graphql", {
    method: "POST",
    url: "https://example.com/graphql",
    header: [],
    body: {
      mode: "graphql",
      graphql: { query: "{ before }", variables: '{"id":1}' },
    },
  });
  // The query editor and variable editor read the imported native body directly.
  const editors = page.getByRole("textbox", { name: "Code editor" });
  await expect(editors.first()).toContainText("before");
  await editors.first().fill("query Native { after }");
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
  const urlInput = page.getByRole("textbox", {
    name: "Enter URL",
    exact: true,
  });
  await expect(urlInput).toHaveValue("https://example.com/graphql");
  await urlInput.fill("https://example.com/changed");
  await page.getByRole("button", { name: "Send", exact: true }).click();
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
}) => {
  const errors = await openRequest(page, "sse", {
    method: "GET",
    url: "https://example.com/events",
    header: [],
  });
  await expect(page.locator("input").first()).toBeVisible();
  await emitHttpEvents(page, "native", [
    { type: "start" },
    { type: "responseData", data: "data: hello\n\n" },
    { type: "responseData", data: "data: world\n\n" },
  ]);
  await expect(
    page.getByRole("textbox", { name: "Code editor" }),
  ).toContainText("data: hello");
  await expect(
    page.getByRole("textbox", { name: "Code editor" }),
  ).toContainText("data: world");
  expect(errors).toEqual([]);
});

test("API Key controls write the native apikey attributes", async ({
  page,
}) => {
  const errors = await openRequest(page, "api", {
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
  await page.getByRole("tab", { name: "Auth", exact: true }).click();
  const panel = page.getByRole("tabpanel", { name: "Auth", exact: true });
  await expect(panel.getByRole("textbox").first()).toHaveValue("x-api-key");
  await panel.getByRole("textbox").first().fill("x-native-key");
  await page.getByRole("button", { name: "Send", exact: true }).click();
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

test("Cookie manager saves the native requester jar", async ({ page }) => {
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
  await expect(page.getByRole("table")).toBeVisible();
  const fields = page.getByRole("table").getByRole("textbox");
  await fields.nth(0).fill("session");
  await fields.nth(1).fill("native");
  await fields.nth(2).fill("example.com");
  await page.getByRole("button", { name: "Save", exact: true }).click();
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
}) => {
  const errors = await openRequest(page, "api", {
    method: "GET",
    url: "https://example.com/before",
    header: [],
  });
  const url = page.getByRole("textbox", {
    name: "Enter URL or paste cURL text",
  });
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
}) => {
  const errors = await openRequest(page, "api", {
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
  await page.getByRole("tab", { name: "Multi-Part", exact: true }).click();
  const body = page.getByRole("tabpanel", { name: "Multi-Part", exact: true });
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
