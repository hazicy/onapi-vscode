import { expect, test } from "@playwright/test";

test("split panes retain percentage sizing, drag persistence, collapse and reset", async ({
  page,
}) => {
  await page.goto("/?resize");
  const request = page.getByTestId("request-content");
  const response = page.getByTestId("response-content");
  await expect(request).toBeVisible();
  const width = async () => (await request.boundingBox())!.width;
  await expect.poll(width).toBeGreaterThan(380);
  expect(await width()).toBeLessThan(410);
  const separator = page.getByRole("separator");
  const box = (await separator.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 150, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect.poll(width).toBeGreaterThan(500);
  const savedWidth = await width();
  await page.reload();
  await expect.poll(width).toBeCloseTo(savedWidth, 0);
  await page.getByRole("button", { name: "Collapse response" }).click();
  await expect(
    page.getByText("Response collapsed", { exact: true }),
  ).toBeVisible();
  await expect(response).toHaveCount(0);
  await page.getByText("Response collapsed", { exact: true }).click();
  await expect(response).toBeVisible();
  await expect.poll(width).toBeGreaterThan(380);
  expect(await width()).toBeLessThan(410);
  await page.getByRole("button", { name: "Change orientation" }).click();
  await expect
    .poll(async () => (await request.boundingBox())!.height)
    .toBeGreaterThan(180);
  await expect.poll(width).toBeGreaterThan(780);
});
