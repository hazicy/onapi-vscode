import type { Page } from "@playwright/test";
import { Select } from "../../components/Select";

export class BodyPage {
  readonly typeSelect: Select;

  constructor(readonly page: Page) {
    this.typeSelect = new Select(page, this.bodyTypeCombobox);
  }

  async open(query = "") {
    await this.page.goto("/?body" + query);
  }

  get bodyTab() {
    return this.page.getByRole("tab", { name: "Body", exact: true });
  }

  get bodyTypeCombobox() {
    return this.page.getByRole("combobox", {
      name: "Body type",
      exact: true,
    });
  }

  get tabpanel() {
    return this.page.getByRole("tabpanel");
  }

  get menuArrow() {
    return this.typeSelect.arrow;
  }

  get noBodyOption() {
    return this.typeSelect.option("No Body");
  }

  get multiPartOption() {
    return this.typeSelect.option("Multi-Part");
  }

  get bodyData() {
    return this.page.getByLabel("Body data");
  }

  get multiPartTab() {
    return this.page.getByRole("tab", { name: "Multi-Part", exact: true });
  }

  get jsonOption() {
    return this.typeSelect.option("JSON");
  }

  get jsonTab() {
    return this.page.getByRole("tab", { name: /^JSON(?: \d+)?$/ });
  }

  get xmlOption() {
    return this.typeSelect.option("XML");
  }

  get xmlTab() {
    return this.page.getByRole("tab", { name: /^XML(?: \d+)?$/ });
  }
}
