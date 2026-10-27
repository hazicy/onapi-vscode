import { test, expect } from "@playwright/test";

test("environment conflicts show cloud values and follow replacement props without exposing runtime values", async ({
  page,
}) => {
  await page.goto("/?environmentDiff");
  await expect(
    page.getByRole("button", { name: "Environment Variable List" }),
  ).toBeVisible();
  const editors = page.locator(".cm-mergeView");
  await expect(editors).toContainText("local-token");
  await expect(editors).toContainText("cloud-token");
  await expect(editors).not.toContainText("private-runtime-value");
  await page.getByRole("button", { name: "Switch conflict" }).click();
  await expect(editors).toContainText("another-cloud-token");
  await page.getByRole("button", { name: "Use same environment" }).click();
  await expect(editors).toHaveCount(0);
  await expect(
    page.getByText("Content is the same, no differences"),
  ).toBeVisible();
});
