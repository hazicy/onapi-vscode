import type { Page } from "@playwright/test";

export class WebviewsPage {
  constructor(readonly page: Page) {}

  get rootChildren() {
    return this.page.locator("#root > *");
  }

  get root() {
    return this.page.locator("#root");
  }

  get tabs() {
    return this.page.getByRole("tab");
  }

  get paramsPanel() {
    return this.page.getByRole("tabpanel", {
      name: /^Params(?:\s*\d+)?$/,
    });
  }

  get requestUrl() {
    return this.page.getByRole("textbox", {
      name: "Enter URL or paste cURL text",
    });
  }

  get postOption() {
    return this.page.getByRole("option", { name: "POST", exact: true });
  }

  get codeEditorTextbox() {
    return this.page.getByRole("textbox", { name: "Code editor" });
  }
}
