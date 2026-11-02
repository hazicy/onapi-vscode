import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/?sharedComponents");
});

test("inherited headers show collection and folder configuration without automatic headers", async ({
  page,
}) => {
  const headers = page.getByRole("region", { name: "Inherited headers" });
  const toggle = headers.getByRole("button");
  await expect(headers.locator('input[value="X-Collection"]')).toBeHidden();
  await toggle.click();
  await expect(headers.locator('input[value="X-Collection"]')).toBeVisible();
  await expect(headers.locator('input[value="X-Folder"]')).toBeVisible();
  await expect(headers.locator('input[value="X-HTTP"]')).toHaveCount(0);
  await expect(headers.locator('input[value="X-Socket"]')).toHaveCount(0);
  for (const checkbox of await headers.getByRole("checkbox").all()) {
    await expect(checkbox).toBeDisabled();
  }
  await expect(page.getByLabel("Messages")).toHaveText("[]");
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

test("layout controls persist preferences and mounted panels follow external settings", async ({
  page,
}) => {
  const horizontal = page.getByRole("button", {
    name: "Two pane view",
    exact: true,
  });
  const vertical = page.getByRole("button", {
    name: "Single pane view",
    exact: true,
  });
  const request = page.getByText("Preferred request panel", { exact: true });
  const response = page.getByText("Preferred response panel", { exact: true });
  const placement = async () => {
    const left = await request.boundingBox();
    const right = await response.boundingBox();
    if (!left || !right) {
      return "pending";
    }
    return right.x > left.x + 100 ? "horizontal" : "vertical";
  };
  await horizontal.click();
  await expect(horizontal).toHaveAttribute("aria-pressed", "true");
  await expect.poll(placement).toBe("horizontal");
  await vertical.click();
  await expect(vertical).toHaveAttribute("aria-pressed", "true");
  await expect.poll(placement).toBe("vertical");
  await page.getByRole("button", { name: "Receive horizontal layout" }).click();
  await expect(horizontal).toHaveAttribute("aria-pressed", "true");
  await expect.poll(placement).toBe("horizontal");
  const messages = JSON.parse(await page.getByLabel("Messages").innerText());
  expect(messages).toEqual([
    { action: "setSystemConfig", data: { tab_direction: -1 } },
    { action: "setSystemConfig", data: { tab_direction: 1 } },
  ]);
});
