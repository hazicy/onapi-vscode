import { expect, type Page } from "@playwright/test";
import { test } from "./fixtures";

async function openPanel(
  page: Page,
  panel: "importDataPanel" | "exportDataPanel",
) {
  await page.route("**/transfer.html", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html><head><link rel="stylesheet" href="/webviews.css"><style>
    :root { --vscode-font-family: -apple-system, BlinkMacSystemFont, sans-serif; --vscode-font-size: 13px;
    --vscode-editor-background: #1f1f1f; --vscode-foreground: #ccc; --vscode-descriptionForeground: #9d9d9d;
    --vscode-editorWidget-background: #252526; --vscode-widget-border: #454545; --vscode-focusBorder: #007fd4;
    --vscode-inputOption-activeBackground: #04395e; --vscode-inputOption-activeBorder: #007acc; --vscode-inputOption-activeForeground: #fff;
    --vscode-dropdown-background: #313131; --vscode-dropdown-foreground: #ccc; --vscode-dropdown-border: #3c3c3c;
    --vscode-button-secondaryBackground: #313131; --vscode-button-secondaryForeground: #ccc;
    --vscode-button-background: #0078d4; --vscode-button-foreground: #fff; --vscode-button-hoverBackground: #026ec1;
    --vscode-list-hoverBackground: #2a2d2e; --vscode-toolbar-hoverBackground: #333; }
    </style></head><body><div id="root"></div><script>
    window.vscodeData={importPreview:{fileType:"postman",name:"collection.json",data:{apis:[{id:"imported",name:"Imported request",kind:"api",parentId:"0",method:"GET",url:"https://example.com"}],models:[],envs:[]}}};window.messages=[];window.resourceBaseUrl=location.origin;
    window.vscode={postMessage(message){window.messages.push(message);const replies={getSystemConfig:{action:"setSystemConfig",data:{import_data_init_type:"postman"}},getUserConfig:{action:"setUserConfig",data:{}},getApiList:{action:"setApiList",data:[]},getVscodeTheme:{action:"setVscodeTheme",data:"Default Dark Modern"}};if(replies[message.action])window.postMessage(replies[message.action],"*")}};
    </script><script type="module" src="/${panel}.js"></script></body></html>`,
    }),
  );
  await page.goto("http://127.0.0.1:4180/transfer.html");
}

const latest = (page: Page, action: string) =>
  page.evaluate(
    (action) =>
      (window as any).messages.findLast(
        (message: any) => message.action === action,
      ),
    action,
  );
const emit = (page: Page, response: unknown) =>
  page.evaluate((response) => window.postMessage(response, "*"), response);

test("export follows host progress and retains options after cancellation and failure", async ({
  page,
}) => {
  await openPanel(page, "exportDataPanel");
  const button = page.getByRole("button", { name: "Export Now", exact: true });
  await page.getByRole("radio", { name: "Postman 2.1", exact: true }).check();
  await button.click();
  const first = await latest(page, "exportProjectData");
  expect(first.data.type).toBe("postman");
  await expect(button).toBeDisabled();
  await expect(
    page.getByRole("status").filter({ hasText: "Preparing export" }),
  ).toBeVisible();
  await emit(page, {
    action: "exportStatus",
    requestId: first.requestId,
    data: { stage: "choosingLocation" },
  });
  await expect(
    page.getByRole("status").filter({ hasText: "Choose a location" }),
  ).toBeVisible();
  await expect(button).toBeDisabled();
  await emit(page, {
    action: "exportStatus",
    requestId: first.requestId,
    data: { stage: "cancelled" },
  });
  await expect(button).toBeEnabled();
  await expect(
    page.getByRole("radio", { name: "Postman 2.1", exact: true }),
  ).toBeChecked();
  await expect(
    page.getByText("Save cancelled. Your export options have been kept."),
  ).toBeVisible();
  await button.click();
  const second = await latest(page, "exportProjectData");
  expect(second.requestId).not.toBe(first.requestId);
  await emit(page, {
    action: "exportStatus",
    requestId: first.requestId,
    data: { stage: "error", error: "Old failure" },
  });
  await expect(button).toBeDisabled();
  await emit(page, {
    action: "exportStatus",
    requestId: second.requestId,
    data: { stage: "error", error: "Disk full" },
  });
  await expect(page.getByRole("alert")).toContainText("Disk full");
  await expect(button).toBeEnabled();
  await button.click();
  const third = await latest(page, "exportProjectData");
  expect(third.data.type).toBe("postman");
  await emit(page, {
    action: "exportStatus",
    requestId: third.requestId,
    data: { stage: "saving" },
  });
  await expect(
    page.getByRole("status").filter({ hasText: "Saving file" }),
  ).toBeVisible();
  await emit(page, {
    action: "exportStatus",
    requestId: third.requestId,
    data: { stage: "complete" },
  });
  await expect(page.getByText("Export complete")).toBeVisible();
});

test("import keeps the preview and selection when saving fails", async ({
  page,
}) => {
  await openPanel(page, "importDataPanel");
  const dialog = page.locator("main");
  await expect(dialog).toBeVisible();
  const submit = dialog.getByRole("button", { name: "Import", exact: true });
  await submit.click();
  const save = await latest(page, "importData");
  expect(save.data.newApis.map((api: any) => api.id)).toEqual(["imported"]);
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Importing…", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await emit(page, {
    action: "importError",
    requestId: save.requestId,
    data: "Failed to save imported requests",
  });
  await expect(dialog.getByRole("alert")).toContainText(
    "Failed to save imported requests",
  );
  await expect(submit).toBeEnabled();
  await expect(
    dialog.getByText("Imported request", { exact: true }),
  ).toBeVisible();
  await submit.click();
  const retry = await latest(page, "importData");
  expect(retry.data).toEqual(save.data);
  expect(retry.requestId).not.toBe(save.requestId);
  await emit(page, {
    action: "importError",
    requestId: save.requestId,
    data: "Old error",
  });
  await expect(
    dialog.getByRole("button", { name: "Importing…", exact: true }),
  ).toBeDisabled();
  await emit(page, { action: "importComplete", requestId: retry.requestId });
  await expect.poll(() => latest(page, "closeImportPreview")).toBeTruthy();
});

test("import preview is the only webview import UI", async ({ page }) => {
  await openPanel(page, "importDataPanel");
  await expect(page.getByText("Source: collection.json")).toBeVisible();
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Import method" })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(await latest(page, "closeImportPreview")).toBeTruthy();
});
