import type { Page } from "@playwright/test";

export class AuthPage {
  constructor(readonly page: Page) {}

  async open(query = "") {
    await this.page.goto("/?auth" + query);
  }

  async setCredentials(username: string, password: string) {
    await this.username.fill(username);
    await this.password.fill(password);
  }

  get username() {
    return this.page.getByLabel("Username", { exact: true });
  }

  get password() {
    return this.page.getByLabel("Password", { exact: true });
  }

  get disableRetryCheckbox() {
    return this.page.getByRole("checkbox");
  }

  get authData() {
    return this.page.getByLabel("Auth data");
  }

  get switchRequestButton() {
    return this.page.getByRole("button", { name: "Switch request" });
  }

  get resetAuthButton() {
    return this.page.getByRole("button", { name: "Reset auth" });
  }

  get oauth2Button() {
    return this.page.getByRole("button", { name: "OAuth2 auth", exact: true });
  }

  get passwordCredentials() {
    return this.page.getByText("Password Credentials", { exact: false });
  }

  get getTokenButton() {
    return this.page.getByRole("button", { name: "Get Token", exact: true });
  }

  get alert() {
    return this.page.getByRole("alert");
  }
}
