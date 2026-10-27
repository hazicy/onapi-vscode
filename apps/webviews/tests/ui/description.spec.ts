import { expect } from "@playwright/test";
import { test } from "./fixtures";

test.beforeEach(async ({ descriptionPage }) => {
  await descriptionPage.open();
});

test("selects a description and closes the popup", async ({
  descriptionPage,
}) => {
  await descriptionPage.commonParametersButton.click();
  await expect(descriptionPage.invalidEntryButton).toHaveCount(0);
  await expect(descriptionPage.builtInNameButton).toHaveCount(0);
  await descriptionPage.customNameButton.click();
  await expect(descriptionPage.selectedDescriptionStatus).toHaveText(
    "Custom name",
  );
  await expect(descriptionPage.customNameButton).toHaveCount(0);
});

test("filters by a trimmed exact key and handles no matches", async ({
  page,
  descriptionPage,
}) => {
  await descriptionPage.filterKey.fill(" name ");
  await descriptionPage.commonParametersButton.click();
  await expect(descriptionPage.customNameButton).toBeVisible();
  await expect(descriptionPage.customAgeButton).toHaveCount(0);
  await page.keyboard.press("Escape");
  await descriptionPage.filterKey.fill("missing");
  await descriptionPage.commonParametersButton.click();
  await expect(descriptionPage.customNameButton).toHaveCount(0);
});

test("updates built-in descriptions when the project setting changes", async ({
  page,
  descriptionPage,
}) => {
  await descriptionPage.toggleBuiltInDescriptionsButton.click();
  await descriptionPage.commonParametersButton.click();
  await expect(descriptionPage.builtInNameButton).toBeVisible();
  await page.keyboard.press("Escape");
  await descriptionPage.toggleBuiltInDescriptionsButton.click();
  await descriptionPage.commonParametersButton.click();
  await expect(descriptionPage.builtInNameButton).toHaveCount(0);
});

test("supports keyboard selection and restores focus on Escape", async ({
  page,
  descriptionPage,
}) => {
  const trigger = descriptionPage.commonParametersButton;
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(descriptionPage.customNameButton).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(descriptionPage.selectedDescriptionStatus).toHaveText(
    "Custom name",
  );
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(descriptionPage.customNameButton).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await descriptionPage.customNameButton.hover();
  // The selected-description status also contains this text after selection.
  await expect(descriptionPage.customName).toHaveCount(3);
  await expect(descriptionPage.customName.nth(1)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(descriptionPage.customNameButton).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("loads module styles, displays a tooltip, and dismisses on outside click", async ({
  descriptionPage,
}) => {
  await descriptionPage.commonParametersButton.click();
  const item = descriptionPage.customNameButton;
  await expect(item).toHaveCSS("width", "224px");
  await expect(item).toHaveCSS("text-overflow", "ellipsis");
  await item.hover();
  await expect(descriptionPage.customName).toHaveCount(2);
  await expect(descriptionPage.customName.last()).toBeVisible();
  await descriptionPage.outsideButton.click();
  await expect(item).toHaveCount(0);
});
