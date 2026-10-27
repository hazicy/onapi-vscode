import { expect, test } from "@playwright/test";

test("GraphQL conditions reset dependent values and preserve rows after removal", async ({
  page,
}) => {
  await page.goto("/?filters");
  const combos = page.getByRole("combobox");
  await combos.nth(0).click();
  await page.getByRole("option", { name: "age", exact: true }).click();
  await combos.nth(1).click();
  await page.getByRole("option", { name: "eq", exact: true }).click();
  await page.getByRole("textbox").fill("18");
  await page.getByRole("button", { name: "Add Condition" }).click();
  await combos.nth(2).click();
  await page.getByRole("option", { name: "name", exact: true }).click();
  await combos.nth(3).click();
  await page.getByRole("option", { name: "eq", exact: true }).click();
  await page.getByRole("textbox").nth(1).fill("alice");
  // Remove the first condition; the second retains its own identity and value.
  await page
    .locator("form > div")
    .first()
    .getByRole("button", { name: "Remove condition" })
    .click();
  await expect(page.getByRole("textbox")).toHaveValue("alice");
  // Changing the field clears the operation and value from the previous field.
  await combos.nth(0).click();
  await page.getByRole("option", { name: "age", exact: true }).click();
  await expect(page.getByRole("textbox")).toHaveValue("");
  await combos.nth(1).click();
  await page.getByRole("option", { name: "in", exact: true }).click();
  await combos.nth(2).fill("21");
  await page.getByRole("option", { name: "21", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByLabel("Filter data")).toHaveText(
    '{"query":[{"name":"where","value":{"age":{"in":["21"]}}}]}',
  );
  await page.getByRole("button", { name: "Reopen filters" }).click();
  await expect(
    page.getByRole("button", { name: "Remove 21", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear Conditions" }).click();
  await expect(page.getByRole("combobox")).toHaveCount(2);
  await expect(page.getByRole("textbox")).toHaveValue("");
});
