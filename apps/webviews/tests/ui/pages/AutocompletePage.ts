import type { Page } from "@playwright/test";
import { Select } from "../../components/Select";

export class AutocompletePage {
  readonly select: Select;

  constructor(readonly page: Page) {
    this.select = new Select(page, this.showOptionsButton);
  }

  async open(query = "") {
    await this.page.goto("/?autocomplete" + query);
  }

  get input() {
    return this.page.getByRole("combobox");
  }

  get listbox() {
    return this.page.getByRole("listbox");
  }

  get outsideButton() {
    return this.page.getByRole("button", { name: "Outside", exact: true });
  }

  get showOptionsButton() {
    return this.page.getByRole("button", { name: "Show options", exact: true });
  }

  get menuArrow() {
    return this.select.arrow;
  }

  get hiddenOptionsButton() {
    return this.page.getByRole("button", {
      name: "Show options",
      includeHidden: true,
    });
  }

  get contentTypeOption() {
    return this.select.option("Content-Type");
  }

  get currentValue() {
    return this.page.getByLabel("Current value");
  }

  get scrollPanel() {
    return this.page.locator("main");
  }

  get acceptOption() {
    return this.select.option("Accept");
  }
}
