import { expect, test } from "@playwright/test";

test("Body type dropdown sits next to its tab and changes Postman body formats", async ({
  page,
}) => {
  await page.goto("/?body");
  const tab = page.getByRole("tab", { name: "Body", exact: true });
  const selector = page.getByRole("combobox", {
    name: "Body type",
    exact: true,
  });
  await expect(selector).toHaveCount(1);
  const tabBounds = await tab.boundingBox();
  const selectBounds = await selector.boundingBox();
  expect(selectBounds!.x).toBeGreaterThanOrEqual(
    tabBounds!.x + tabBounds!.width,
  );
  expect(selectBounds!.x - tabBounds!.x - tabBounds!.width).toBeLessThan(2);
  expect(
    Math.abs(
      selectBounds!.y +
        selectBounds!.height / 2 -
        tabBounds!.y -
        tabBounds!.height / 2,
    ),
  ).toBeLessThan(1);
  expect(selectBounds!.width).toBeLessThanOrEqual(22);
  await expect(selector.locator("svg")).toHaveCount(1);
  await expect(selector.locator("svg")).toHaveAttribute("width", "14");
  const textRight = await tab.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return range.getBoundingClientRect().right;
  });
  const iconBounds = await selector.locator("svg").boundingBox();
  expect(iconBounds!.x - textRight).toBeLessThanOrEqual(6);

  await expect(tab.getByRole("button")).toHaveCount(0);
  await expect(
    page.getByRole("tabpanel").getByRole("combobox", { name: "Body type" }),
  ).toHaveCount(0);
  await selector.click();
  for (const name of ["Form Data", "Text Content", "Other"]) {
    await expect(page.getByRole("group", { name, exact: true })).toBeVisible();
  }
  await expect(page.locator('[class*="popupArrow"]')).toBeVisible();
  await expect(
    page
      .getByRole("option", { name: "No Body", exact: true })
      .locator('[class*="check"]'),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/body-type-menu.png" });
  await page.getByRole("option", { name: "Multi-Part", exact: true }).click();
  await expect(page.getByLabel("Body data")).toContainText('"mode":"formdata"');
  await expect(
    page.getByRole("tab", { name: "Multi-Part", exact: true }),
  ).toBeVisible();
  await selector.click();
  await page.getByRole("option", { name: "JSON", exact: true }).click();
  await expect(
    page.getByRole("tab", { name: /^JSON(?: \d+)?$/ }),
  ).toBeVisible();
  await expect(page.getByLabel("Body data")).toContainText('"mode":"raw"');
  await expect(page.getByLabel("Body data")).toContainText('"language":"json"');
  await selector.click();
  await page.getByRole("option", { name: "XML", exact: true }).click();
  await expect(page.getByRole("tab", { name: /^XML(?: \d+)?$/ })).toBeVisible();
  await expect(page.getByLabel("Body data")).toContainText('"language":"xml"');
  await selector.click();
  await page.getByRole("option", { name: "No Body", exact: true }).click();
  await expect(
    page.getByRole("tab", { name: "Body", exact: true }),
  ).toBeVisible();
});
