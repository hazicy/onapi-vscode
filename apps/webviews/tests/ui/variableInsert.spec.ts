import { expect, test } from "@playwright/test";

test("dynamic value picker opens on the first click and reopens after dismissal", async ({
  page,
}) => {
  await page.goto("/?variableInsert");
  const trigger = page.getByRole("button", {
    name: "Insert dynamic value",
    exact: true,
  });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await page
    .getByRole("button", { name: "Insert dynamic value", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
