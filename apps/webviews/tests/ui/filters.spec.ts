import { expect } from "@playwright/test";
import { test } from "./fixtures";

test("GraphQL conditions reset dependent values and preserve rows after removal", async ({
  page,
  filtersPage,
}) => {
  await filtersPage.open();
  const combos = filtersPage.combobox;
  await combos.nth(0).click();
  await filtersPage.ageOption.click();
  await combos.nth(1).click();
  await filtersPage.eqOption.click();
  await filtersPage.textbox.fill("18");
  await filtersPage.addConditionButton.click();
  await combos.nth(2).click();
  await filtersPage.nameOption.click();
  await combos.nth(3).click();
  await filtersPage.eqOption.click();
  await filtersPage.textbox.nth(1).fill("alice");
  // Remove the first condition; the second retains its own identity and value.
  await filtersPage.conditions
    .first()
    .getByRole("button", { name: "Remove condition" })
    .click();
  await expect(filtersPage.textbox).toHaveValue("alice");
  // Changing the field clears the operation and value from the previous field.
  await combos.nth(0).click();
  await filtersPage.ageOption.click();
  await expect(filtersPage.textbox).toHaveValue("");
  await combos.nth(1).click();
  await filtersPage.inOption.click();
  await combos.nth(2).fill("21");
  await filtersPage.age21Option.click();
  await expect(filtersPage.remove21Button).toBeVisible();
  await page.keyboard.press("Escape");
  // Escape must also preserve tags once the options popup has unmounted.
  await expect(filtersPage.age21Option).toHaveCount(0);
  await combos.nth(2).press("Escape");
  await expect(filtersPage.remove21Button).toBeVisible();
  await filtersPage.confirmButton.click();
  await expect(filtersPage.filterData).toHaveText(
    '{"query":[{"name":"where","value":{"age":{"in":["21"]}}}]}',
  );
  await filtersPage.reopenFiltersButton.click();
  await expect(filtersPage.remove21Button).toBeVisible();
  await filtersPage.clearConditionsButton.click();
  await expect(filtersPage.combobox).toHaveCount(2);
  await expect(filtersPage.textbox).toHaveValue("");
});
