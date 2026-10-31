import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/?environment");
});

test("shared configuration saves only after host confirmation and retains failed drafts", async ({
  page,
}) => {
  const config = page.getByRole("region", {
    name: "Shared configuration",
    exact: true,
  });
  const save = config.getByRole("button", { name: "Save", exact: true });
  await expect(save).toBeDisabled();
  await expect(config.getByRole("tab")).toHaveCount(3);
  await config.getByRole("tab", { name: "Scripts", exact: true }).click();
  await config.getByRole("button", { name: "Add script", exact: true }).click();
  await expect(config.getByText("Unsaved", { exact: true })).toBeVisible();
  await save.click();
  await expect(save).toBeDisabled();
  await expect(config.getByText("Saving…", { exact: true })).toBeVisible();
  await page.evaluate(() => {
    const sent = (window as any).environmentMessages.at(-1);
    window.dispatchEvent(
      new MessageEvent("message", {
        data: {
          action: "projectConfigSaved",
          requestId: sent.requestId,
          success: false,
        },
      }),
    );
  });
  await expect(config.getByRole("alert")).toHaveText("Save failed. Try again.");
  await expect(
    config.getByRole("button", { name: "Delete script", exact: true }),
  ).toHaveCount(1);
  await expect(save).toBeEnabled();
  await save.click();
  await page.evaluate(() => {
    const sent = (window as any).environmentMessages.at(-1);
    window.dispatchEvent(
      new MessageEvent("message", {
        data: {
          action: "projectConfigSaved",
          requestId: "unrelated",
          success: true,
        },
      }),
    );
  });
  await expect(config.getByText("Saving…", { exact: true })).toBeVisible();
  await page.evaluate(() => {
    const sent = (window as any).environmentMessages.at(-1);
    window.dispatchEvent(
      new MessageEvent("message", {
        data: {
          action: "projectConfigSaved",
          requestId: sent.requestId,
          success: true,
        },
      }),
    );
  });
  await expect(config.getByText("Saved", { exact: true })).toBeVisible();
  await expect(save).toBeDisabled();
  await config
    .getByRole("button", { name: "Post-response", exact: true })
    .click();
  await expect(
    config.getByRole("button", { name: "Delete script", exact: true }),
  ).toHaveCount(0);
  await config
    .getByRole("button", { name: "Pre-request", exact: true })
    .click();
  await expect(
    config.getByRole("button", { name: "Delete script", exact: true }),
  ).toHaveCount(1);
});

test("narrow container uses compact navigation without losing edits", async ({
  page,
}, testInfo) => {
  const workspace = page.getByRole("region", { name: "Environment workspace" });
  const config = page.getByRole("region", {
    name: "Shared configuration",
    exact: true,
  });
  await config.getByRole("tab", { name: "Scripts", exact: true }).click();
  await config.getByRole("button", { name: "Add script", exact: true }).click();
  await page.getByRole("button", { name: "Narrow panel", exact: true }).click();
  const navigation = workspace.getByRole("combobox", {
    name: "Configuration page",
    exact: true,
  });
  await expect(navigation).toBeVisible();
  await navigation.click();
  await page
    .getByRole("option", { name: "Global Variables", exact: true })
    .click();
  await expect(config).toBeHidden();
  await navigation.click();
  await page
    .getByRole("option", { name: "Shared configuration", exact: true })
    .click();
  await expect(config.getByText("Unsaved", { exact: true })).toBeVisible();
  await expect(
    config.getByRole("button", { name: "Delete script", exact: true }),
  ).toHaveCount(1);
  expect(
    await workspace.evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
  await workspace.screenshot({
    path: testInfo.outputPath("shared-config-narrow.png"),
  });
  await page.getByRole("button", { name: "Wide panel", exact: true }).click();
  await expect(navigation).toBeHidden();
  await workspace.screenshot({
    path: testInfo.outputPath("shared-config-wide.png"),
  });
});
