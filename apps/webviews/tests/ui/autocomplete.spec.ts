import { expect, test } from "@playwright/test";

test("editable select retains custom input and supports choosing options with the arrow", async ({
  page,
}) => {
  await page.goto("/?autocomplete");
  const input = page.getByRole("combobox");
  await input.click();
  await expect(page.getByRole("listbox")).toBeHidden();
  await input.fill("X-Custom-Header");
  await expect(page.getByRole("listbox")).toBeHidden();
  await page.getByRole("button", { name: "Outside", exact: true }).click();
  await expect(input).toHaveValue("X-Custom-Header");
  await page.getByRole("button", { name: "Show options", exact: true }).click();
  const arrow = page.locator('[class*="popupArrow"]');
  await expect(arrow).toBeVisible();
  const triggerBounds = await page
    .getByRole("button", { name: "Show options", includeHidden: true })
    .boundingBox();
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
  await page.getByRole("option", { name: "Content-Type", exact: true }).click();
  await expect(input).toHaveValue("Content-Type");
  await input.fill("X-Another-Header");
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(page.getByLabel("Current value")).toHaveText("X-Another-Header");
});

test("dropdown follows its input when the containing panel scrolls", async ({
  page,
}) => {
  await page.goto("/?autocomplete&scroll");
  const input = page.getByRole("combobox");
  await page.getByRole("button", { name: "Show options", exact: true }).click();
  const arrow = page.locator('[class*="popupArrow"]');
  await expect(arrow).toBeVisible();
  const inputBefore = await input.boundingBox();
  const arrowBefore = await arrow.boundingBox();
  expect(inputBefore).not.toBeNull();
  expect(arrowBefore).not.toBeNull();
  const originalGap = arrowBefore.y - inputBefore.y;
  await page.locator("main").evaluate((panel) => {
    panel.scrollTop = 20;
  });
  await expect
    .poll(async () => {
      const bounds = await input.boundingBox();
      return Math.round(inputBefore.y - bounds.y);
    })
    .toBe(20);
  await expect
    .poll(async () => {
      const bounds = await input.boundingBox();
      const tip = await arrow.boundingBox();
      return Math.abs(tip.y - bounds.y - originalGap);
    })
    .toBeLessThan(1);
  await page.getByRole("option", { name: "Accept", exact: true }).click();
  await expect(input).toHaveValue("Accept");
});
