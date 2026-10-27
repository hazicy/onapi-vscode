import { expect } from "@playwright/test";
import { test } from "./fixtures";

test("dynamic value picker opens on the first click and reopens after dismissal", async ({
  page,
  variableInsertPage,
}) => {
  await variableInsertPage.open();
  const trigger = variableInsertPage.insertDynamicValueButton;
  await trigger.click();
  await expect(variableInsertPage.dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(variableInsertPage.dialog).toBeHidden();
  await variableInsertPage.insertDynamicValueButton.click();
  await expect(variableInsertPage.dialog).toBeVisible();
});
