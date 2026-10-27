import type { Page } from "@playwright/test";

export class ResizePage {
  constructor(readonly page: Page) {}

  async open(query = "") {
    await this.page.goto("/?resize" + query);
  }

  async dragDivider(offset: number) {
    const box = (await this.separator.boundingBox())!;
    await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(box.x + offset, box.y + box.height / 2, {
      steps: 10,
    });
    await this.page.mouse.up();
  }

  get requestContent() {
    return this.page.getByTestId("request-content");
  }

  get responseContent() {
    return this.page.getByTestId("response-content");
  }

  get separator() {
    return this.page.getByRole("separator");
  }

  get collapseResponseButton() {
    return this.page.getByRole("button", { name: "Collapse response" });
  }

  get responseCollapsed() {
    return this.page.getByText("Response collapsed", { exact: true });
  }

  get changeOrientationButton() {
    return this.page.getByRole("button", { name: "Change orientation" });
  }
}
