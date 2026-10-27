import { expect, test } from "@playwright/test";

test("auth edits preserve siblings, handle checkboxes, and follow request switches", async ({
  page,
}) => {
  await page.goto("/?auth");
  await page.getByLabel("Username", { exact: true }).fill("bob");
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue(
    "secret",
  );
  await page.getByRole("checkbox").check();
  await expect(page.getByLabel("Auth data")).toContainText(
    '"key":"disableRetryRequest","value":true',
  );
  await page.getByRole("button", { name: "Switch request" }).click();
  await expect(page.getByLabel("Username", { exact: true })).toHaveValue(
    "other",
  );
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue("");
});

test("Postman auth binds attribute lists and appends new fields", async ({
  page,
}) => {
  await page.goto("/?auth");
  await page.getByRole("button", { name: "Reset auth" }).click();
  await page.getByLabel("Username", { exact: true }).fill("updated");
  await page.getByLabel("Password", { exact: true }).fill("new-secret");
  const auth = JSON.parse(await page.getByLabel("Auth data").innerText());
  expect(auth.basic).toEqual([
    { key: "username", value: "updated" },
    { key: "password", value: "new-secret", type: "string" },
  ]);
});

test("OAuth2 defaults render parameter tables and validate required token fields", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?auth");
  await page.getByRole("button", { name: "OAuth2 auth", exact: true }).click();
  await expect(
    page.getByText("Password Credentials", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Get Token", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(3);
  expect(errors).toEqual([]);
});
