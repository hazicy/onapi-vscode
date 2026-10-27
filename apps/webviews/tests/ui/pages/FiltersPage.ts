import type { Page } from "@playwright/test";

export class FiltersPage {
  constructor(readonly page: Page) {}

  async open(query = "") {
    await this.page.goto("/?filters" + query);
  }

  get combobox() {
    return this.page.getByRole("combobox");
  }

  get ageOption() {
    return this.page.getByRole("option", { name: "age", exact: true });
  }

  get eqOption() {
    return this.page.getByRole("option", { name: "eq", exact: true });
  }

  get textbox() {
    return this.page.getByRole("textbox");
  }

  get addConditionButton() {
    return this.page.getByRole("button", { name: "Add Condition" });
  }

  get nameOption() {
    return this.page.getByRole("option", { name: "name", exact: true });
  }

  get conditions() {
    return this.page.locator("form > div");
  }

  get inOption() {
    return this.page.getByRole("option", { name: "in", exact: true });
  }

  get age21Option() {
    return this.page.getByRole("option", { name: "21", exact: true });
  }

  get confirmButton() {
    return this.page.getByRole("button", { name: "Confirm", exact: true });
  }

  get filterData() {
    return this.page.getByLabel("Filter data");
  }

  get reopenFiltersButton() {
    return this.page.getByRole("button", { name: "Reopen filters" });
  }

  get remove21Button() {
    return this.page.getByRole("button", { name: "Remove 21", exact: true });
  }

  get clearConditionsButton() {
    return this.page.getByRole("button", { name: "Clear Conditions" });
  }
}
