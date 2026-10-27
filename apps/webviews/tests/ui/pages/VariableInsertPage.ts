import type { Page } from "@playwright/test";

export class VariableInsertPage {
  constructor(readonly page: Page) {}

  async open(query = "") {
    await this.page.goto("/?variableInsert" + query);
  }

  get insertDynamicValueButton() {
    return this.page.getByRole("button", {
      name: "Insert dynamic value",
      exact: true,
    });
  }

  get dialog() {
    return this.page.getByRole("dialog");
  }
}
