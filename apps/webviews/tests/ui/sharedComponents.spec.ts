import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/?sharedComponents");
});

test("inherited headers follow protocol changes and persist to their own settings", async ({
  page,
}) => {
  const headers = page.getByRole("region", { name: "Inherited headers" });
  await headers.getByRole("button").click();
  await expect(headers.locator('input[value="X-HTTP"]')).toBeVisible();
  await page.getByRole("button", { name: "Switch protocol" }).click();
  await expect(headers.locator('input[value="X-Socket"]')).toBeVisible();
  await expect(headers.locator('input[value="X-HTTP"]')).toHaveCount(0);
  await headers.getByRole("checkbox").uncheck();
  await expect(page.getByLabel("Messages")).toHaveText(
    JSON.stringify([
      {
        action: "setSystemConfig",
        data: {
          systemRequestHeaderWebSocket: [
            {
              key: "X-Socket",
              value: "socket",
              is_checked: -1,
              field_type: "String",
            },
          ],
        },
      },
    ]),
  );
  await page.getByRole("button", { name: "Switch protocol" }).click();
  await expect(headers.getByRole("checkbox")).toBeChecked();
  await headers.getByRole("checkbox").uncheck();
  const messages = JSON.parse(await page.getByLabel("Messages").innerText());
  expect(messages[1].data).toEqual({
    systemRequestHeader: [
      { key: "X-HTTP", value: "http", is_checked: -1, field_type: "String" },
    ],
  });
});

test("parameter rows accept injected controls and preserve insertion targets and modes", async ({
  page,
}) => {
  const data = page.getByLabel("Edited row");
  await page.getByLabel("Injected input").fill("typed");
  await page.getByRole("button", { name: "Append value", exact: true }).click();
  await expect(data).toContainText('"value":"typed+"');
  await page
    .getByRole("button", { name: "Replace value", exact: true })
    .click();
  await expect(data).toContainText('"value":"replacement"');
  await page.getByRole("button", { name: "Append description" }).click();
  await expect(data).toContainText('"description":"description+"');
  await page.getByRole("button", { name: "Replace description" }).click();
  await expect(data).toContainText('"description":"replacement"');
  await expect(page.getByLabel("Injected input")).toHaveValue("replacement");
});

test("application preferences update a mounted shared editor without replacing its content", async ({
  page,
}) => {
  const content = page.getByRole("textbox", { name: "Code editor" });
  await expect(content).toHaveText("unchanged");
  await page.getByRole("button", { name: "Change editor preferences" }).click();
  await expect(content).toHaveCSS("font-size", "19px");
  await expect(content).toHaveText("unchanged");
});

test("static dialogs inherit the application's shared editor preferences", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Change editor preferences" }).click();
  await page.getByRole("button", { name: "Open editor dialog" }).click();
  const content = page
    .getByRole("dialog")
    .getByRole("textbox", { name: "Code editor" });
  await expect(content).toHaveText("dialog content");
  await expect(content).toHaveCSS("font-size", "19px");
});
