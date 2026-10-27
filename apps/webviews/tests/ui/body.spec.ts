import { expect } from "@playwright/test";
import { test } from "./fixtures";

test("Body type dropdown sits next to its tab and changes Postman body formats", async ({
  page,
  bodyPage,
}) => {
  await bodyPage.open();
  const tab = bodyPage.bodyTab;
  const selector = bodyPage.bodyTypeCombobox;
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
    bodyPage.tabpanel.getByRole("combobox", { name: "Body type" }),
  ).toHaveCount(0);
  await selector.click();
  for (const name of ["Form Data", "Text Content", "Other"]) {
    await expect(page.getByRole("group", { name, exact: true })).toBeVisible();
  }
  await expect(bodyPage.menuArrow).toBeVisible();
  await expect(bodyPage.noBodyOption.locator('[class*="check"]')).toBeVisible();
  await page.screenshot({ path: "test-results/body-type-menu.png" });
  await bodyPage.multiPartOption.click();
  await expect(bodyPage.bodyData).toContainText('"mode":"formdata"');
  await expect(bodyPage.multiPartTab).toBeVisible();
  await bodyPage.typeSelect.choose("JSON");
  await expect(bodyPage.jsonTab).toBeVisible();
  await expect(bodyPage.bodyData).toContainText('"mode":"raw"');
  await expect(bodyPage.bodyData).toContainText('"language":"json"');
  await bodyPage.typeSelect.choose("XML");
  await expect(bodyPage.xmlTab).toBeVisible();
  await expect(bodyPage.bodyData).toContainText('"language":"xml"');
  await bodyPage.typeSelect.choose("No Body");
  await expect(bodyPage.bodyTab).toBeVisible();
});
