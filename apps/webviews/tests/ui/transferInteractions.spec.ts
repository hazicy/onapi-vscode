import { expect, type Page } from "@playwright/test";
import { test } from "./fixtures";

async function openPanel(
  page: Page,
  panel: "importDataPanel" | "exportDataPanel",
) {
  await page.route("**/transfer.html", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html><head><link rel="stylesheet" href="/webviews.css"></head><body><div id="root"></div><script>
    window.vscodeData={};window.messages=[];window.resourceBaseUrl=location.origin;
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

test("import reports parse errors and keeps the preview and selection when saving fails", async ({
  page,
}) => {
  await openPanel(page, "importDataPanel");
  await page.getByRole("radio", { name: "Postman", exact: true }).check();
  const file = page.locator('input[type="file"]');
  await file.setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from("{ broken json"),
  });
  await expect(page.getByRole("alert")).toContainText("Import failed");
  await file.setInputFiles({
    name: "collection.json",
    mimeType: "application/json",
    buffer: Buffer.from("{}"),
  });
  await expect.poll(() => latest(page, "getImportData")).toBeTruthy();
  const first = await latest(page, "getImportData");
  await emit(page, {
    action: "importError",
    requestId: first.requestId,
    data: "Invalid collection",
  });
  await expect(page.getByRole("alert")).toContainText("Invalid collection");
  await file.setInputFiles({
    name: "collection.json",
    mimeType: "application/json",
    buffer: Buffer.from("{}"),
  });
  await expect
    .poll(async () => (await latest(page, "getImportData"))?.requestId)
    .not.toBe(first.requestId);
  const preview = await latest(page, "getImportData");
  await emit(page, {
    action: "setImportData",
    requestId: preview.requestId,
    type: "select_apis",
    data: {
      apis: [
        {
          id: "imported",
          name: "Imported request",
          kind: "api",
          parentId: "0",
          method: "GET",
          url: "https://example.com",
        },
      ],
      models: [],
      envs: [],
    },
  });
  const dialog = page.getByRole("dialog", { name: "Preview" });
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
  await expect(dialog).toBeHidden();
});

test("an unavailable environment is not displayed as the first environment", async ({
  page,
  requestPage,
}) => {
  await requestPage.open("api", {
    method: "GET",
    url: "https://example.com",
    header: [],
  });
  await expect(requestPage.sendButton).toBeVisible();
  await emit(page, {
    action: "setProjectConfig",
    data: {
      http: {
        collection: {
          info: {
            name: "Test",
            schema:
              "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
          },
        },
        environments: [{ id: "dev", name: "Development", values: [] }],
        activeEnvironment: "deleted",
        options: { globals: { values: [] } },
      },
    },
  });
  const environment = page.getByLabel("Environment", { exact: true });
  await expect(environment).toContainText("Environment unavailable");
  await environment.click();
  await page
    .getByRole("menuitem", { name: "Development", exact: true })
    .click();
  await expect(environment).toContainText("Development");
  await expect
    .poll(
      async () =>
        (await latest(page, "setProjectConfig"))?.data.value.activeEnvironment,
    )
    .toBe("dev");
  await environment.click();
  await page
    .getByRole("menuitem", { name: "No environment", exact: true })
    .click();
  await expect(environment).toContainText("No environment");
  await expect
    .poll(
      async () =>
        (await latest(page, "setProjectConfig"))?.data.value.activeEnvironment,
    )
    .toBe("");
});
