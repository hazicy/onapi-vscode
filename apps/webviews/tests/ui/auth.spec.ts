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
  await authPage.getTokenButton.click();
  await expect(authPage.alert).toHaveCount(3);
  expect(errors).toEqual([]);
});
