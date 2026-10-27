import { expect } from "@playwright/test";
import { test } from "./fixtures";
import { generateScopedName } from "../../../../tooling/build/css-modules.mjs";

const requestInitialData = {
  projectConfig: {},
  systemConfig: { raw_parameter_pilot_bubble_switch: false },
  vscodeTheme: "Default Dark Modern",
  docBaseUrl: "http://localhost:3000",
  apiData: {
    id: "test-api",
    kind: "api",
    project_id: "-1",
    parentId: "0",
    name: "Test Request",
    request: {
      method: "GET",
      url: {
        raw: "https://example.com?search=hello",
        query: [{ key: "search", value: "hello" }],
      },
      header: [],
      auth: { type: "noauth" },
    },
    event: [],
    response: [],
  },
};

const componentClasses: Record<string, [string, string]> = {
  spinContent: ["shared/ui/base/Spin.module.css", "content"],
  skeleton: ["shared/ui/base/Skeleton.module.css", "skeleton"],
  requestUrlGroup: [
    "features/requests/protocols/http/Header.module.css",
    "urlGroupWrap",
  ],
  select: ["shared/ui/base/Select.module.css", "select"],
  tabsCountBadge: [
    "shared/components/LineTabs/LineTabs.module.css",
    "tabsCountBadge",
  ],
  responseResultTabs: [
    "features/requests/response/ResponseResult/ResponseResult.module.css",
    "responseResultTabsWrap",
  ],
  responseTools: [
    "features/requests/response/ResponseResult/ResponseResult.module.css",
    "tabBarExtraContentWrap",
  ],
};
const componentSelector = (name: string) => {
  const [file, className] = componentClasses[name];
  return `.${generateScopedName(className, `/src/${file}`)}`;
};

for (const panel of [
  "tagPanel",
  "environmentPanel",
  "pushPanel",
  "importDataPanel",
  "folderTestPanel",
  "folderTestReportPanel",
  "shareListPanel",
  "exportDataPanel",
]) {
  test(`production ${panel} initializes without module errors`, async ({
    page,
    webviewsPage,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/smoke.html", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<!doctype html><html lang="en"><head>
        <link rel="stylesheet" href="/webviews.css"></head><body><div id="root"></div>
        <script>window.vscode = { postMessage() {} }; window.vscodeData = ${JSON.stringify(panel === "tagPanel" ? { kind: "api", initialData: requestInitialData } : null)};
        window.resourceBaseUrl = location.origin;</script>
        <script type="module" src="/${panel}.js"></script></body></html>`,
      }),
    );
    await page.goto("http://127.0.0.1:4180/smoke.html");
    await expect(webviewsPage.rootChildren).not.toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

for (const panel of [
  "tagPanel",
  "environmentPanel",
  "pushPanel",
  "importDataPanel",
  "folderTestPanel",
  "folderTestReportPanel",
  "shareListPanel",
  "exportDataPanel",
]) {
  test(`production ${panel} renders loaded application content`, async ({
    page,
    webviewsPage,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => {
      errors.push(error.message);
      console.error(panel, error.message);
    });
    await page.route("**/loaded.html", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<!doctype html><html lang="en" style="--vscode-foreground:#ccc;--vscode-icon-foreground:#aaa;--vscode-button-background:#78c4c0;--vscode-editor-background:#222;--vscode-sideBar-background:#222;--vscode-settings-headerBorder:#383838;--vscode-settings-focusedRowBackground:#282828;--vscode-toolbar-hoverBackground:#333;--vscode-gitDecoration-ignoredResourceForeground:#777;--vscode-input-placeholderForeground:#777;--vscode-input-background:#2e2e2e;--vscode-editorWidget-border:#333"><head><meta charset="utf-8"><link rel="stylesheet" href="/webviews.css"></head><body><div id="root"></div><script>window.vscode={postMessage(message){if(message.action==="sendApi")window.testExecutionId=message.executionId}};window.vscodeData=${JSON.stringify(panel === "tagPanel" ? { kind: "api", initialData: requestInitialData } : null)};window.resourceBaseUrl=location.origin;</script><script type="module" src="/${panel}.js"></script></body></html>`,
      }),
    );
    await page.goto("http://127.0.0.1:4180/loaded.html");
    await expect(webviewsPage.rootChildren).not.toHaveCount(0);
    await page.evaluate((panel) => {
      const send = (action: string, data: unknown) =>
        window.postMessage({ action, data }, "*");
      send("setUserConfig", {
        currentProject: {
          project_id: "-1",
          team_id: "",
          name: "Local Project",
          authority: 3,
          role: 1,
          is_describe_library: 1,
        },
        currentTeam: { team_id: "-1", name: "Local Team" },
        userInfo: {},
      });
      send("setProjectConfig", {});
      send("setSystemConfig", { raw_parameter_pilot_bubble_switch: false });
      if (["shareListPanel", "importDataPanel"].includes(panel)) {
        send("setApiList", []);
      }
      if (panel === "pushPanel") {
        send("setPushPanelData", {
          local_api_list: [],
          project_apis_version: {},
        });
      }
      if (panel === "folderTestPanel") {
        send("setTestData", {
          testingName: "Test Folder",
          eventList: [],
          reportList: [],
          isInit: true,
        });
      }
      if (panel === "folderTestReportPanel") {
        send("setReportDetails", {
          folderName: "Report",
          requestList: [],
          complete: {},
          testingConfig: { name: "Report", runTimes: 1 },
          eventAllCount: 0,
        });
      }
    }, panel);
    if (panel === "folderTestReportPanel") {
      await expect(
        page.locator(`#root ${componentSelector("spinContent")}`).first(),
      ).toHaveAttribute("aria-busy", "false");
    } else {
      await expect(
        page.locator(`#root ${componentSelector("skeleton")}`),
      ).toHaveCount(0);
    }
    await expect(webviewsPage.root).not.toHaveText("");
    if (panel === "tagPanel") {
      await expect
        .poll(() =>
          page.evaluate(
            () => performance.getEntriesByName("onapi:content-ready").length,
          ),
        )
        .toBe(1);
    }
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    if (panel === "tagPanel") {
      for (const width of [760, 1024]) {
        await page.setViewportSize({ width, height: 900 });
        const embeddedSelects = page
          .locator(componentSelector("requestUrlGroup"))
          .locator(componentSelector("select"));
        for (const select of await embeddedSelects.all()) {
          await expect(select).toHaveCSS("border-top-width", "0px");
          await expect(select).toHaveCSS(
            "background-color",
            "rgba(0, 0, 0, 0)",
          );
        }
        await webviewsPage.tabs
          .filter({ hasText: /^Params(?:\s*\d+)?$/ })
          .click();
        const paramsTab = webviewsPage.tabs.filter({
          hasText: /^Params(?:\s*\d+)?$/,
        });
        const count = paramsTab.locator(componentSelector("tabsCountBadge"));
        await expect(count).toHaveText("1");
        const tabBox = await paramsTab.boundingBox();
        const countBox = await count.boundingBox();
        expect(
          Math.abs(
            tabBox!.y +
              tabBox!.height / 2 -
              (countBox!.y + countBox!.height / 2),
          ),
        ).toBeLessThanOrEqual(2);
        const table = webviewsPage.paramsPanel;
        const selectAll = table.getByRole("checkbox").first();
        await expect(selectAll).toHaveCSS("width", "16px");
        const key = table.getByRole("textbox").nth(0);
        const value = table.getByRole("textbox").nth(1);
        await expect(key).toHaveValue("search");
        await expect(value).toHaveValue("hello");
        await expect(key).toBeVisible();
        await expect(value).toBeVisible();
        for (const editor of [key, value]) {
          const box = await editor.boundingBox();
          expect(box!.width).toBeGreaterThan(100);
          expect(box!.height).toBeGreaterThan(10);
        }
        const urlInput = webviewsPage.requestUrl;
        for (const editor of [urlInput, key, value]) {
          await webviewsPage.tabs
            .filter({ hasText: /^Params(?:\s*\d+)?$/ })
            .click();
          const measure = () =>
            editor.evaluate((element) => {
              const box = element.getBoundingClientRect();
              const style = getComputedStyle(element);
              return {
                x: box.x,
                y: box.y,
                width: box.width,
                height: box.height,
                textX:
                  box.x +
                  parseFloat(style.paddingLeft) +
                  parseFloat(style.borderLeftWidth),
                textY:
                  box.y +
                  parseFloat(style.paddingTop) +
                  parseFloat(style.borderTopWidth),
              };
            });
          const before = await measure();
          await editor.click();
          await expect(editor).toBeFocused();
          expect(await measure()).toEqual(before);
        }
      }
      const urlGroup = page.locator(componentSelector("requestUrlGroup"));
      const method = urlGroup.locator(componentSelector("select")).first();
      await method.locator("button").click();
      await page.waitForTimeout(300);
      await expect(webviewsPage.postOption).toBeVisible();
      await webviewsPage.postOption.click();
      await expect(method.getByRole("combobox")).toContainText("POST");
      await expect(webviewsPage.postOption).toBeHidden();
      await page.screenshot({ path: test.info().outputPath("request.png") });
      await page.getByRole("button", { name: "Send", exact: true }).click();
      await page.evaluate(() => {
        window.postMessage(
          {
            action: "setSystemConfig",
            data: {
              tab_direction: 1,
              assertions_and_validation_results: -1,
              send_after_auto_beautify: 1,
              raw_parameter_pilot_bubble_switch: false,
            },
          },
          "*",
        );
        const response = {
          code: 200,
          status: "OK",
          responseTime: 572,
          header: [
            { key: "content-type", value: "text/html" },
            { key: "server", value: "test" },
          ],
          stream: {
            type: "Buffer",
            data: Array.from(
              new TextEncoder().encode(
                "<!DOCTYPE html><html><body><h1>Sample response</h1></body></html>",
              ),
            ),
          },
        };
        let sequence = 0;
        const emit = (event: Record<string, unknown>) =>
          window.postMessage(
            {
              action: "protocolExecutionEvent",
              data: {
                protocolVersion: 1,
                sessionId: (window as any).testExecutionId,
                targetId: "test-api",
                sequence: ++sequence,
                timestamp: Date.now(),
                event: { protocol: "http", ...event },
              },
            },
            "*",
          );
        emit({ type: "session.started", failed: false });
        for (const data of [
          { type: "start" },
          {
            type: "request",
            response,
            request: { method: "GET", url: "https://example.com", header: [] },
            cookies: [],
          },
          { type: "done", error: null },
        ]) {
          emit({ type: "runtime.event", native: data });
        }
      });
      for (const width of [760, 1200]) {
        await page.setViewportSize({ width, height: 900 });
        const toolbar = page.locator(componentSelector("responseResultTabs"));
        const wrapButton = toolbar.getByRole("button", {
          name: "Toggle word wrap",
        });
        await expect(wrapButton).toBeVisible();
        await expect(wrapButton).toHaveCSS("height", "28px");
        const tools = toolbar
          .locator(componentSelector("responseTools"))
          .last();
        const controls = tools.locator(componentSelector("select"));
        for (const control of await controls.all()) {
          const box = await control.boundingBox();
          const buttonBox = await wrapButton.boundingBox();
          expect(
            Math.abs(
              box!.y + box!.height / 2 - buttonBox!.y - buttonBox!.height / 2,
            ),
          ).toBeLessThanOrEqual(2);
        }
        await wrapButton.click();
        await expect(wrapButton).toHaveAttribute("aria-pressed", "false");
        await wrapButton.click();
        await expect(wrapButton).toHaveAttribute("aria-pressed", "true");
        await expect(webviewsPage.codeEditorTextbox.first()).toBeVisible();
        await page.screenshot({
          path: test.info().outputPath(`response-${width}.png`),
        });
      }
    }
    expect(errors).toEqual([]);
  });
}

test("production WebSocket request finishes loading without render errors", async ({
  page,
  webSocketPage,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const initialData = {
    ...requestInitialData,
    apiData: {
      id: "test-ws",
      kind: "websocket",
      project_id: "-1",
      parentId: "0",
      name: "Test WebSocket",
      url: "ws://localhost:12345",
      request: {
        header: { parameter: [] },
        query: { parameter: [] },
        cookie: { parameter: [] },
      },
      message: [
        {
          param_id: "message-1",
          name: "Message",
          request: { mode: "text", raw: "" },
        },
      ],
      config: {},
    },
  };
  await page.route("**/ws.html", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html><head><link rel="stylesheet" href="/webviews.css"></head><body><div id="root"></div>
      <script>window.postedMessages=[];window.vscode={postMessage(message){window.postedMessages.push(message)}};window.vscodeData=${JSON.stringify({ kind: "websocket", initialData })};window.resourceBaseUrl=location.origin;</script>
      <script type="module" src="/tagPanel.js"></script></body></html>`,
    }),
  );
  await page.goto("http://127.0.0.1:4180/ws.html");
  await expect(webSocketPage.websocket).toBeAttached();
  await expect(webSocketPage.editors.first()).toBeVisible();
  await expect(page.locator(componentSelector("skeleton"))).toHaveCount(0);
  await expect(webSocketPage.alert).toHaveCount(0);
  await expect(webSocketPage.status).toHaveText("Disconnected");
  await expect(webSocketPage.connectToSendAMessage).toBeVisible();
  await expect(webSocketPage.sendButton).toBeDisabled();
  await expect(webSocketPage.clearMessagesButton).toBeDisabled();
  await page.setViewportSize({ width: 650, height: 760 });
  const editor = webSocketPage.editors.first();
  expect((await editor.boundingBox())!.height).toBeGreaterThan(120);
  await webSocketPage.messageEditor.content.fill("hello");
  await webSocketPage.connectButton.click();
  await expect(webSocketPage.status).toHaveText("Connecting");
  await webSocketPage.cancelButton.click();
  await expect(webSocketPage.status).toHaveText("Disconnected");
  await webSocketPage.connectButton.click();
  let sequence = 0;
  const emit = (event: Record<string, unknown>) =>
    page.evaluate(
      (data) => {
        window.postMessage({ action: "protocolExecutionEvent", data }, "*");
      },
      {
        protocolVersion: 1,
        targetId: "test-ws",
        sessionId: "ui-session",
        sequence: ++sequence,
        timestamp: Date.now(),
        event: { protocol: "websocket", ...event },
      },
    );
  await emit({ type: "session.started", failed: false });
  await emit({
    type: "connection.opened",
    result: {
      type: "connection",
      isSuccess: true,
      message: "Connected to echo server",
      data: {},
      dataType: "text",
      time: "12:00:00",
      size: "0 B",
    },
  });
  await expect(webSocketPage.status).toHaveText("Connected");
  await expect(webSocketPage.sendButton).toBeEnabled();
  await webSocketPage.sendButton.click();
  expect(
    await page.evaluate(() =>
      (window as any).postedMessages.some(
        (message: any) =>
          message.action === "ws_send" && message.data.msg === "hello",
      ),
    ),
  ).toBe(true);
  await emit({
    type: "message.received",
    result: {
      type: "message",
      isSuccess: true,
      message: "",
      data: { type: "Buffer", data: [104, 101, 108, 108, 111] },
      dataType: "text",
      time: "12:00:01",
      size: "5 B",
    },
  });
  await webSocketPage.websocket.getByText("hello", { exact: true }).click();
  await expect(webSocketPage.editors.nth(1)).toContainText("hello");
  await webSocketPage.searchTextbox.fill("does-not-exist");
  await expect(webSocketPage.filterHint).toBeVisible();
  await webSocketPage.resetFiltersButton.click();
  await expect(webSocketPage.searchTextbox).toHaveValue("");
  await webSocketPage.clearMessagesButton.click();
  await expect(
    webSocketPage.connectedSendAMessageOrWaitForTheServerToRespond,
  ).toBeVisible();
  await expect(
    webSocketPage.selectAMessageOnTheLeftToInspectItsContent,
  ).toBeVisible();
  await webSocketPage.disconnectButton.click();
  await expect(webSocketPage.status).toHaveText("Disconnected");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
