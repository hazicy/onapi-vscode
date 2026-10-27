import { expect } from "@playwright/test";
import { test } from "./fixtures";

test("split panes retain percentage sizing, drag persistence, collapse and reset", async ({
  page,
  resizePage,
}) => {
  await resizePage.open();
  const request = resizePage.requestContent;
  const response = resizePage.responseContent;
  await expect(request).toBeVisible();
  const width = async () => (await request.boundingBox())!.width;
  await expect.poll(width).toBeGreaterThan(380);
  expect(await width()).toBeLessThan(410);
  await resizePage.dragDivider(150);
  await expect.poll(width).toBeGreaterThan(500);
  const savedWidth = await width();
  await page.reload();
  await expect.poll(width).toBeCloseTo(savedWidth, 0);
  await resizePage.collapseResponseButton.click();
  await expect(resizePage.responseCollapsed).toBeVisible();
  await expect(response).toHaveCount(0);
  await resizePage.responseCollapsed.click();
  await expect(response).toBeVisible();
  await expect.poll(width).toBeGreaterThan(380);
  expect(await width()).toBeLessThan(410);
  await resizePage.changeOrientationButton.click();
  await expect
    .poll(async () => (await request.boundingBox())!.height)
    .toBeGreaterThan(180);
  await expect.poll(width).toBeGreaterThan(780);
});
