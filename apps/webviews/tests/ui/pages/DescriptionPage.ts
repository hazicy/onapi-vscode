import type { Page } from "@playwright/test";

export class DescriptionPage {
  constructor(readonly page: Page) {}

  async open(query = "") {
    await this.page.goto("/" + query);
  }

  get commonParametersButton() {
    return this.page.getByRole("button", {
      name: "Common Parameters",
      exact: true,
    });
  }

  get invalidEntryButton() {
    return this.page.getByRole("button", {
      name: "Invalid entry",
      exact: true,
    });
  }

  get builtInNameButton() {
    return this.page.getByRole("button", {
      name: "Built-in name",
      exact: true,
    });
  }

  get customNameButton() {
    return this.page.getByRole("button", { name: "Custom name", exact: true });
  }

  get selectedDescriptionStatus() {
    return this.page.getByRole("status", { name: "Selected description" });
  }

  get filterKey() {
    return this.page.getByLabel("Filter key");
  }

  get customAgeButton() {
    return this.page.getByRole("button", { name: "Custom age", exact: true });
  }

  get toggleBuiltInDescriptionsButton() {
    return this.page.getByRole("button", {
      name: "Toggle built-in descriptions",
    });
  }

  get customName() {
    return this.page.getByText("Custom name", { exact: true });
  }

  get outsideButton() {
    return this.page.getByRole("button", { name: "Outside", exact: true });
  }
}
