import type { Page } from "@playwright/test";

export class ThemePage {
  constructor(readonly page: Page) {}
  get styledState() {
    return this.page.getByText("Styled state", { exact: true });
  }

  get assertionState() {
    return this.page.getByText("Assertion state", { exact: true });
  }

  get graphQLDirection() {
    return this.page.getByText("GraphQL direction", { exact: true });
  }

  get sseDirection() {
    return this.page.getByText("SSE direction", { exact: true });
  }

  get themeButton() {
    return this.page.getByRole("button", { name: "Theme button" });
  }

  get themeInputTextbox() {
    return this.page.getByRole("textbox", { name: "Theme input" });
  }

  get themeSelectCombobox() {
    return this.page.getByRole("combobox", { name: "Theme select" });
  }

  get toggleThemeButton() {
    return this.page.getByRole("button", { name: "Toggle theme" });
  }

  get html() {
    return this.page.locator("html");
  }
  async open() {
    await this.page.goto("/?theme");
  }
}
