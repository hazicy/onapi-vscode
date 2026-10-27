import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/?variableInsert&previewLifecycle");
});

test("an old completion cannot hide the current loading state or replace newer output", async ({
  page,
}) => {
  await expect(page.getByLabel("Preview requests")).toHaveText('["old"]');
  await page.getByRole("button", { name: "New preview input" }).click();
  await expect(page.getByLabel("Preview requests")).toHaveText('["old","new"]');
  await page.getByRole("button", { name: "Resolve old preview" }).click();
  await expect(page.getByLabel("Preview loading")).toHaveText("true");
  await expect(page.getByLabel("Preview result")).toBeEmpty();
  await page.getByRole("button", { name: "Resolve new preview" }).click();
  await expect(page.getByLabel("Preview result")).toHaveText("new:result");
  await expect(page.getByLabel("Preview loading")).toHaveText("false");
});

test("late failures cannot replace a newer success; current failures show their fallback", async ({
  page,
}) => {
  await expect(page.getByLabel("Preview requests")).toHaveText('["old"]');
  await page.getByRole("button", { name: "New preview input" }).click();
  await expect(page.getByLabel("Preview requests")).toHaveText('["old","new"]');
  await page.getByRole("button", { name: "Resolve new preview" }).click();
  await expect(page.getByLabel("Preview result")).toHaveText("new:result");
  await page.getByRole("button", { name: "Reject old preview" }).click();
  await expect(page.getByLabel("Preview result")).toHaveText("new:result");
  await page.getByRole("button", { name: "Refresh preview" }).click();
  await expect(page.getByLabel("Preview requests")).toHaveText(
    '["old","new","new"]',
  );
  await page.getByRole("button", { name: "Reject new preview" }).click();
  await expect(page.getByLabel("Preview result")).toHaveText("fallback:new");
  await expect(page.getByLabel("Preview loading")).toHaveText("false");
});

test("disabled and unmounted previews invalidate in-flight results", async ({
  page,
}) => {
  await expect(page.getByLabel("Preview requests")).toHaveText('["old"]');
  await page.getByRole("button", { name: "Disable preview" }).click();
  await page.getByRole("button", { name: "Resolve old preview" }).click();
  await expect(page.getByLabel("Preview result")).toBeEmpty();
  await expect(page.getByLabel("Preview loading")).toHaveText("false");
  await page.reload();
  await expect(page.getByLabel("Preview requests")).toHaveText('["old"]');
  await page.getByRole("button", { name: "Toggle preview mount" }).click();
  await page.getByRole("button", { name: "Resolve old preview" }).click();
  await page.getByRole("button", { name: "New preview input" }).click();
  await page.getByRole("button", { name: "Toggle preview mount" }).click();
  await expect(page.getByLabel("Preview requests")).toHaveText('["old","new"]');
  await page.getByRole("button", { name: "Resolve new preview" }).click();
  await expect(page.getByLabel("Preview result")).toHaveText("new:result");
});
