import type { Locator } from "@playwright/test";

export class CodeEditor {
  constructor(readonly root: Locator) {}

  get content() {
    return this.root.locator(".cm-content");
  }
  get lines() {
    return this.root.locator(".cm-line");
  }
  get lineNumbers() {
    return this.root.locator(".cm-lineNumbers");
  }

  async append(text: string) {
    await this.content.press("ControlOrMeta+End");
    await this.content.pressSequentially(text);
  }
}
