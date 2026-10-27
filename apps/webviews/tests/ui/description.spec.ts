import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("selects a description and closes the popup", async ({ page }) => {
  await page
    .getByRole("button", { name: "Common Parameters", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Invalid entry", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Built-in name", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Custom name", exact: true }).click();
  await expect(
    page.getByRole("status", { name: "Selected description" }),
  ).toHaveText("Custom name");
  await expect(
    page.getByRole("button", { name: "Custom name", exact: true }),
  ).toHaveCount(0);
});

test("filters by a trimmed exact key and handles no matches", async ({
  page,
}) => {
  await page.getByLabel("Filter key").fill(" name ");
  await page
    .getByRole("button", { name: "Common Parameters", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Custom name", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Custom age", exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.getByLabel("Filter key").fill("missing");
  await page
    .getByRole("button", { name: "Common Parameters", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Custom name", exact: true }),
  ).toHaveCount(0);
});

test("updates built-in descriptions when the project setting changes", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Toggle built-in descriptions" })
    .click();
  await page
    .getByRole("button", { name: "Common Parameters", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Built-in name", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Toggle built-in descriptions" })
    .click();
  await page
    .getByRole("button", { name: "Common Parameters", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Built-in name", exact: true }),
  ).toHaveCount(0);
});

test("supports keyboard selection and restores focus on Escape", async ({
  page,
}) => {
  const trigger = page.getByRole("button", {
    name: "Common Parameters",
    exact: true,
  });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Custom name", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("status", { name: "Selected description" }),
  ).toHaveText("Custom name");
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("loads module styles, displays a tooltip, and dismisses on outside click", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Common Parameters", exact: true })
    .click();
  const item = page.getByRole("button", { name: "Custom name", exact: true });
  await expect(item).toHaveCSS("width", "224px");
  await expect(item).toHaveCSS("text-overflow", "ellipsis");
  await item.hover();
  await expect(page.getByText("Custom name", { exact: true })).toHaveCount(2);
  await expect(
    page.getByText("Custom name", { exact: true }).last(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Outside", exact: true }).click();
  await expect(item).toHaveCount(0);
});
