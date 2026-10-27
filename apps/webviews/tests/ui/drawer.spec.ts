import { expect, test } from "@playwright/test";

test("custom defaults block Escape and mask dismissal, preserve state, and restore focus", async ({
  page,
}) => {
  await page.goto("/?drawer");
  const trigger = page.getByRole("button", {
    name: "Open drawer",
    exact: true,
  });
  await trigger.click();
  const drawer = page.getByRole("dialog", { name: "Test drawer" });
  await expect(drawer).toBeVisible();
  await expect(drawer).toHaveCSS("width", "1000px");
  await page.getByLabel("Draft", { exact: true }).fill("retained");
  await page.keyboard.press("Escape");
  await expect(drawer).toBeVisible();
  await page.mouse.click(10, 100);
  await expect(drawer).toBeVisible();
  await expect(
    page.getByRole("status", { name: "Close count", includeHidden: true }),
  ).toHaveText("0");
  await drawer.getByRole("button", { name: "Close", exact: true }).click();
  await expect(drawer).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(
    page.getByRole("status", { name: "Transition complete" }),
  ).toHaveText("false");
  await trigger.click();
  await expect(page.getByLabel("Draft", { exact: true })).toHaveValue(
    "retained",
  );
});

test("allows opted-in Escape and mask dismissal with a single callback", async ({
  page,
}) => {
  await page.goto("/?drawer&dismissible&width=600");
  const trigger = page.getByRole("button", {
    name: "Open drawer",
    exact: true,
  });
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Test drawer" })).toBeHidden();
  await expect(page.getByRole("status", { name: "Close count" })).toHaveText(
    "1",
  );
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Test drawer" })).toBeVisible();
  await page.mouse.click(10, 100);
  await expect(page.getByRole("dialog", { name: "Test drawer" })).toBeHidden();
  await expect(page.getByRole("status", { name: "Close count" })).toHaveText(
    "2",
  );
});

test("destroyOnClose resets children and accepts body styles, extra and footer", async ({
  page,
}) => {
  await page.goto("/?drawer&destroy");
  const trigger = page.getByRole("button", {
    name: "Open drawer",
    exact: true,
  });
  await trigger.click();
  const draft = page.getByLabel("Draft", { exact: true });
  await expect(draft.locator("..").locator("..")).toHaveCSS("padding", "0px");
  await draft.fill("temporary");
  await page.getByRole("button", { name: "Copy code" }).click();
  await expect(
    page.getByRole("status", { name: "Selected option" }),
  ).toHaveText("copied");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(draft).toHaveCount(0);
  await trigger.click();
  await expect(draft).toHaveValue("initial");
});

test("keeps legacy Select popups inside the focus boundary", async ({
  page,
}) => {
  await page.goto("/?drawer");
  await page.getByRole("button", { name: "Open drawer", exact: true }).click();
  const drawer = page.getByRole("dialog", { name: "Test drawer" });
  await drawer.getByRole("combobox").click();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(
    drawer.getByRole("status", { name: "Selected option" }),
  ).toHaveText("chosen");
  await expect(drawer).toBeVisible();
});

test("nested drawers close independently", async ({ page }) => {
  await page.goto("/?drawer&dismissible");
  await page.getByRole("button", { name: "Open drawer", exact: true }).click();
  await page.getByRole("button", { name: "Open nested drawer" }).click();
  await expect(
    page.getByRole("dialog", { name: "Nested drawer" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Nested drawer" }),
  ).toBeHidden();
  await expect(page.getByRole("dialog", { name: "Test drawer" })).toBeVisible();
  await expect(
    page.getByRole("status", { name: "Close count", includeHidden: true }),
  ).toHaveText("0");
});

test("supports top placement and fits narrow viewports", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/?drawer&side=top");
  await page.getByRole("button", { name: "Open drawer", exact: true }).click();
  const drawer = page.getByRole("dialog", { name: "Test drawer" });
  await expect(drawer).toHaveCSS("height", "240px");
  await expect(drawer).toHaveCSS("width", "375px");
  await expect(drawer).toHaveCSS("top", "0px");
});

test("named Drawer retains its dismissible defaults", async ({ page }) => {
  await page.goto("/?drawer&named");
  await page.getByRole("button", { name: "Open drawer", exact: true }).click();
  const drawer = page.getByRole("dialog", { name: "Test drawer" });
  await expect(drawer).toHaveCSS("width", "378px");
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
});
