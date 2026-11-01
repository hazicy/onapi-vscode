import { expect } from "@playwright/test";
import { test } from "./fixtures";

test("auth edits preserve siblings, handle checkboxes, and follow request switches", async ({
  authPage,
}) => {
  await authPage.open();
  await authPage.username.fill("bob");
  await expect(authPage.password).toHaveValue("secret");
  await authPage.disableRetryCheckbox.check();
  await expect(authPage.authData).toContainText(
    '"key":"disableRetryRequest","value":true',
  );
  await authPage.switchRequestButton.click();
  await expect(authPage.username).toHaveValue("other");
  await expect(authPage.password).toHaveValue("");
});

test("Postman auth binds attribute lists and appends new fields", async ({
  authPage,
}) => {
  await authPage.open();
  await authPage.resetAuthButton.click();
  await authPage.setCredentials("updated", "new-secret");
  const auth = JSON.parse(await authPage.authData.innerText());
  expect(auth.basic).toEqual([
    { key: "username", value: "updated" },
    { key: "password", value: "new-secret", type: "string" },
  ]);
});

test("OAuth2 defaults render parameter tables and validate required token fields", async ({
  page,
  authPage,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await authPage.open();
  await authPage.oauth2Button.click();
  await expect(authPage.passwordCredentials).toBeVisible();
  const hint = page
    .getByText("Header Prefix", { exact: true })
    .locator('span[tabindex="0"]');
  await expect(hint).toHaveAttribute(
    "title",
    "Added to the Authorization header before the token.",
  );
  await expect(hint).toHaveAccessibleName(
    "Added to the Authorization header before the token.",
  );
  await authPage.getTokenButton.click();
  await expect(authPage.alert).toHaveCount(3);
  expect(errors).toEqual([]);
});

test("OAuth2 password flow dispatches the form request and keeps validation in the editor", async ({
  page,
  authPage,
}) => {
  await authPage.open();
  await authPage.oauth2Button.click();
  await page
    .getByLabel("Access Token URL", { exact: true })
    .fill("https://example.test/token");
  await page.getByLabel("Username", { exact: true }).last().fill("alice");
  await page.getByLabel("Password", { exact: true }).last().fill("secret");
  await authPage.getTokenButton.click();
  await expect(page.getByLabel("Auth commands")).toContainText(
    '"action":"/proxy/fetch"',
  );
  const commands = JSON.parse(
    await page.getByLabel("Auth commands").innerText(),
  );
  expect(commands[0].data).toMatchObject({
    url: "https://example.test/token",
    data: { grant_type: "password", username: "alice", password: "secret" },
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  await expect(authPage.alert).toHaveCount(0);
});

test("OAuth2 observes newly cached refresh tokens without changing the client", async ({
  page,
  authPage,
}) => {
  await authPage.open();
  await authPage.oauth2Button.click();
  await page
    .getByLabel("Access Token URL", { exact: true })
    .fill("https://example.test/token");
  await page.getByLabel("Username", { exact: true }).last().fill("alice");
  await page.getByLabel("Password", { exact: true }).last().fill("secret");
  await page.getByLabel("Client ID", { exact: true }).fill("client");
  await page.getByRole("button", { name: /Advanced configurations/ }).click();
  await page
    .getByLabel("Refresh Token URL", { exact: true })
    .fill("https://example.test/refresh");
  await expect(
    page.getByRole("button", { name: "Refresh", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Cache refresh token", exact: true })
    .click();
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.getByLabel("Auth commands")).toContainText(
    '"refresh_token":"cached-refresh-token"',
  );
  const commands = JSON.parse(
    await page.getByLabel("Auth commands").innerText(),
  );
  expect(commands[0].data.url).toBe("https://example.test/refresh");
});
