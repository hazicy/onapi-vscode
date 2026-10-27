import type { Page } from "@playwright/test";

export class DrawerPage {
  constructor(readonly page: Page) {}

  async open(query = "") {
    await this.page.goto("/?drawer" + query);
  }

  get openDrawerButton() {
    return this.page.getByRole("button", {
      name: "Open drawer",
      exact: true,
    });
  }

  get testDrawerDialog() {
    return this.page.getByRole("dialog", { name: "Test drawer" });
  }

  get draft() {
    return this.page.getByLabel("Draft", { exact: true });
  }

  get closeCountIncludingHidden() {
    return this.page.getByRole("status", {
      name: "Close count",
      includeHidden: true,
    });
  }

  get transitionCompleteStatus() {
    return this.page.getByRole("status", { name: "Transition complete" });
  }

  get closeCount() {
    return this.page.getByRole("status", { name: "Close count" });
  }

  get copyCodeButton() {
    return this.page.getByRole("button", { name: "Copy code" });
  }

  get selectedOptionStatus() {
    return this.page.getByRole("status", { name: "Selected option" });
  }

  get doneButton() {
    return this.page.getByRole("button", { name: "Done", exact: true });
  }

  get openNestedDrawerButton() {
    return this.page.getByRole("button", { name: "Open nested drawer" });
  }

  get nestedDrawerDialog() {
    return this.page.getByRole("dialog", { name: "Nested drawer" });
  }
}
