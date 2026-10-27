import { expect } from "@playwright/test";
import { test } from "./fixtures";

test("editable select retains custom input and supports choosing options with the arrow", async ({
  autocompletePage,
}) => {
  await autocompletePage.open();
  const input = autocompletePage.input;
  await input.click();
  await expect(autocompletePage.listbox).toBeHidden();
  await input.fill("X-Custom-Header");
  await expect(autocompletePage.listbox).toBeHidden();
  await autocompletePage.outsideButton.click();
  await expect(input).toHaveValue("X-Custom-Header");
  await autocompletePage.showOptionsButton.click();
  const arrow = autocompletePage.menuArrow;
  await expect(arrow).toBeVisible();
  const triggerBounds =
    await autocompletePage.hiddenOptionsButton.boundingBox();
  const arrowBounds = await arrow.boundingBox();
  expect(triggerBounds).not.toBeNull();
  expect(arrowBounds).not.toBeNull();
  const fieldBounds = await input.locator("..").boundingBox();
  expect(fieldBounds).not.toBeNull();
  expect(arrowBounds!.y).toBeGreaterThanOrEqual(
    fieldBounds!.y + fieldBounds!.height,
  );
  expect(
    Math.abs(
      arrowBounds!.x +
        arrowBounds!.width / 2 -
        (triggerBounds!.x + triggerBounds!.width / 2),
    ),
  ).toBeLessThan(3);
  await autocompletePage.contentTypeOption.click();
  await expect(input).toHaveValue("Content-Type");
  await input.fill("X-Another-Header");
  await expect(autocompletePage.listbox).toBeHidden();
  await expect(autocompletePage.currentValue).toHaveText("X-Another-Header");
});

test("dropdown follows its input when the containing panel scrolls", async ({
  autocompletePage,
}) => {
  await autocompletePage.open("&scroll");
  const input = autocompletePage.input;
  await autocompletePage.showOptionsButton.click();
  const arrow = autocompletePage.menuArrow;
  await expect(arrow).toBeVisible();
  const inputBefore = await input.boundingBox();
  const arrowBefore = await arrow.boundingBox();
  expect(inputBefore).not.toBeNull();
  expect(arrowBefore).not.toBeNull();
  const originalGap = arrowBefore!.y - inputBefore!.y;
  await autocompletePage.scrollPanel.evaluate((panel) => {
    panel.scrollTop = 20;
  });
  await expect
    .poll(async () => {
      const bounds = await input.boundingBox();
      return Math.round(inputBefore!.y - bounds!.y);
    })
    .toBe(20);
  await expect
    .poll(async () => {
      const bounds = await input.boundingBox();
      const tip = await arrow.boundingBox();
      return Math.abs(tip!.y - bounds!.y - originalGap);
    })
    .toBeLessThan(1);
  await autocompletePage.acceptOption.click();
  await expect(input).toHaveValue("Accept");
});
