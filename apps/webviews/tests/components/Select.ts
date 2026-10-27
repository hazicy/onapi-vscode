import type { Locator, Page } from "@playwright/test";

/** Options are portaled, outside the trigger subtree. */
export class Select {
  constructor(
    readonly page: Page,
    readonly trigger: Locator,
  ) {}

  get arrow() {
    return this.page.locator('[class*="popupArrow"]');
  }

  option(name: string) {
    return this.page.getByRole("option", { name, exact: true });
  }

  async choose(name: string) {
    await this.trigger.click();
    await this.option(name).click();
  }
}
